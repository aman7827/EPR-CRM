import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrationStatus = async () => {
  try {
    const tableRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);

    const tableExists = tableRes.rows[0].exists;
    const executedMap = new Map();

    if (tableExists) {
      const res = await pool.query('SELECT migration_name, executed_at FROM schema_migrations ORDER BY id ASC;');
      for (const row of res.rows) {
        executedMap.set(row.migration_name, row.executed_at);
      }
    }

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No database/migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log('\n================ DATABASE MIGRATION STATUS ================');
    if (files.length === 0) {
      console.log('No migration files found.');
    } else {
      for (const file of files) {
        if (executedMap.has(file)) {
          const executedAt = new Date(executedMap.get(file)).toLocaleString();
          console.log(` ✓ ${file} (executed at ${executedAt})`);
        } else {
          console.log(` ✗ ${file} (pending)`);
        }
      }
    }
    console.log('===========================================================\n');
  } catch (error) {
    console.error('Failed to retrieve migration status:', error.message);
    throw error;
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrationStatus()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
