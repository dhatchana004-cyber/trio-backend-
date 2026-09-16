import { z } from 'zod';

// We won't strictly use zod for multipart form data body validation on the fly with multer,
// but we can validate the stringified parts.
export const clockInSchema = z.object({
  body: z.object({
    lat: z.string().optional().transform((val: any) => val ? parseFloat(val) : undefined),
    lng: z.string().optional().transform((val: any) => val ? parseFloat(val) : undefined),
    notes: z.string().optional(),
  }),
});

export const clockOutSchema = z.object({
  body: z.object({
    lat: z.string().optional().transform((val: any) => val ? parseFloat(val) : undefined),
    lng: z.string().optional().transform((val: any) => val ? parseFloat(val) : undefined),
    notes: z.string().optional(),
  }),
});
