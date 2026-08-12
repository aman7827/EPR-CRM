import { dashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';

export const dashboardController = {
  async summary(req, res, next) {
    try {
      const summary = await dashboardService.getSummary();
      return sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  },

  async lowStock(req, res, next) {
    try {
      const products = await dashboardService.getLowStockProducts();
      return sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  },
};
