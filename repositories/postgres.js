import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  const result = await pool.query("SELECT COUNT(*) FROM tasks");

  if (Number(result.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO tasks (title, done)
      VALUES
        ('Learn Express', FALSE),
        ('Build Task API', FALSE),
        ('Test API endpoints', TRUE)
    `);
  }
}

export default pool;