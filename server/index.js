const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { query } = require("./db");
const { init } = require("./init");

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/data/uploads";
const STATIC_DIR = path.join(__dirname, "..", "dist");
const JWT_SECRET = process.env.JWT_SECRET || "tj-dev-secret-change-me";
const COOKIE_NAME = "tj_session";
const ADMIN_DEFAULT_USER = "Saeeddev";
const ADMIN_DEFAULT_PASS = "Saeed@@2026&&";

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ---------- Uploads ----------
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

// ---------- Activity ----------
async function logActivity(userId, action, details) {
  try {
    await query(
      "INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId || null, action, details || null]
    );
  } catch (e) { console.error("logActivity:", e.message); }
}

// ---------- Schema guard ----------
let schemaReadyPromise = null;

async function ensureRuntimeSchema() {
  await query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Users table (multi-user)
  await query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'trader',
    share_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    strategies TEXT[] NOT NULL DEFAULT ARRAY['Strategy 1','Strategy 2','Strategy 3'],
    theme_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const userCols = [
    ["email", "TEXT"], ["full_name", "TEXT"], ["phone", "TEXT"], ["avatar_url", "TEXT"],
    ["role", "TEXT NOT NULL DEFAULT 'trader'"],
    ["share_enabled", "BOOLEAN NOT NULL DEFAULT FALSE"],
    ["strategies", "TEXT[] NOT NULL DEFAULT ARRAY['Strategy 1','Strategy 2','Strategy 3']"],
    ["theme_settings", "JSONB NOT NULL DEFAULT '{}'::jsonb"],
    ["created_at", "TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
    ["updated_at", "TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
  ];
  for (const [n, d] of userCols) await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${n} ${d}`);

  // Migrate legacy `profile` row into users if needed
  const legacy = await query("SELECT to_regclass('public.profile') AS t");
  if (legacy.rows[0]?.t) {
    try {
      const r = await query("SELECT * FROM profile WHERE id = 'admin'");
      const p = r.rows[0];
      if (p) {
        const exists = await query("SELECT id FROM users WHERE id = 'admin'");
        if (!exists.rows[0]) {
          const hash = await bcrypt.hash(ADMIN_DEFAULT_PASS, 10);
          await query(
            `INSERT INTO users (id, username, email, full_name, phone, avatar_url, password_hash, role, share_enabled, strategies, theme_settings)
             VALUES ('admin', $1, $2, $3, $4, $5, $6, 'admin', $7, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            [p.username || ADMIN_DEFAULT_USER, p.email, p.full_name, p.phone, p.avatar_url,
             hash, !!p.share_enabled, p.strategies || ["Strategy 1","Strategy 2","Strategy 3"], p.theme_settings || {}]
          );
        }
      }
    } catch (e) { console.error("legacy migrate:", e.message); }
  }

  // Ensure default admin exists
  const admin = await query("SELECT id FROM users WHERE id = 'admin'");
  if (!admin.rows[0]) {
    const hash = await bcrypt.hash(ADMIN_DEFAULT_PASS, 10);
    await query(
      `INSERT INTO users (id, username, email, full_name, password_hash, role)
       VALUES ('admin', $1, 'admin@local', 'Admin', $2, 'admin') ON CONFLICT DO NOTHING`,
      [ADMIN_DEFAULT_USER, hash]
    );
  }

  // Trades table
  await query(`CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    sno INTEGER,
    strategy TEXT,
    entry TEXT,
    reason TEXT,
    tp TEXT,
    sl TEXT,
    result TEXT,
    learning TEXT,
    asset_pair TEXT,
    rr TEXT,
    "session" TEXT,
    screenshot_url TEXT,
    after_trade_screenshot_url TEXT,
    trade_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const tradeCols = [
    ["user_id", "TEXT"], ["sno", "INTEGER"], ["strategy", "TEXT"], ["entry", "TEXT"], ["reason", "TEXT"],
    ["tp", "TEXT"], ["sl", "TEXT"], ["result", "TEXT"], ["learning", "TEXT"],
    ["asset_pair", "TEXT"], ["rr", "TEXT"], ["session", "TEXT"], ["screenshot_url", "TEXT"],
    ["after_trade_screenshot_url", "TEXT"], ["trade_date", "DATE"],
    ["created_at", "TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
  ];
  for (const [n, d] of tradeCols) await query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS "${n}" ${d}`);
  await query("UPDATE trades SET user_id = 'admin' WHERE user_id IS NULL");
  await query("CREATE SEQUENCE IF NOT EXISTS trades_sno_seq OWNED BY trades.sno");
  await query("ALTER TABLE trades ALTER COLUMN sno SET DEFAULT nextval('trades_sno_seq')");
  await query("UPDATE trades SET sno = nextval('trades_sno_seq') WHERE sno IS NULL");
  await query("SELECT setval('trades_sno_seq', GREATEST((SELECT COALESCE(MAX(sno), 0) FROM trades), 1), (SELECT COALESCE(MAX(sno), 0) FROM trades) > 0)");
  await query("CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades(user_id, created_at DESC)");

  await query(`CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await query("ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_id TEXT");
  await query("CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC)");
}

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = ensureRuntimeSchema().catch((e) => { schemaReadyPromise = null; throw e; });
  }
  return schemaReadyPromise;
}

// ---------- Auth middleware ----------
function issueToken(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true behind HTTPS proxy if desired
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

async function readUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await query("SELECT id, username, email, full_name, phone, avatar_url, role, share_enabled, strategies, theme_settings, created_at FROM users WHERE id = $1", [decoded.sub]);
    return rows[0] || null;
  } catch { return null; }
}

async function requireAuth(req, res, next) {
  await ensureSchema();
  const user = await readUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
    next();
  });
}

// ---------- Uploads route ----------
app.post("/api/uploads", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ---------- Auth routes ----------
app.post("/api/auth/login", async (req, res) => {
  try {
    await ensureSchema();
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
    const { rows } = await query(
      "SELECT * FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1) LIMIT 1",
      [String(username).trim()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    issueToken(res, user);
    logActivity(user.id, "LOGIN", `${user.username} signed in`);
    res.json({
      id: user.id, username: user.username, email: user.email,
      full_name: user.full_name, role: user.role, avatar_url: user.avatar_url,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  try {
    await ensureSchema();
    const u = await readUser(req);
    if (!u) return res.status(401).json({ error: "Not authenticated" });
    res.json({
      id: u.id, username: u.username, email: u.email,
      full_name: u.full_name, role: u.role, avatar_url: u.avatar_url,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Profile ----------
app.get("/api/profile", requireAuth, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const u = rows[0];
    if (!u) return res.status(404).json({ error: "Not found" });
    delete u.password_hash;
    res.json(u);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/profile", requireAuth, async (req, res) => {
  try {
    const allowed = ["full_name", "email", "phone", "username", "avatar_url", "share_enabled", "theme_settings"];
    const sets = []; const vals = []; let i = 1;
    for (const k of allowed) if (k in req.body) { sets.push(`${k} = $${i++}`); vals.push(req.body[k]); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.user.id);
    await query(`UPDATE users SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${i}`, vals);
    logActivity(req.user.id, "PROFILE_UPDATE", "Profile updated");
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Strategies ----------
app.get("/api/strategies", requireAuth, async (req, res) => {
  try {
    const { rows } = await query("SELECT strategies FROM users WHERE id = $1", [req.user.id]);
    res.json({ strategies: rows[0]?.strategies || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/strategies", requireAuth, async (req, res) => {
  try {
    const list = Array.isArray(req.body?.strategies) ? req.body.strategies : [];
    await query("UPDATE users SET strategies = $1, updated_at = NOW() WHERE id = $2", [list, req.user.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Trades ----------
const TRADE_FIELDS = [
  "strategy", "entry", "reason", "tp", "sl", "result", "learning", "asset_pair",
  "rr", "session", "screenshot_url", "after_trade_screenshot_url", "trade_date",
];

const normalizeTradeBody = (body = {}, includeMissing = false) => {
  const pairs = [
    ["strategy", ["strategy"]], ["entry", ["entry"]], ["reason", ["reason"]],
    ["tp", ["tp"]], ["sl", ["sl"]], ["result", ["result"]], ["learning", ["learning"]],
    ["asset_pair", ["asset_pair", "assetPair"]], ["rr", ["rr"]], ["session", ["session"]],
    ["screenshot_url", ["screenshot_url", "screenshot"]],
    ["after_trade_screenshot_url", ["after_trade_screenshot_url", "afterTradeScreenshot"]],
    ["trade_date", ["trade_date", "tradeDate"]],
  ];
  return pairs.reduce((acc, [col, keys]) => {
    const key = keys.find((k) => Object.prototype.hasOwnProperty.call(body, k));
    if (key || includeMissing) acc[col] = key ? (body[key] || null) : null;
    return acc;
  }, {});
};

app.get("/api/trades", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/trades/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM trades WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/trades", requireAuth, async (req, res) => {
  try {
    const b = normalizeTradeBody(req.body, true);
    const { rows } = await query(
      `INSERT INTO trades (user_id, strategy, entry, reason, tp, sl, result, learning, asset_pair, rr, "session", screenshot_url, after_trade_screenshot_url, trade_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.id, b.strategy, b.entry, b.reason, b.tp, b.sl, b.result, b.learning, b.asset_pair, b.rr, b.session, b.screenshot_url, b.after_trade_screenshot_url, b.trade_date]
    );
    logActivity(req.user.id, "TRADE_CREATE", `Trade ${rows[0].id}`);
    res.json(rows[0]);
  } catch (e) { console.error("POST /api/trades:", e); res.status(500).json({ error: e.message }); }
});

