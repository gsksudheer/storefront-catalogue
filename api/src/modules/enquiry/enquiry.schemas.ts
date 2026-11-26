import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);

export const EnquiryInput = z.object({
  productId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid product id'),
  name: trimmed(100).min(1, 'Name is required'),
  email: z.string().trim().pipe(z.email('Enter a valid email address').max(254)),
  phone: trimmed(30)
    .regex(/^[0-9+()\-\s]*$/, 'Phone may only contain digits, spaces and + ( ) -')
    .optional()
    .transform((v) => v || undefined),
  message: trimmed(2000)
    .optional()
    .transform((v) => v || undefined),
  /** Honeypot: hidden in the UI. Humans leave it empty; naive bots fill every field. */
  website: z.string().optional(),
});

export type EnquiryInput = z.infer<typeof EnquiryInput>;
