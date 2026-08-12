import { query } from '../../config/db.js';

export const customersRepository = {
  async findAll({ limit, offset, sortBy = 'created_at', sortOrder = 'DESC', search, isActive }) {
    const whereConditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(name ILIKE $${params.length} OR company_name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`);
    }

    if (isActive !== undefined && isActive !== null) {
      params.push(isActive === 'true' || isActive === true);
      whereConditions.push(`is_active = $${params.length}`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM customers ${whereSql};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const validSortFields = ['created_at', 'name', 'company_name', 'email', 'phone'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    const dataSql = `
      SELECT id, name, company_name, email, phone, gst_number, address, is_active, created_at, updated_at
      FROM customers
      ${whereSql}
      ORDER BY ${safeSortBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const dataRes = await query(dataSql, params);

    return { customers: dataRes.rows, total };
  },

  async findById(id) {
    const sql = `
      SELECT id, name, company_name, email, phone, gst_number, address, is_active, created_at, updated_at
      FROM customers
      WHERE id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async create({ name, company_name, email, phone, gst_number, address }) {
    const sql = `
      INSERT INTO customers (name, company_name, email, phone, gst_number, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, company_name, email, phone, gst_number, address, is_active, created_at, updated_at;
    `;
    const res = await query(sql, [name, company_name || null, email || null, phone, gst_number || null, address || null]);
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
      UPDATE customers
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, name, company_name, email, phone, gst_number, address, is_active, created_at, updated_at;
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async delete(id) {
    const sql = `DELETE FROM customers WHERE id = $1 RETURNING id;`;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },
};
