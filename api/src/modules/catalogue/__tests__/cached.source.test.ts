import { describe, expect, it, vi } from 'vitest';
import { CachedProductSource } from '../adapters/cached.source.js';
import { CATALOGUE, InMemoryProductSource } from './fakes.js';

function setup() {
  const inner = new InMemoryProductSource(CATALOGUE);
  const spies = {
    list: vi.spyOn(inner, 'listProducts'),
    get: vi.spyOn(inner, 'getProduct'),
  };
  let now = 0;
  const cached = new CachedProductSource(inner, { ttlMs: 1000, now: () => now });
  return { cached, spies, advance: (ms: number) => (now += ms) };
}

describe('CachedProductSource', () => {
  it('serves repeat calls from cache within the TTL', async () => {
    const { cached, spies } = setup();
    await cached.listProducts();
    await cached.listProducts();
    expect(spies.list).toHaveBeenCalledTimes(1);
  });

  it('refetches after the TTL expires', async () => {
    const { cached, spies, advance } = setup();
    await cached.listProducts();
    advance(1001);
    await cached.listProducts();
    expect(spies.list).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const { cached, spies } = setup();
    await Promise.all([cached.listProducts(), cached.listProducts(), cached.listProducts()]);
    expect(spies.list).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const { cached, spies } = setup();
    spies.list.mockRejectedValueOnce(new Error('down'));
    await expect(cached.listProducts()).rejects.toThrow('down');
    await expect(cached.listProducts()).resolves.toHaveLength(CATALOGUE.length);
  });

  it('answers getProduct from the cached list when available', async () => {
    const { cached, spies } = setup();
    await cached.listProducts();
    expect((await cached.getProduct('5'))?.id).toBe('5');
    expect(await cached.getProduct('999')).toBeNull();
    expect(spies.get).not.toHaveBeenCalled();
  });
});
