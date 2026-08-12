import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrate = async () => {
  try {
    logger.info('Starting database migration...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(sql);
    logger.info('Database schema migration completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Database migration failed');
    throw error;
  }
};

// Execute if run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
