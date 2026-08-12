import { z } from 'zod';

export const createProductSchema = {
  body: z.object({
    sku: z.string().min(2, 'SKU is required'),
    name: z.string().min(2, 'Product name is required'),
    description: z.string().optional().nullable(),
    category: z.string().min(1, 'Category is required'),
    unit: z.string().optional().default('Pcs'),
    price: z.number().nonnegative('Price must be non-negative'),
    current_stock: z.number().int().nonnegative('Stock cannot be negative').optional().default(0),
    reorder_level: z.number().int().nonnegative('Reorder level cannot be negative').optional().default(10),
  }),
};

export const updateProductSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    sku: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    category: z.string().min(1).optional(),
    unit: z.string().optional(),
    price: z.number().nonnegative().optional(),
    current_stock: z.number().int().nonnegative().optional(),
    reorder_level: z.number().int().nonnegative().optional(),
    is_active: z.boolean().optional(),
  }),
};

export const getProductByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
};
