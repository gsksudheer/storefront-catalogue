import { catalogueRoutes } from './catalogue.routes.js';
import { CatalogueService } from './catalogue.service.js';
import type { FeaturedProvider, ProductSource } from './ports.js';

export type { Product, ProductSource, FeaturedProvider } from './ports.js';
export { FakeStoreProductSource } from './adapters/fakestore.source.js';
export { CachedProductSource } from './adapters/cached.source.js';
export { JsonFeaturedProvider } from './adapters/json-featured.provider.js';

export interface CatalogueDeps {
  productSource: ProductSource;
  featuredProvider: FeaturedProvider;
}

/** Public entry point of the catalogue module. Other modules must import from here only. */
export function createCatalogueModule(deps: CatalogueDeps) {
  const service = new CatalogueService(deps.productSource, deps.featuredProvider);
  return {
    router: catalogueRoutes(service),
    /** In-process API for other modules (e.g. enquiry's ProductLookup). */
    async getProductSummary(id: string): Promise<{ id: string; title: string } | null> {
      const product = await deps.productSource.getProduct(id);
      return product ? { id: product.id, title: product.title } : null;
    },
  };
}
