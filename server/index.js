const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
const TRADE_FIELDS = [
  "strategy", "entry", "reason", "tp", "sl", "result", "learning", "asset_pair",
  "rr", "session", "screenshot_url", "after_trade_screenshot_url", "trade_date",
];

const normalizeTradeBody = (body = {}, includeMissing = false) => {
  const pairs = [
    ["strategy", ["strategy"]],
    ["entry", ["entry"]],
    ["reason", ["reason"]],
    ["tp", ["tp"]],
    ["sl", ["sl"]],
    ["result", ["result"]],
    ["learning", ["learning"]],
    ["asset_pair", ["asset_pair", "assetPair"]],
    ["rr", ["rr"]],
    ["session", ["session"]],
    ["screenshot_url", ["screenshot_url", "screenshot"]],
    ["after_trade_screenshot_url", ["after_trade_screenshot_url", "afterTradeScreenshot"]],
    ["trade_date", ["trade_date", "tradeDate"]],
  ];
  return pairs.reduce((acc, [column, keys]) => {
    const key = keys.find((k) => Object.prototype.hasOwnProperty.call(body, k));
    if (key || includeMissing) acc[column] = key ? (body[key] || null) : null;
    return acc;
  }, {});
};

app.get("/api/trades", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM trades ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/trades/:id", async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM trades WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/trades", async (req, res) => {
  try {
    const b = normalizeTradeBody(req.body, true);
    const { rows } = await query(
      `INSERT INTO trades (strategy, entry, reason, tp, sl, result, learning, asset_pair, rr, session, screenshot_url, after_trade_screenshot_url, trade_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [b.strategy, b.entry, b.reason, b.tp, b.sl, b.result, b.learning, b.asset_pair, b.rr, b.session, b.screenshot_url, b.after_trade_screenshot_url, b.trade_date]
    );
    logActivity("TRADE_CREATE", `Forex trade ${rows[0].id}`);
    res.json(rows[0]);
  } catch (e) {
    console.error("POST /api/trades:", e);
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/trades/:id", async (req, res) => {
  try {
    const b = normalizeTradeBody(req.body);
    const sets = []; const vals = []; let i = 1;
    for (const f of TRADE_FIELDS) if (f in b) { sets.push(`${f}=$${i++}`); vals.push(b[f]); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    const { rows } = await query(`UPDATE trades SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    logActivity("TRADE_UPDATE", `Forex trade ${req.params.id}`);
    res.json(rows[0]);
  } catch (e) {
    console.error("PUT /api/trades/:id:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/trades/:id", async (req, res) => {
  try {
    await query("DELETE FROM trades WHERE id = $1", [req.params.id]);
    logActivity("TRADE_DELETE", `Forex trade ${req.params.id}`);
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
    let bytes = 0;
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const f of files) bytes += fs.statSync(path.join(UPLOAD_DIR, f)).size;
    } catch { /* ignore */ }
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    res.json({ totalTrades: t.rows[0].c, storageUsed: `${mb} MB` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Public share ----------
app.get("/api/public/trades", async (_req, res) => {
  try {
    const prof = (await query("SELECT share_enabled FROM profile WHERE id='admin'")).rows[0];
    if (!prof?.share_enabled) return res.json([]);
    const { rows } = await query(
      "SELECT id, sno, entry, result, asset_pair, rr, strategy, session, trade_date, created_at FROM trades ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- System / Resource usage ----------
let lastCpu = { idle: 0, total: 0 };
function cpuPercent() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const c of cpus) {
    for (const t of Object.values(c.times)) total += t;
    idle += c.times.idle;
  }
  const idleDiff = idle - lastCpu.idle;
  const totalDiff = total - lastCpu.total;
  lastCpu = { idle, total };
  if (totalDiff <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
}
cpuPercent(); // prime sample

function dirSizeBytes(dir) {
  let bytes = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      try {
        const st = fs.statSync(path.join(dir, f));
        if (st.isFile()) bytes += st.size;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return bytes;
}

app.get("/api/system/stats", async (_req, res) => {
  try {
    const t = await query("SELECT COUNT(*)::int AS c FROM trades");
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const upload = dirSizeBytes(UPLOAD_DIR);
    let dbBytes = 0;
    try {
      const r = await query("SELECT pg_database_size(current_database())::bigint AS s");
      dbBytes = Number(r.rows[0]?.s || 0);
    } catch { /* ignore */ }
    const prof = (await query("SELECT username, full_name FROM profile WHERE id='admin'")).rows[0] || {};
    res.json({
      username: prof.username || prof.full_name || "admin",
      totalTrades: t.rows[0].c,
      storageBytes: upload + dbBytes,
      uploadsBytes: upload,
      databaseBytes: dbBytes,
      cpuPercent: cpuPercent(),
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        percent: Math.round((usedMem / totalMem) * 100),
      },
      uptimeSeconds: Math.round(process.uptime()),
      loadAvg: os.loadavg(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/system/timeline", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(String(req.query.days || "7"), 10) || 7));
    const { rows } = await query(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS trades
       FROM trades
       WHERE created_at >= NOW() - ($1::int || ' days')::interval
       GROUP BY 1 ORDER BY 1`,
      [days]
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