app.put("/api/trades/:id", requireAuth, async (req, res) => {
  try {
    const b = normalizeTradeBody(req.body);
    const sets = []; const vals = []; let i = 1;
    for (const f of TRADE_FIELDS) if (f in b) { sets.push(`"${f}"=$${i++}`); vals.push(b[f]); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id, req.user.id);
    const { rows } = await query(
      `UPDATE trades SET ${sets.join(", ")} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    logActivity(req.user.id, "TRADE_UPDATE", `Trade ${req.params.id}`);
    res.json(rows[0]);
  } catch (e) { console.error("PUT /api/trades/:id:", e); res.status(500).json({ error: e.message }); }
});

app.delete("/api/trades/:id", requireAuth, async (req, res) => {
  try {
    await query("DELETE FROM trades WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    logActivity(req.user.id, "TRADE_DELETE", `Trade ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Activity ----------
app.get("/api/activity-logs", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? "" : "WHERE user_id = $1";
    const params = req.user.role === "admin" ? [] : [req.user.id];
    const { rows } = await query(`SELECT * FROM activity_logs ${filter} ORDER BY created_at DESC LIMIT 200`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Admin: stats + members ----------
app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const t = await query("SELECT COUNT(*)::int AS c FROM trades");
    const u = await query("SELECT COUNT(*)::int AS c FROM users");
    let bytes = 0;
    try { for (const f of fs.readdirSync(UPLOAD_DIR)) bytes += fs.statSync(path.join(UPLOAD_DIR, f)).size; } catch { /* ignore */ }
    res.json({ totalTrades: t.rows[0].c, totalUsers: u.rows[0].c, storageUsed: `${(bytes / (1024 * 1024)).toFixed(2)} MB` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, username, email, full_name, phone, role, created_at FROM users ORDER BY created_at ASC"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { username, email, full_name, phone, password, role } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const dupe = await query("SELECT id FROM users WHERE lower(username)=lower($1) LIMIT 1", [username]);
    if (dupe.rows[0]) return res.status(409).json({ error: "Username already exists" });
    const hash = await bcrypt.hash(String(password), 10);
    const id = "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    await query(
      `INSERT INTO users (id, username, email, full_name, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, username, email || null, full_name || null, phone || null, hash, role === "admin" ? "admin" : "trader"]
    );
    logActivity(req.user.id, "USER_CREATE", `Created ${username}`);
    res.json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const { username, email, full_name, phone, password, role } = req.body || {};
    const sets = []; const vals = []; let i = 1;
    if (username != null) { sets.push(`username = $${i++}`); vals.push(username); }
    if (email != null) { sets.push(`email = $${i++}`); vals.push(email); }
    if (full_name != null) { sets.push(`full_name = $${i++}`); vals.push(full_name); }
    if (phone != null) { sets.push(`phone = $${i++}`); vals.push(phone); }
    if (role != null) { sets.push(`role = $${i++}`); vals.push(role === "admin" ? "admin" : "trader"); }
    if (password) { sets.push(`password_hash = $${i++}`); vals.push(await bcrypt.hash(String(password), 10)); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    await query(`UPDATE users SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${i}`, vals);
    logActivity(req.user.id, "USER_UPDATE", `Updated ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    if (req.params.id === "admin") return res.status(400).json({ error: "Cannot delete primary admin" });
    if (req.params.id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
    await query("DELETE FROM trades WHERE user_id = $1", [req.params.id]);
    await query("DELETE FROM users WHERE id = $1", [req.params.id]);
    logActivity(req.user.id, "USER_DELETE", `Deleted ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Public share (per user) ----------
app.get("/api/public/trades/:userId?", async (req, res) => {
  try {
    await ensureSchema();
    const userId = req.params.userId;
    let userRow;
    if (userId) {
      userRow = (await query("SELECT id, share_enabled FROM users WHERE id = $1", [userId])).rows[0];
    } else {
      userRow = (await query("SELECT id, share_enabled FROM users WHERE id = 'admin'")).rows[0];
    }
    if (!userRow?.share_enabled) return res.json([]);
    const { rows } = await query(
      `SELECT id, sno, entry, result, asset_pair, rr, strategy, "session", trade_date, created_at
       FROM trades WHERE user_id = $1 ORDER BY created_at DESC`,
      [userRow.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- System / Resource usage ----------
let lastCpu = { idle: 0, total: 0 };
function cpuPercent() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const c of cpus) { for (const t of Object.values(c.times)) total += t; idle += c.times.idle; }
  const idleDiff = idle - lastCpu.idle;
  const totalDiff = total - lastCpu.total;
  lastCpu = { idle, total };
  if (totalDiff <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
}
cpuPercent();

function dirSizeBytes(dir) {
  let bytes = 0;
  try { for (const f of fs.readdirSync(dir)) { try { const st = fs.statSync(path.join(dir, f)); if (st.isFile()) bytes += st.size; } catch { /* skip */ } } } catch { /* skip */ }
  return bytes;
}

app.get("/api/system/stats", requireAuth, async (req, res) => {
  try {
    const t = await query("SELECT COUNT(*)::int AS c FROM trades WHERE user_id = $1", [req.user.id]);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const upload = dirSizeBytes(UPLOAD_DIR);
    let dbBytes = 0;
    try { const r = await query("SELECT pg_database_size(current_database())::bigint AS s"); dbBytes = Number(r.rows[0]?.s || 0); } catch { /* ignore */ }
    res.json({
      username: req.user.username,
      totalTrades: t.rows[0].c,
      storageBytes: upload + dbBytes,
      uploadsBytes: upload,
      databaseBytes: dbBytes,
      cpuPercent: cpuPercent(),
      memory: { totalBytes: totalMem, usedBytes: usedMem, freeBytes: freeMem, percent: Math.round((usedMem / totalMem) * 100) },
      uptimeSeconds: Math.round(process.uptime()),
      loadAvg: os.loadavg(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/system/timeline", requireAuth, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(String(req.query.days || "7"), 10) || 7));
    const { rows } = await query(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS trades
       FROM trades WHERE user_id = $1 AND created_at >= NOW() - ($2::int || ' days')::interval
       GROUP BY 1 ORDER BY 1`,
      [req.user.id, days]
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

init()
  .then(() => ensureSchema())
  .then(() => app.listen(PORT, () => console.log(`Server on :${PORT}`)))
  .catch((e) => { console.error("Init failed:", e); process.exit(1); });
