import { query } from '../../config/db.js';

export const productsRepository = {
  async findAll({ limit, offset, sortBy = 'created_at', sortOrder = 'DESC', search, category, lowStock, isActive }) {
    const whereConditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(sku ILIKE $${params.length} OR name ILIKE $${params.length} OR category ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    if (category) {
      params.push(category);
      whereConditions.push(`category = $${params.length}`);
    }

    if (lowStock === 'true' || lowStock === true) {
      whereConditions.push(`current_stock <= reorder_level`);
    }

    if (isActive !== undefined && isActive !== null) {
      params.push(isActive === 'true' || isActive === true);
      whereConditions.push(`is_active = $${params.length}`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM products ${whereSql};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const validSortFields = ['created_at', 'sku', 'name', 'price', 'current_stock', 'category'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    const dataSql = `
      SELECT id, sku, name, description, category, unit, price, current_stock, reorder_level, is_active, created_at, updated_at
      FROM products
      ${whereSql}
      ORDER BY ${safeSortBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const dataRes = await query(dataSql, params);

    return { products: dataRes.rows, total };
  },

  async findById(id) {
    const sql = `
      SELECT id, sku, name, description, category, unit, price, current_stock, reorder_level, is_active, created_at, updated_at
      FROM products
      WHERE id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async findBySku(sku) {
    const sql = `
      SELECT id, sku, name, current_stock
      FROM products
      WHERE sku = $1;
    `;
    const res = await query(sql, [sku]);
    return res.rows[0] || null;
  },

  async create({ sku, name, description, category, unit = 'Pcs', price, current_stock = 0, reorder_level = 10 }) {
    const sql = `
      INSERT INTO products (sku, name, description, category, unit, price, current_stock, reorder_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, sku, name, description, category, unit, price, current_stock, reorder_level, is_active, created_at, updated_at;
    `;
    const res = await query(sql, [sku, name, description || null, category, unit, price, current_stock, reorder_level]);
    return res.rows[0];
  },

  async update(id, fields) {
    const setClauses = [];
    const params = [id];

    Object.keys(fields).forEach((key) => {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    });

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE products
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, sku, name, description, category, unit, price, current_stock, reorder_level, is_active, created_at, updated_at;
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async delete(id) {
    const sql = `DELETE FROM products WHERE id = $1 RETURNING id;`;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },
};
