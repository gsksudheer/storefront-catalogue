import { describe, expect, it, vi } from 'vitest';
import { FakeStoreProductSource } from '../adapters/fakestore.source.js';

const upstreamProduct = {
  id: 1,
  title: 'Backpack',
  price: 109.95,
  description: 'A bag',
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/1.png',
  rating: { rate: 3.9, count: 120 },
};

function sourceReturning(...responses: (Response | Error)[]) {
  const fetchImpl = vi.fn<typeof fetch>();
  for (const r of responses) {
    if (r instanceof Error) fetchImpl.mockRejectedValueOnce(r);
    else fetchImpl.mockResolvedValueOnce(r);
  }
  return { source: new FakeStoreProductSource({ baseUrl: 'https://fake.test/', fetchImpl }), fetchImpl };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('FakeStoreProductSource', () => {
  it('maps upstream products to our Product model', async () => {
    const { source, fetchImpl } = sourceReturning(json([upstreamProduct]));
    const [product] = await source.listProducts();
    expect(product).toEqual({
      id: '1',
      title: 'Backpack',
      price: 109.95,
      description: 'A bag',
      category: "men's clothing",
      imageUrl: 'https://fakestoreapi.com/img/1.png',
      rating: { rate: 3.9, count: 120 },
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://fake.test/products');
  });

  it('treats 200 with an empty body as not found (Fake Store behaviour for unknown ids)', async () => {
    const { source } = sourceReturning(new Response('', { status: 200 }));
    await expect(source.getProduct('999')).resolves.toBeNull();
  });

  it('treats 404 as not found', async () => {
    const { source } = sourceReturning(new Response('', { status: 404 }));
    await expect(source.getProduct('999')).resolves.toBeNull();
  });

  it('url-encodes the product id', async () => {
    const { source, fetchImpl } = sourceReturning(new Response('', { status: 200 }));
    await source.getProduct('a/b');
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://fake.test/products/a%2Fb');
  });

  it.each([
    ['network error', new TypeError('fetch failed')],
    ['server error', new Response('oops', { status: 500 })],
    ['invalid JSON', new Response('<html>', { status: 200 })],
    ['unexpected shape', json([{ id: 'not-a-number' }])],
  ])('raises UPSTREAM_UNAVAILABLE (502) on %s', async (_label, response) => {
    const { source } = sourceReturning(response);
    await expect(source.listProducts()).rejects.toMatchObject({ status: 502, code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('lists categories', async () => {
    const { source } = sourceReturning(json(['electronics', 'jewelery']));
    await expect(source.listCategories()).resolves.toEqual(['electronics', 'jewelery']);
  });
});
