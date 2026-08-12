import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

export const logoutSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};
