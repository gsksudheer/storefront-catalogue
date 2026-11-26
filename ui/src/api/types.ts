/** Mirrors the backend's API contract. Next step: generate from an OpenAPI spec. */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: { rate: number; count: number };
}

export interface ProductsResponse {
  products: Product[];
}
export interface SearchResponse {
  query: string;
  products: Product[];
}
export interface CategoriesResponse {
  categories: string[];
}
export interface CategoryResponse {
  category: string;
  topRated: Product[];
  additional: Product[];
}
export interface ProductResponse {
  product: Product;
}

export interface EnquiryRequest {
  productId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  website?: string;
}
export interface EnquiryResponse {
  status: 'received';
  reference: string;
}
