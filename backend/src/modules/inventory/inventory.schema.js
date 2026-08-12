import { z } from 'zod';

export const inventoryAdjustSchema = {
  body: z.object({
    product_id: z.string().uuid('Invalid product ID'),
    movement_type: z.enum(['IN', 'OUT']),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    notes: z.string().min(1, 'Notes or reason is required for manual stock adjustment'),
  }),
};

export const getInventoryByProductSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
};
