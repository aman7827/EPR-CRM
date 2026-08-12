import { inventoryRepository } from './inventory.repository.js';
import { transaction } from '../../config/db.js';
import { NotFoundError, InsufficientStockError } from '../../utils/errors.js';

export const inventoryService = {
  async getInventoryList(pagination, filters) {
    return inventoryRepository.findAllInventory({ ...pagination, ...filters });
  },

  async getInventoryByProduct(productId) {
    const inv = await inventoryRepository.findInventoryByProduct(productId);
    if (!inv) {
      throw new NotFoundError('Product not found in inventory');
    }
    return inv;
  },

  async adjustStock({ product_id, movement_type, quantity, notes }, userId) {
    return transaction(async (client) => {
      // 1. Lock product row for update
      const lockSql = `SELECT id, sku, name, current_stock FROM products WHERE id = $1 FOR UPDATE;`;
      const lockRes = await client.query(lockSql, [product_id]);
      const product = lockRes.rows[0];

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      const stockBefore = product.current_stock;
      let stockAfter;

      if (movement_type === 'IN') {
        stockAfter = stockBefore + quantity;
      } else if (movement_type === 'OUT') {
        if (stockBefore < quantity) {
          throw new InsufficientStockError(`Insufficient stock. Current stock is ${stockBefore}, requested deduction is ${quantity}`);
        }
        stockAfter = stockBefore - quantity;
      }

      // 2. Update product current_stock with atomic check
      const updateSql = `
        UPDATE products
        SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, sku, name, current_stock;
      `;
      const updateRes = await client.query(updateSql, [stockAfter, product_id]);
      const updatedProduct = updateRes.rows[0];

      // 3. Create stock movement record
      const movement = await inventoryRepository.createMovement(client, {
        product_id,
        reference_type: 'ADJUSTMENT',
        reference_id: null,
        movement_type,
        quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        notes,
        created_by: userId,
      });

      return {
        product: updatedProduct,
        movement,
      };
    });
  },

  async getMovements(pagination, filters) {
    return inventoryRepository.findMovements({ ...pagination, ...filters });
  },
};
