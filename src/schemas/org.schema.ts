import { z } from 'zod';

export const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    geofence_radius_m: z.number().optional(),
    work_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:mm)').optional(),
    work_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:mm)').optional(),
  }),
});
