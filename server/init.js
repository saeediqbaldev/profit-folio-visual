const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

async function init() {
  const sqlPath = path.join(__dirname, "..", "init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  // Retry until Postgres is reachable
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query("SELECT 1");
      break;
    } catch (e) {
      console.log(`Waiting for Postgres... (${i + 1}/30)`);
      await new Promise((r) => setTimeout(r, 1000));
      if (i === 29) throw e;
    }
  }
  await pool.query(sql);
  console.log("Database initialized.");
}

module.exports = { init };
