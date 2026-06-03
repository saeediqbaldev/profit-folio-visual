const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST || "127.0.0.1",
  port: parseInt(process.env.PGPORT || "5432", 10),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "trading_journal",
  max: 10,
});

pool.on("error", (err) => console.error("PG pool error:", err));

module.exports = { pool, query: (text, params) => pool.query(text, params) };
