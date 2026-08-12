import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory of backendv1
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'crm_erp_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '20', 10),
  DB_POOL_IDLE_TIMEOUT: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),

  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_32char',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'super_secret_jwt_refresh_key_change_in_production_32char',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
};
