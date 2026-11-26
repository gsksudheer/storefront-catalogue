import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { FeaturedProvider } from '../ports.js';

const FeaturedFile = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(20),
});

/**
 * Reads the owner's "top rated" picks from a JSON file. Stand-in for an admin UI / CMS.
 * Loaded once at startup so a bad file fails fast instead of on the first request.
 */
export class JsonFeaturedProvider implements FeaturedProvider {
  private constructor(private readonly ids: string[]) {}

  static async fromFile(path: string): Promise<JsonFeaturedProvider> {
    const raw = await readFile(path, 'utf8');
    const parsed = FeaturedFile.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error(`Invalid featured config at ${path}: ${parsed.error.message}`);
    }
    return new JsonFeaturedProvider([...new Set(parsed.data.productIds)]);
  }

  async getFeaturedIds(): Promise<string[]> {
    return this.ids;
  }
}
