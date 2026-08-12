import app from './app.js';
import { env } from './config/env.js';
import { pool, testConnection, isPgMem } from './config/database.js';
import { logger } from './config/logger.js';
import { runMigrations } from '../database/runMigrations.js';

let server;

const startServer = async () => {
  try {
    logger.info('Initializing application database connection...');
    
    // Attempt database connection & migrations
    try {
      await testConnection(2, 1000);
      if (!isPgMem()) {
        await runMigrations();
      }
    } catch (dbErr) {
      logger.warn({ err: dbErr.message }, 'Database connection deferred. Express server starting up; configure SUPABASE_DB_URL in .env to complete connection.');
    }

    // Start Express HTTP server
    server = app.listen(env.PORT, () => {
      logger.info(`Backend server running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to initialize server');
    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down HTTP server and database pool gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await pool.end();
        logger.info('Database connection pool terminated.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during database pool shutdown');
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
