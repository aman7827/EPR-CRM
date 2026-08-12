import { dashboardRepository } from './dashboard.repository.js';

export const dashboardService = {
  async getSummary() {
    return dashboardRepository.getSummary();
  },

  async getLowStockProducts() {
    return dashboardRepository.getLowStockProducts();
  },
};
