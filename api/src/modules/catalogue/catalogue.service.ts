import { NotFound } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';
import type { FeaturedProvider, Product, ProductSource } from './ports.js';

export interface CategoryView {
  category: string;
  topRated: Product[];
  additional: Product[];
}

/** Highest rating first; more reviews breaks ties. */
const byRating = (a: Product, b: Product) => b.rating.rate - a.rating.rate || b.rating.count - a.rating.count;

export class CatalogueService {
  constructor(
    private readonly source: ProductSource,
    private readonly featured: FeaturedProvider,
    private readonly options: { categoryTopRatedCount: number } = { categoryTopRatedCount: 3 },
  ) {}

  /** The owner's chosen "top rated" products, in the configured order. Unknown ids are skipped. */
  async getFeatured(): Promise<Product[]> {
    const [ids, products] = await Promise.all([this.featured.getFeaturedIds(), this.source.listProducts()]);
    const byId = new Map(products.map((p) => [p.id, p]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) logger.warn({ missing }, 'Featured product ids not found in catalogue');
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  listCategories(): Promise<string[]> {
    return this.source.listCategories();
  }

  /**
   * Top rated = the owner's featured picks in this category first, topped up with the
   * highest-rated remaining products. Additional = everything else in the category.
   */
  async getCategory(name: string): Promise<CategoryView> {
    const [categories, products, featuredIds] = await Promise.all([
      this.source.listCategories(),
      this.source.listProducts(),
      this.featured.getFeaturedIds(),
    ]);
    const category = categories.find((c) => c.toLowerCase() === name.toLowerCase());
    if (!category) throw NotFound(`Category "${name}" not found`);

    const inCategory = products.filter((p) => p.category === category);
    const featuredHere = featuredIds.flatMap((id) => inCategory.find((p) => p.id === id) ?? []);
    const fillCount = Math.max(0, this.options.categoryTopRatedCount - featuredHere.length);
    const fill = inCategory
      .filter((p) => !featuredHere.includes(p))
      .sort(byRating)
      .slice(0, fillCount);

    const topRated = [...featuredHere, ...fill];
    const additional = inCategory.filter((p) => !topRated.includes(p));
    return { category, topRated, additional };
  }

  /**
   * Case-insensitive search over title, description and category.
   * Every word in the query must appear (AND), e.g. "mens cotton" matches "Mens Cotton Jacket".
   */
  async search(query: string): Promise<Product[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    const products = await this.source.listProducts();
    return products.filter((p) => {
      const haystack = `${p.title} ${p.description} ${p.category}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.source.getProduct(id);
    if (!product) throw NotFound(`Product "${id}" not found`);
    return product;
  }
}
