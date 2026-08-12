import { customersRepository } from './customers.repository.js';
import { NotFoundError } from '../../utils/errors.js';

export const customersService = {
  async listCustomers(pagination, search, isActive) {
    return customersRepository.findAll({ ...pagination, search, isActive });
  },

  async getCustomer(id) {
    const customer = await customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return customer;
  },

  async createCustomer(data) {
    return customersRepository.create(data);
  },

  async updateCustomer(id, data) {
    const customer = await customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return customersRepository.update(id, data);
  },

  async deleteCustomer(id) {
    const deleted = await customersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Customer not found');
    }
    return deleted;
  },
};
