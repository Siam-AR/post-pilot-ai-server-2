import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";

// Allow self-signed certificates in local dev (matches pool.ssl.rejectUnauthorized=false)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log(
  "Testing PG connection to",
  connectionString ? `${connectionString.split("@")[1]}` : "NO_URL",
);

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const res = await pool.query("SELECT now() AS now");
    console.log("PG OK:", res.rows[0]);
  } catch (err) {
    console.error("PG ERROR:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
