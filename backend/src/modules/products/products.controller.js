import { productsService } from './products.service.js';
import { getPaginationParams, formatPaginationMeta } from '../../utils/pagination.js';
import { sendSuccess, sendCollection } from '../../utils/response.js';

export const productsController = {
  async list(req, res, next) {
    try {
      const pagination = getPaginationParams(req.query);
      const filters = {
        search: req.query.search,
        category: req.query.category,
        lowStock: req.query.lowStock,
        isActive: req.query.isActive,
      };
      const { products, total } = await productsService.listProducts(pagination, filters);
      const meta = formatPaginationMeta(pagination.page, pagination.limit, total);
      return sendCollection(res, products, meta);
    } catch (error) {
      next(error);
    }
  },

  async get(req, res, next) {
    try {
      const product = await productsService.getProduct(req.params.id);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const product = await productsService.createProduct(req.body);
      return sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const product = await productsService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await productsService.deleteProduct(req.params.id);
      return sendSuccess(res, { message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
