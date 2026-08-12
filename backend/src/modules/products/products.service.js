import { productsRepository } from './products.repository.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

export const productsService = {
  async listProducts(pagination, filters) {
    return productsRepository.findAll({ ...pagination, ...filters });
  },

  async getProduct(id) {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  },

  async createProduct(data) {
    const existing = await productsRepository.findBySku(data.sku);
    if (existing) {
      throw new ConflictError('Product with this SKU already exists');
    }
    return productsRepository.create(data);
  },

  async updateProduct(id, data) {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (data.sku && data.sku !== product.sku) {
      const skuCheck = await productsRepository.findBySku(data.sku);
      if (skuCheck) {
        throw new ConflictError('SKU is already taken by another product');
      }
    }

    return productsRepository.update(id, data);
  },

  async deleteProduct(id) {
    const deleted = await productsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Product not found');
    }
    return deleted;
  },
};
