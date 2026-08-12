import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, transaction } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  try {
    logger.info('Checking schema_migrations table...');

    // 1. Create schema_migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch list of already executed migrations
    const res = await pool.query('SELECT migration_name FROM schema_migrations;');
    const executedMigrations = new Set(res.rows.map((r) => r.migration_name));

    // 3. Read migration directory files
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      logger.warn(`Migrations directory not found at ${migrationsDir}`);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pendingMigrations = files.filter((f) => !executedMigrations.has(f));

    if (pendingMigrations.length === 0) {
      logger.info('No pending database migrations. Database schema is up to date.');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migration(s): ${pendingMigrations.join(', ')}`);

    // 4. Execute pending migrations sequentially in transactions
    for (const filename of pendingMigrations) {
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`Executing migration: ${filename}...`);

      await transaction(async (client) => {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1);',
          [filename]
        );
      });

      logger.info(`✓ Successfully executed migration: ${filename}`);
    }

    logger.info('All database migrations completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Database migration failed!');
    throw error;
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
