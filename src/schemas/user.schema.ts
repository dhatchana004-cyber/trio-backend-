import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
    department: z.string().optional(),
    employee_id: z.string().optional(),
    join_date: z.string().optional(),
    profile_photo_url: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});
