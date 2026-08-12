import pg from 'pg';
import { newDb, DataType } from 'pg-mem';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

const getConnectionString = () => {
  if (process.env.SUPABASE_DB_URL && process.env.SUPABASE_DB_URL.trim() !== '') {
    return process.env.SUPABASE_DB_URL.trim();
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    return process.env.DATABASE_URL.trim();
  }
  return null;
};

const connectionString = getConnectionString();

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: env.DB_POOL_MAX || 20,
      idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT || 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      max: env.DB_POOL_MAX || 20,
      idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT || 30000,
      connectionTimeoutMillis: 5000,
    };

export let pool = new Pool(poolConfig);
let isUsingPgMem = false;
let memClient = null;

export const isPgMem = () => isUsingPgMem;

pool.on('error', (err) => {
  if (!isUsingPgMem) {
    logger.error({ err }, 'Unexpected PostgreSQL pool background error');
  }
});

/**
 * Execute a single query using pool
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Acquire client connection from pool
 */
export const getClient = () => pool.connect();

/**
 * Run a transaction safely with automatic BEGIN, COMMIT, and ROLLBACK
 */
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      // Ignore rollback errors if connection was broken
    }
    throw error;
  } finally {
    if (client && typeof client.release === 'function') {
      client.release();
    }
  }
};

/**
 * Initialize in-memory database fallback (pg-mem) if real PostgreSQL is offline
 */
const initPgMemFallback = async () => {
  logger.info('Initializing in-memory database fallback (pg-mem)...');
  const db = newDb();

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  db.public.registerFunction({
    name: 'to_char',
    args: [DataType.timestamp, DataType.text],
    returns: DataType.text,
    implementation: (val) => {
      const date = val ? new Date(val) : new Date();
      return date.getFullYear().toString();
    },
  });

  const pgAdapter = db.adapters.createPg();
  memClient = new pgAdapter.Pool();

  pool.query = (text, params) => memClient.query(text, params);
  pool.connect = async () => {
    const client = await memClient.connect();
    if (!client.release) {
      client.release = () => {};
    }
    return client;
  };

  // Schema creation
  await memClient.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(512) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      phone VARCHAR(50) NOT NULL,
      gst_number VARCHAR(50) NULL,
      address TEXT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      category VARCHAR(100) NOT NULL,
      unit VARCHAR(50) NOT NULL DEFAULT 'Pcs',
      price NUMERIC(12, 2) NOT NULL,
      current_stock INT NOT NULL DEFAULT 0,
      reorder_level INT NOT NULL DEFAULT 10,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      reference_type VARCHAR(50) NOT NULL,
      reference_id UUID NULL,
      movement_type VARCHAR(10) NOT NULL,
      quantity INT NOT NULL,
      stock_before INT NOT NULL,
      stock_after INT NOT NULL,
      notes TEXT NULL,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed data
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const users = [
    { name: 'Admin User', email: 'admin@crm.com', role: 'ADMIN' },
    { name: 'Sales Executive', email: 'sales@crm.com', role: 'SALES' },
    { name: 'Warehouse Manager', email: 'warehouse@crm.com', role: 'WAREHOUSE' },
    { name: 'Accounts Officer', email: 'accounts@crm.com', role: 'ACCOUNTS' },
  ];

  for (const u of users) {
    await memClient.query(
      `INSERT INTO users (id, name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true);`,
      [crypto.randomUUID(), u.name, u.email, hashedPassword, u.role]
    );
  }

  const products = [
    { sku: 'PROD-001', name: 'Industrial Drill Machine 500W', description: 'Heavy duty drill machine', category: 'Machinery', unit: 'Pcs', price: 4500.00, current_stock: 50, reorder_level: 10 },
    { sku: 'PROD-002', name: 'Precision Screwdriver Set (24pc)', description: 'Magnetic screwdriver set for electronics', category: 'Tools', unit: 'Set', price: 850.00, current_stock: 120, reorder_level: 25 },
    { sku: 'PROD-003', name: 'Safety Helmet - Yellow (CE Certified)', description: 'High-density protective headgear', category: 'Safety Equipment', unit: 'Pcs', price: 350.00, current_stock: 5, reorder_level: 15 },
  ];

  for (const p of products) {
    await memClient.query(
      `INSERT INTO products (id, sku, name, description, category, unit, price, current_stock, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [crypto.randomUUID(), p.sku, p.name, p.description, p.category, p.unit, p.price, p.current_stock, p.reorder_level]
    );
  }

  const customers = [
    { name: 'Apex Engineering Works', company_name: 'Apex Group', email: 'contact@apexeng.com', phone: '+919876543210', gst_number: '27AAAAA0000A1Z5', address: 'Plot 42, MIDC Industrial Area, Pune' },
    { name: 'Bharat Logistics & Infra', company_name: 'Bharat Infra', email: 'sales@bharatinfra.in', phone: '+919812345678', gst_number: '27BBBCA1234B2Z9', address: 'Gala 12, Logistics Park, Thane' }
  ];

  for (const c of customers) {
    await memClient.query(
      `INSERT INTO customers (id, name, company_name, email, phone, gst_number, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [crypto.randomUUID(), c.name, c.company_name, c.email, c.phone, c.gst_number, c.address]
    );
  }

  isUsingPgMem = true;
  logger.info('✓ In-memory database (pg-mem) initialized with demo data.');
};

/**
 * Test database connection with retry strategy and pg-mem fallback
 */
export const testConnection = async (maxRetries = 2, delayMs = 1000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT NOW()');
      client.release();
      logger.info(`Successfully connected to PostgreSQL at ${res.rows[0].now}`);
      return true;
    } catch (err) {
      logger.warn({ attempt, maxRetries, err: err.message }, `Database connection attempt ${attempt} failed.`);
      if (attempt >= maxRetries) {
        await initPgMemFallback();
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Graceful pool shutdown
 */
export const closePool = async () => {
  try {
    if (memClient) {
      await memClient.end();
    } else {
      await pool.end();
    }
    logger.info('Database pool closed gracefully.');
  } catch (err) {
    logger.error({ err }, 'Error closing database pool.');
  }
};
