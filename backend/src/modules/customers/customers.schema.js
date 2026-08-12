import { z } from 'zod';

const phoneRegex = /^\+?[1-9]\d{9,14}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const createCustomerSchema = {
  body: z.object({
    name: z.string().min(2, 'Customer name is required'),
    company_name: z.string().optional().nullable(),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().regex(phoneRegex, 'Invalid phone number format (e.g. +919876543210 or 10-digit number)'),
    gst_number: z.string().regex(gstRegex, 'Invalid GSTIN format (e.g. 27AAAAA0000A1Z5)').optional().nullable().or(z.literal('')),
    address: z.string().optional().nullable(),
  }),
};

export const updateCustomerSchema = {
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    company_name: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().regex(phoneRegex).optional(),
    gst_number: z.string().regex(gstRegex).optional().nullable().or(z.literal('')),
    address: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
  }),
};

export const getCustomerByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
};
