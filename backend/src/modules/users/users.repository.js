import { query } from '../../config/db.js';

export const usersRepository = {
  async findAll({ limit, offset, sortBy = 'created_at', sortOrder = 'DESC', search }) {
    let whereClause = '';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE name ILIKE $${params.length} OR email ILIKE $${params.length}`;
    }

    const countSql = `SELECT COUNT(*) FROM users ${whereClause};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const dataSql = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const dataRes = await query(dataSql, params);

    return { users: dataRes.rows, total };
  },

  async findById(id) {
    const sql = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async findByEmail(email) {
    const sql = `
      SELECT id, name, email, role, is_active
      FROM users
      WHERE email = $1;
    `;
    const res = await query(sql, [email]);
    return res.rows[0] || null;
  },

  async create({ name, email, passwordHash, role }) {
    const sql = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, is_active, created_at, updated_at;
    `;
    const res = await query(sql, [name, email, passwordHash, role]);
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
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, name, email, role, is_active, created_at, updated_at;
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async delete(id) {
    const sql = `DELETE FROM users WHERE id = $1 RETURNING id;`;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },
};
