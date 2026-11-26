import { z } from 'zod';
import { UpstreamUnavailable } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';
import type { Product, ProductSource } from '../ports.js';

/** Shape we rely on from Fake Store. Validated so a changed upstream fails loudly, not silently. */
const FakeStoreProduct = z.object({
  id: z.number().int(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({ rate: z.number(), count: z.number() }).default({ rate: 0, count: 0 }),
});
type FakeStoreProduct = z.infer<typeof FakeStoreProduct>;

function toProduct(p: FakeStoreProduct): Product {
  return {
    id: String(p.id),
    title: p.title,
    description: p.description,
    price: p.price,
    category: p.category,
    imageUrl: p.image,
    rating: p.rating,
  };
}

export interface FakeStoreOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** Anti-corruption layer: translates Fake Store's API into our Product model. */
export class FakeStoreProductSource implements ProductSource {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: FakeStoreOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async listProducts(): Promise<Product[]> {
    const data = await this.getJson('/products');
    return this.parse(z.array(FakeStoreProduct), data).map(toProduct);
  }

  async getProduct(id: string): Promise<Product | null> {
    // Fake Store answers unknown ids with 200 + empty body, so "no body" means "not found".
    const data = await this.getJson(`/products/${encodeURIComponent(id)}`, { allowNotFound: true });
    if (data === null) return null;
    return toProduct(this.parse(FakeStoreProduct, data));
  }

  async listCategories(): Promise<string[]> {
    const data = await this.getJson('/products/categories');
    return this.parse(z.array(z.string()), data);
  }

  private async getJson(path: string, opts: { allowNotFound?: boolean } = {}): Promise<unknown> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      logger.warn({ err, path }, 'Fake Store request failed');
      throw UpstreamUnavailable('Product catalogue is temporarily unavailable');
    }

    if (opts.allowNotFound && res.status === 404) return null;
    if (!res.ok) {
      logger.warn({ status: res.status, path }, 'Fake Store returned an error status');
      throw UpstreamUnavailable('Product catalogue is temporarily unavailable');
    }

    const text = await res.text();
    if (text.trim() === '') {
      if (opts.allowNotFound) return null;
      throw UpstreamUnavailable('Product catalogue returned an empty response');
    }
    try {
      return JSON.parse(text);
    } catch {
      throw UpstreamUnavailable('Product catalogue returned invalid JSON');
    }
  }

  private parse<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      logger.warn({ issues: result.error.issues }, 'Fake Store response did not match expected shape');
      throw UpstreamUnavailable('Product catalogue returned unexpected data');
    }
    return result.data;
  }
}
