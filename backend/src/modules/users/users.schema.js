import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  }),
};

export const updateUserSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']).optional(),
    is_active: z.boolean().optional(),
  }),
};

export const getUserByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
};
