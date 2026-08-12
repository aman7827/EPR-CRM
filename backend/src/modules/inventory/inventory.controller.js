import { inventoryService } from './inventory.service.js';
import { getPaginationParams, formatPaginationMeta } from '../../utils/pagination.js';
import { sendSuccess, sendCollection } from '../../utils/response.js';

export const inventoryController = {
  async list(req, res, next) {
    try {
      const pagination = getPaginationParams(req.query);
      const filters = {
        search: req.query.search,
        category: req.query.category,
      };
      const { inventory, total } = await inventoryService.getInventoryList(pagination, filters);
      const meta = formatPaginationMeta(pagination.page, pagination.limit, total);
      return sendCollection(res, inventory, meta);
    } catch (error) {
      next(error);
    }
  },

  async getByProduct(req, res, next) {
    try {
      const inv = await inventoryService.getInventoryByProduct(req.params.productId);
      return sendSuccess(res, inv);
    } catch (error) {
      next(error);
    }
  },

  async adjust(req, res, next) {
    try {
      const result = await inventoryService.adjustStock(req.body, req.user.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async movements(req, res, next) {
    try {
      const pagination = getPaginationParams(req.query);
      const filters = {
        productId: req.query.productId,
        movementType: req.query.movementType,
        referenceType: req.query.referenceType,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };
      const { movements, total } = await inventoryService.getMovements(pagination, filters);
      const meta = formatPaginationMeta(pagination.page, pagination.limit, total);
      return sendCollection(res, movements, meta);
    } catch (error) {
      next(error);
    }
  },
};
