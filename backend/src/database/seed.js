import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { logger } from '../config/logger.js';
import { migrate } from './migrate.js';

export const seed = async () => {
  try {
    // Run migrations first to ensure schema exists
    await migrate();

    logger.info('Starting database seeding...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Seed Users
    const users = [
      { name: 'Admin User', email: 'admin@crm.com', role: 'ADMIN' },
      { name: 'Sales Executive', email: 'sales@crm.com', role: 'SALES' },
      { name: 'Warehouse Manager', email: 'warehouse@crm.com', role: 'WAREHOUSE' },
      { name: 'Accounts Officer', email: 'accounts@crm.com', role: 'ACCOUNTS' },
    ];

    const userMap = {};
    for (const u of users) {
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
         RETURNING id, role;`,
        [u.name, u.email, hashedPassword, u.role]
      );
      userMap[u.role] = res.rows[0].id;
    }

    // 2. Seed Products
    const products = [
      { sku: 'PROD-001', name: 'Industrial Drill Machine 500W', description: 'Heavy duty drill machine', category: 'Machinery', unit: 'Pcs', price: 4500.00, current_stock: 50, reorder_level: 10 },
      { sku: 'PROD-002', name: 'Precision Screwdriver Set (24pc)', description: 'Magnetic screwdriver set for electronics', category: 'Tools', unit: 'Set', price: 850.00, current_stock: 120, reorder_level: 25 },
      { sku: 'PROD-003', name: 'Safety Helmet - Yellow (CE Certified)', description: 'High-density industrial protective headgear', category: 'Safety Equipment', unit: 'Pcs', price: 350.00, current_stock: 5, reorder_level: 15 }, // Low stock item
      { sku: 'PROD-004', name: 'Hydraulic Hand Pallet Truck 2.5 Ton', description: 'Heavy lifting pallet jack', category: 'Warehouse Supplies', unit: 'Unit', price: 18500.00, current_stock: 8, reorder_level: 10 }, // Low stock item
      { sku: 'PROD-005', name: 'Heavy Duty Measuring Tape 5m', description: 'Rubberized shockproof tape', category: 'Tools', unit: 'Pcs', price: 220.00, current_stock: 200, reorder_level: 30 }
    ];

    const productMap = {};
    for (const p of products) {
      const res = await pool.query(
        `INSERT INTO products (sku, name, description, category, unit, price, current_stock, reorder_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (sku) DO UPDATE SET 
           name = EXCLUDED.name, 
           price = EXCLUDED.price, 
           current_stock = EXCLUDED.current_stock, 
           reorder_level = EXCLUDED.reorder_level
         RETURNING id, sku, price;`,
        [p.sku, p.name, p.description, p.category, p.unit, p.price, p.current_stock, p.reorder_level]
      );
      productMap[p.sku] = res.rows[0];
    }

    // 3. Seed Customers
    const customers = [
      { name: 'Apex Engineering Works', company_name: 'Apex Group', email: 'contact@apexeng.com', phone: '+919876543210', gst_number: '27AAAAA0000A1Z5', address: 'Plot 42, MIDC Industrial Area, Pune' },
      { name: 'Bharat Logistics & Infra', company_name: 'Bharat Infra', email: 'sales@bharatinfra.in', phone: '+919812345678', gst_number: '27BBBCA1234B2Z9', address: 'Gala 12, Logistics Park, Thane' },
      { name: 'Cosmos Tech Solutions', company_name: 'Cosmos Corp', email: 'info@cosmostech.com', phone: '+919123456789', gst_number: '27CCCCD5678C1Z3', address: 'Tech Park Tower 3, Whitefield, Bangalore' }
    ];

    const customerMap = {};
    for (const c of customers) {
      const res = await pool.query(
        `INSERT INTO customers (name, company_name, email, phone, gst_number, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name;`,
        [c.name, c.company_name, c.email, c.phone, c.gst_number, c.address]
      );
      customerMap[c.name] = res.rows[0].id;
    }

    // 4. Seed Follow-ups
    const apexId = customerMap['Apex Engineering Works'];
    if (apexId) {
      await pool.query(
        `INSERT INTO customer_followups (customer_id, user_id, followup_date, status, notes)
         VALUES 
         ($1, $2, NOW() + INTERVAL '1 day', 'PENDING', 'Discuss bulk order terms for Industrial Drill Machines'),
         ($1, $2, NOW() - INTERVAL '2 days', 'COMPLETED', 'Initial inquiry call completed');`,
        [apexId, userMap['SALES']]
      );
    }

    logger.info('Database seed executed successfully.');
  } catch (error) {
    logger.error({ error }, 'Database seeding failed');
    throw error;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
