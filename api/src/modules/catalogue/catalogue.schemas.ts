import { z } from 'zod';

/** Ids are opaque strings so a future data source (UUIDs, SKUs) needs no API change. */
export const ProductIdParams = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid product id'),
});

export const CategoryParams = z.object({
  name: z.string().trim().min(1).max(100),
});

export const SearchQuery = z.object({
  q: z.string().trim().min(1, 'Search term is required').max(100, 'Search term is too long'),
});
