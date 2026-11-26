import { apiFetch } from './client';
import type { EnquiryRequest, EnquiryResponse } from './types';

/** Catalogue endpoint paths (relative to /api), used with the useApi hook. */
export const catalogueApi = {
  featured: () => '/catalogue/featured',
  categories: () => '/catalogue/categories',
  category: (name: string) => `/catalogue/categories/${encodeURIComponent(name)}`,
  search: (q: string) => `/catalogue/products?q=${encodeURIComponent(q)}`,
  product: (id: string) => `/catalogue/products/${encodeURIComponent(id)}`,
};

export const submitEnquiry = (body: EnquiryRequest) =>
  apiFetch<EnquiryResponse>('/enquiries', { method: 'POST', body: JSON.stringify(body) });
