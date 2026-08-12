import crypto from 'crypto';
import { query } from '../../config/db.js';

export const authRepository = {
  async findUserByEmail(email) {
    const sql = `
      SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  },

  async findUserById(id) {
    const sql = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1 AND is_active = true;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  async saveRefreshToken(userId, token, expiresAt) {
    const sql = `
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, token, expires_at, created_at;
    `;
    const result = await query(sql, [crypto.randomUUID(), userId, token, expiresAt]);
    return result.rows[0];
  },

  async findRefreshToken(token) {
    const sql = `
      SELECT id, user_id, token, expires_at, revoked_at, created_at
      FROM refresh_tokens
      WHERE token = $1;
    `;
    const result = await query(sql, [token]);
    return result.rows[0] || null;
  },

  async revokeRefreshToken(token) {
    const sql = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token = $1;
    `;
    await query(sql, [token]);
  },

  async revokeAllUserRefreshTokens(userId) {
    const sql = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND revoked_at IS NULL;
    `;
    await query(sql, [userId]);
  },
};
