
import pkg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: "postgresql://postgres.cswpbanyezxbdlbgrqjs:Vanshika%4001@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const migrationPath = path.resolve(__dirname, '../database/migrations/003_update_disease_predictions.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
