import { Router } from 'express';
import type { FeaturedProvider, ProductSource } from './ports.js';

export type { Product, ProductSource, FeaturedProvider } from './ports.js';

export interface CatalogueDeps {
  productSource: ProductSource;
  featuredProvider: FeaturedProvider;
}

/** Public entry point of the catalogue module. Other modules must import from here only. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createCatalogueModule(_deps: CatalogueDeps) {
  const router = Router();
  // TODO(step 2): service + routes (featured, categories, search, product details)
  return { router };
}
