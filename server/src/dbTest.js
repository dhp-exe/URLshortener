import pool from "./db/postgres.js";

async function test() {
  const res = await pool.query("SELECT NOW()");
  console.log(res.rows);
}

test();