import type { FeaturedProvider, Product, ProductSource } from '../ports.js';

export function makeProduct(overrides: Partial<Product> & Pick<Product, 'id'>): Product {
  return {
    title: `Product ${overrides.id}`,
    description: 'A product',
    price: 10,
    category: 'misc',
    imageUrl: `https://img.test/${overrides.id}.png`,
    rating: { rate: 3, count: 10 },
    ...overrides,
  };
}

/** In-memory ProductSource: proves the service works with any source, not just Fake Store. */
export class InMemoryProductSource implements ProductSource {
  constructor(public products: Product[]) {}
  async listProducts() {
    return this.products;
  }
  async getProduct(id: string) {
    return this.products.find((p) => p.id === id) ?? null;
  }
  async listCategories() {
    return [...new Set(this.products.map((p) => p.category))];
  }
}

export const featuredOf = (ids: string[]): FeaturedProvider => ({ getFeaturedIds: async () => ids });

/** Small catalogue used across tests. */
export const CATALOGUE: Product[] = [
  makeProduct({ id: '1', title: 'Mens Cotton Jacket', category: "men's clothing", rating: { rate: 4.7, count: 500 } }),
  makeProduct({ id: '2', title: 'Mens Casual Slim Fit', category: "men's clothing", rating: { rate: 2.1, count: 430 } }),
  makeProduct({ id: '3', title: 'Mens Casual Shirt', category: "men's clothing", rating: { rate: 4.1, count: 259 } }),
  makeProduct({ id: '4', title: 'Classic Backpack', category: "men's clothing", rating: { rate: 3.9, count: 120 } }),
  makeProduct({ id: '5', title: 'Gold Chain Bracelet', category: 'jewelery', rating: { rate: 4.6, count: 400 } }),
  makeProduct({
    id: '6',
    title: 'SSD 1TB',
    description: 'Fast solid state drive with SATA interface',
    category: 'electronics',
    rating: { rate: 4.8, count: 319 },
  }),
];
