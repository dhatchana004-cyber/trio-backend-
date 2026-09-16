import { z } from 'zod';

export const createShiftSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Shift name is required'),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:mm)'),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:mm)'),
  }),
});

export const assignShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID'),
    user_id: z.string().uuid('Invalid user ID'),
    date: z.string().refine((val: any) => !isNaN(Date.parse(val)), 'Invalid date format'),
  }),
});
