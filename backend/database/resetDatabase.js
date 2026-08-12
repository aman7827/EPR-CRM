import { fileURLToPath } from 'url';
import { pool } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { runMigrations } from './runMigrations.js';
import { seed } from './seed.js';

export const resetDatabase = async () => {
  try {
    logger.warn('Resetting database... Dropping all tables and sequences...');

    await pool.query(`
      DROP TABLE IF EXISTS stock_movements CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
    `);

    logger.info('Database dropped. Re-running migrations...');
    await runMigrations();

    logger.info('Re-seeding database...');
    await seed();

    logger.info('Database reset completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Database reset failed');
    throw error;
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  resetDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Reset database failed:', err);
      process.exit(1);
    });
}
