import { customersService } from './customers.service.js';
import { getPaginationParams, formatPaginationMeta } from '../../utils/pagination.js';
import { sendSuccess, sendCollection } from '../../utils/response.js';

export const customersController = {
  async list(req, res, next) {
    try {
      const pagination = getPaginationParams(req.query);
      const search = req.query.search;
      const isActive = req.query.isActive;
      const { customers, total } = await customersService.listCustomers(pagination, search, isActive);
      const meta = formatPaginationMeta(pagination.page, pagination.limit, total);
      return sendCollection(res, customers, meta);
    } catch (error) {
      next(error);
    }
  },

  async get(req, res, next) {
    try {
      const customer = await customersService.getCustomer(req.params.id);
      return sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const customer = await customersService.createCustomer(req.body);
      return sendSuccess(res, customer, 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const customer = await customersService.updateCustomer(req.params.id, req.body);
      return sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await customersService.deleteCustomer(req.params.id);
      return sendSuccess(res, { message: 'Customer deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
