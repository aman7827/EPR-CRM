import { usersService } from './users.service.js';
import { getPaginationParams, formatPaginationMeta } from '../../utils/pagination.js';
import { sendSuccess, sendCollection } from '../../utils/response.js';

export const usersController = {
  async list(req, res, next) {
    try {
      const pagination = getPaginationParams(req.query);
      const search = req.query.search;
      const { users, total } = await usersService.listUsers(pagination, search);
      const meta = formatPaginationMeta(pagination.page, pagination.limit, total);
      return sendCollection(res, users, meta);
    } catch (error) {
      next(error);
    }
  },

  async get(req, res, next) {
    try {
      const user = await usersService.getUser(req.params.id);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const user = await usersService.createUser(req.body);
      return sendSuccess(res, user, 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const user = await usersService.updateUser(req.params.id, req.body);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await usersService.deleteUser(req.params.id);
      return sendSuccess(res, { message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
