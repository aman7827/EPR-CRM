import { query } from '../../config/db.js';

export const inventoryRepository = {
  async findAllInventory({ limit, offset, sortBy = 'current_stock', sortOrder = 'ASC', search, category }) {
    const whereConditions = ['is_active = true'];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(sku ILIKE $${params.length} OR name ILIKE $${params.length} OR category ILIKE $${params.length})`);
    }

    if (category) {
      params.push(category);
      whereConditions.push(`category = $${params.length}`);
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*) FROM products ${whereSql};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const validSortFields = ['current_stock', 'name', 'sku', 'reorder_level', 'price'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'current_stock';

    const dataSql = `
      SELECT id, sku, name, category, unit, price, current_stock, reorder_level,
             (current_stock <= reorder_level) AS is_low_stock,
             updated_at AS last_updated
      FROM products
      ${whereSql}
      ORDER BY ${safeSortBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const dataRes = await query(dataSql, params);

    return { inventory: dataRes.rows, total };
  },

  async findInventoryByProduct(productId) {
    const sql = `
      SELECT id, sku, name, category, unit, price, current_stock, reorder_level,
             (current_stock <= reorder_level) AS is_low_stock, updated_at
      FROM products
      WHERE id = $1;
    `;
    const res = await query(sql, [productId]);
    return res.rows[0] || null;
  },

  async findMovements({ limit, offset, productId, movementType, referenceType, dateFrom, dateTo }) {
    const whereConditions = [];
    const params = [];

    if (productId) {
      params.push(productId);
      whereConditions.push(`m.product_id = $${params.length}`);
    }

    if (movementType) {
      params.push(movementType);
      whereConditions.push(`m.movement_type = $${params.length}`);
    }

    if (referenceType) {
      params.push(referenceType);
      whereConditions.push(`m.reference_type = $${params.length}`);
    }

    if (dateFrom) {
      params.push(dateFrom);
      whereConditions.push(`m.created_at >= $${params.length}`);
    }

    if (dateTo) {
      params.push(dateTo);
      whereConditions.push(`m.created_at <= $${params.length}`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM stock_movements m ${whereSql};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);

    const dataSql = `
      SELECT 
        m.id, m.product_id, m.reference_type, m.reference_id, m.movement_type,
        m.quantity, m.stock_before, m.stock_after, m.notes, m.created_at,
        p.sku AS product_sku, p.name AS product_name,
        u.name AS created_by_user_name
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      JOIN users u ON u.id = m.created_by
      ${whereSql}
      ORDER BY m.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const dataRes = await query(dataSql, params);

    return { movements: dataRes.rows, total };
  },

  /**
   * Insert stock movement log inside a transaction client connection
   */
  async createMovement(client, { product_id, reference_type, reference_id, movement_type, quantity, stock_before, stock_after, notes, created_by }) {
    const sql = `
      INSERT INTO stock_movements 
        (product_id, reference_type, reference_id, movement_type, quantity, stock_before, stock_after, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, product_id, reference_type, reference_id, movement_type, quantity, stock_before, stock_after, created_at;
    `;
    const res = await client.query(sql, [
      product_id, reference_type, reference_id || null, movement_type, quantity, stock_before, stock_after, notes || null, created_by
    ]);
    return res.rows[0];
  },
};
