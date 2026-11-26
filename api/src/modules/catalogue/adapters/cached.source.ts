import type { Product, ProductSource } from '../ports.js';

interface Entry<T> {
  expiresAt: number;
  value: Promise<T>;
}

export interface CacheOptions {
  ttlMs: number;
  now?: () => number;
}

/**
 * Decorator adding an in-memory TTL cache to any ProductSource.
 * - Concurrent callers share one in-flight request.
 * - Failures are not cached, so the next request retries upstream.
 * In-memory is fine for a single instance; swap for Redis when scaling out.
 */
export class CachedProductSource implements ProductSource {
  private readonly cache = new Map<string, Entry<unknown>>();
  private readonly now: () => number;

  constructor(
    private readonly inner: ProductSource,
    private readonly options: CacheOptions,
  ) {
    this.now = options.now ?? Date.now;
  }

  listProducts(): Promise<Product[]> {
    return this.cached('products', () => this.inner.listProducts());
  }

  listCategories(): Promise<string[]> {
    return this.cached('categories', () => this.inner.listCategories());
  }

  async getProduct(id: string): Promise<Product | null> {
    // Serve from the cached list when we have it; otherwise ask the source directly.
    const list = this.peek<Product[]>('products');
    if (list) return (await list).find((p) => p.id === id) ?? null;
    return this.cached(`product:${id}`, () => this.inner.getProduct(id));
  }

  private peek<T>(key: string): Promise<T> | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > this.now()) return entry.value as Promise<T>;
    return undefined;
  }

  private cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.peek<T>(key);
    if (hit) return hit;

    const value = load();
    this.cache.set(key, { expiresAt: this.now() + this.options.ttlMs, value });
    value.catch(() => {
      if (this.cache.get(key)?.value === value) this.cache.delete(key);
    });
    return value;
  }
}
