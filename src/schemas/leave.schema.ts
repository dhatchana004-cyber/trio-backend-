import { z } from 'zod';

export const applyLeaveSchema = z.object({
  body: z.object({
    type: z.string().min(1, 'Leave type is required'),
    start_date: z.string().refine((val: any) => !isNaN(Date.parse(val)), 'Invalid start date format'),
    end_date: z.string().refine((val: any) => !isNaN(Date.parse(val)), 'Invalid end date format'),
  }),
});
