import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const apply = process.argv.includes('--apply');
if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL in .env.local or the environment.');
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.join(here, '..', 'db', 'migrations');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});
const lockKey = 'credit-card-manager-schema-migrations';

try {
  const files = (await fs.readdir(migrationDir))
    .filter(file => /^\d+_[a-z0-9_-]+\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b, 'en'));

  // Refuse ambiguous migration numbering rather than silently skipping one.
  const prefixes = new Map();
  for (const file of files) {
    const prefix = file.split('_', 1)[0];
    if (prefixes.has(prefix)) throw new Error(`Duplicate migration version ${prefix}: ${prefixes.get(prefix)} and ${file}`);
    prefixes.set(prefix, file);
  }

  let history = [];
  try {
    const result = await pool.query('SELECT version FROM schema_migrations');
    history = result.rows.map(row => String(row.version));
  } catch (error) {
    if (error.code !== '42P01') throw error; // Missing history table is normal on a fresh database.
  }

  const pending = files.filter(file => {
    const legacyPrefix = file.split('_', 1)[0];
    // Existing production history stores numeric prefixes (001..005). Treat
    // those as applied for backwards compatibility; new entries use filenames.
    return !history.includes(file) && !history.includes(legacyPrefix);
  });

  if (!apply) {
    if (pending.length) pending.forEach(file => console.log(`Pending migration: ${file}`));
    else console.log('No pending database migrations.');
    console.log('Dry run complete. No database changes made.');
  } else {
    const client = await pool.connect();
    try {
      await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockKey]);
      await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP)');
      for (const file of pending) {
        const sql = await fs.readFile(path.join(migrationDir, file), 'utf8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT(version) DO NOTHING', [file]);
          await client.query('COMMIT');
          console.log(`Applied ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
      console.log('Database migrations complete.');
    } finally {
      try { await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lockKey]); } catch {}
      client.release();
    }
  }
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
