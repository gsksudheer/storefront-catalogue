import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JsonFeaturedProvider } from '../adapters/json-featured.provider.js';

async function fileWith(content: string) {
  const dir = await mkdtemp(join(tmpdir(), 'featured-'));
  const path = join(dir, 'featured.json');
  await writeFile(path, content);
  return path;
}

describe('JsonFeaturedProvider', () => {
  it('loads ids in order and removes duplicates', async () => {
    const provider = await JsonFeaturedProvider.fromFile(await fileWith('{"productIds":["3","1","3"]}'));
    await expect(provider.getFeaturedIds()).resolves.toEqual(['3', '1']);
  });

  it('fails fast on an invalid file', async () => {
    await expect(JsonFeaturedProvider.fromFile(await fileWith('{"productIds":[1,2]}'))).rejects.toThrow(
      /Invalid featured config/,
    );
  });

  it('ships a valid default config with 5 products', async () => {
    const provider = await JsonFeaturedProvider.fromFile('config/featured.json');
    await expect(provider.getFeaturedIds()).resolves.toHaveLength(5);
  });
});
