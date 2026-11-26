/** Domain model owned by the catalogue module. Independent of any data source's shape. */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: { rate: number; count: number };
}

/** Where products come from. Swap Fake Store for a DB/CMS by adding another implementation. */
export interface ProductSource {
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  listCategories(): Promise<string[]>;
}

/** Which products the business owner has chosen as "top rated". */
export interface FeaturedProvider {
  getFeaturedIds(): Promise<string[]>;
}
