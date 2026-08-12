import { query } from '../../config/db.js';

export const dashboardRepository = {
  async getSummary() {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM customers WHERE is_active = true) AS total_customers,
        (SELECT COUNT(*) FROM products WHERE is_active = true) AS total_products,
        (SELECT COUNT(*) FROM products WHERE is_active = true AND current_stock <= reorder_level) AS low_stock_products_count;
    `;
    const res = await query(sql);
    const row = res.rows[0];
    return {
      totalCustomers: parseInt(row.total_customers, 10),
      totalProducts: parseInt(row.total_products, 10),
      lowStockProductsCount: parseInt(row.low_stock_products_count, 10),
    };
  },

  async getLowStockProducts() {
    const sql = `
      SELECT id, sku, name, category, unit, price, current_stock, reorder_level
      FROM products
      WHERE is_active = true AND current_stock <= reorder_level
      ORDER BY (reorder_level - current_stock) DESC;
    `;
    const res = await query(sql);
    return res.rows;
  },
};
