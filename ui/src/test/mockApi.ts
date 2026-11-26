import { vi } from 'vitest';
import type { Product } from '../api/types';

type Handler = (init: RequestInit | undefined, url: URL) => { status?: number; body: unknown } | Promise<never>;

/**
 * Stubs fetch at the network boundary so tests exercise the real API client.
 * Keys are "METHOD /api/path" (query string excluded). Unmatched requests fail the test loudly.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const key = `${init?.method ?? 'GET'} ${url.pathname}`;
    const handler = handlers[key] ?? defaults[key];
    if (!handler) throw new Error(`Unmocked request: ${key}`);
    const { status = 200, body } = await handler(init, url);
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const ok = (body: unknown) => () => ({ body });
export const fail = (status: number, code: string, message = 'Error', details?: unknown) => () => ({
  status,
  body: { error: { code, message, details } },
});

export const product = (id: string, overrides: Partial<Product> = {}): Product => ({
  id,
  title: `Product ${id}`,
  description: `Description of product ${id}`,
  price: 10 + Number(id),
  category: 'electronics',
  imageUrl: `https://img.test/${id}.png`,
  rating: { rate: 4, count: 100 },
  ...overrides,
});

const defaults: Record<string, Handler> = {
  'GET /api/catalogue/categories': ok({ categories: ['electronics', "men's clothing"] }),
};
