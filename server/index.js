const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cors = require("cors");
const { query } = require("./db");
const { init } = require("./init");

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/data/uploads";
const STATIC_DIR = path.join(__dirname, "..", "dist");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ---------- Uploads ----------
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post("/api/uploads", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

// ---------- Activity helper ----------
async function logActivity(action, details) {
  try {
    await query(
      "INSERT INTO activity_logs (action, details) VALUES ($1, $2)",
      [action, details || null]
    );
  } catch (e) {
    console.error("logActivity:", e.message);
  }
}

// ---------- Auth (frontend hardcoded; this is a stub) ----------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === "Saeeddev" && password === "Saeed@@2026&&") {
    logActivity("LOGIN", `Admin signed in`);
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

// ---------- Profile (single row, id='admin') ----------
app.get("/api/profile", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM profile WHERE id = 'admin'");
    res.json(rows[0] || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/profile", async (req, res) => {
  try {
    const allowed = ["full_name", "email", "phone", "username", "avatar_url", "share_enabled"];
    const sets = [];
    const vals = [];
    let i = 1;
    for (const k of allowed) {
      if (k in req.body) { sets.push(`${k} = $${i++}`); vals.push(req.body[k]); }
    }
    if (!sets.length) return res.json({ ok: true });
    await query(`UPDATE profile SET ${sets.join(", ")}, updated_at = NOW() WHERE id = 'admin'`, vals);
    logActivity("PROFILE_UPDATE", "Profile updated");
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Strategies ----------
app.get("/api/strategies", async (_req, res) => {
  try {
    const { rows } = await query("SELECT strategies FROM profile WHERE id = 'admin'");
    res.json({ strategies: rows[0]?.strategies || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/strategies", async (req, res) => {
  try {
    const list = Array.isArray(req.body?.strategies) ? req.body.strategies : [];
    await query("UPDATE profile SET strategies = $1, updated_at = NOW() WHERE id = 'admin'", [list]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Forex Trades ----------
app.get("/api/trades", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM trades ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/trades", async (req, res) => {
  try {
    const b = req.body || {};
    const { rows } = await query(
      `INSERT INTO trades (strategy, entry, reason, tp, sl, result, learning, asset_pair, rr, screenshot_url, after_trade_screenshot_url, trade_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.strategy, b.entry, b.reason, b.tp, b.sl, b.result, b.learning, b.asset_pair, b.rr, b.screenshot_url, b.after_trade_screenshot_url, b.trade_date || null]
    );
    logActivity("TRADE_CREATE", `Forex trade ${rows[0].id}`);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/trades/:id", async (req, res) => {
  try {
    const fields = ["strategy","entry","reason","tp","sl","result","learning","asset_pair","rr","screenshot_url","after_trade_screenshot_url","trade_date"];
    const sets = []; const vals = []; let i = 1;
    for (const f of fields) if (f in req.body) { sets.push(`${f}=$${i++}`); vals.push(req.body[f]); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    const { rows } = await query(`UPDATE trades SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`, vals);
    logActivity("TRADE_UPDATE", `Forex trade ${req.params.id}`);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/trades/:id", async (req, res) => {
  try {
    await query("DELETE FROM trades WHERE id = $1", [req.params.id]);
    logActivity("TRADE_DELETE", `Forex trade ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- PSX Trades ----------
function computePsx(b) {
  const entry = parseFloat(b.entry_price);
  const exit = b.tp_exit_price != null ? parseFloat(b.tp_exit_price) : null;
  const shares = parseInt(b.shares_purchased, 10);
  let profit_loss = null, result = "pending";
  if (exit != null && !isNaN(exit) && !isNaN(entry) && !isNaN(shares)) {
    profit_loss = (exit - entry) * shares;
    result = profit_loss > 0 ? "win" : profit_loss < 0 ? "loss" : "breakeven";
  }
  return { profit_loss, result };
}

app.get("/api/psx-trades", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM psx_trades ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/psx-trades", async (req, res) => {
  try {
    const b = req.body || {};
    const { profit_loss, result } = computePsx(b);
    const { rows } = await query(
      `INSERT INTO psx_trades (strategy, stock_symbol, shares_purchased, entry_price, trade_logic, tp_exit_price, profit_loss, result, trade_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.strategy, b.stock_symbol, b.shares_purchased, b.entry_price, b.trade_logic, b.tp_exit_price, profit_loss, result, b.trade_date]
    );
    logActivity("TRADE_CREATE", `PSX trade ${rows[0].id}`);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/psx-trades/:id", async (req, res) => {
  try {
    const b = req.body || {};
    // Load existing to merge
    const existing = (await query("SELECT * FROM psx_trades WHERE id=$1", [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: "Not found" });
    const merged = { ...existing, ...b };
    const { profit_loss, result } = computePsx(merged);
    const { rows } = await query(
      `UPDATE psx_trades SET strategy=$1, stock_symbol=$2, shares_purchased=$3, entry_price=$4, trade_logic=$5, tp_exit_price=$6, profit_loss=$7, result=$8
       WHERE id=$9 RETURNING *`,
      [merged.strategy, merged.stock_symbol, merged.shares_purchased, merged.entry_price, merged.trade_logic, merged.tp_exit_price, profit_loss, result, req.params.id]
    );
    logActivity("TRADE_UPDATE", `PSX trade ${req.params.id}`);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/psx-trades/:id", async (req, res) => {
  try {
    await query("DELETE FROM psx_trades WHERE id = $1", [req.params.id]);
    logActivity("TRADE_DELETE", `PSX trade ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Activity logs ----------
app.get("/api/activity-logs", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Admin stats ----------
app.get("/api/admin/stats", async (_req, res) => {
  try {
    const t = await query("SELECT COUNT(*)::int AS c FROM trades");
    const p = await query("SELECT COUNT(*)::int AS c FROM psx_trades");
    let bytes = 0;
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const f of files) bytes += fs.statSync(path.join(UPLOAD_DIR, f)).size;
    } catch { /* ignore */ }
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    res.json({ totalTrades: t.rows[0].c, totalPsxTrades: p.rows[0].c, storageUsed: `${mb} MB` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Public share ----------
app.get("/api/public/trades", async (_req, res) => {
  try {
    const prof = (await query("SELECT share_enabled FROM profile WHERE id='admin'")).rows[0];
    if (!prof?.share_enabled) return res.json([]);
    const { rows } = await query(
      "SELECT id, sno, entry, result, asset_pair, rr, strategy, trade_date, created_at FROM trades ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Static frontend ----------
if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });
}

// ---------- Startup ----------
init()
  .then(() => app.listen(PORT, () => console.log(`Server on :${PORT}`)))
  .catch((e) => { console.error("Init failed:", e); process.exit(1); });
