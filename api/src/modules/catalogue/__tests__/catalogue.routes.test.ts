import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Router } from 'express';
import { createApp } from '../../../app.js';
import { UpstreamUnavailable } from '../../../shared/errors.js';
import { createCatalogueModule } from '../index.js';
import type { ProductSource } from '../ports.js';
import { CATALOGUE, featuredOf, InMemoryProductSource } from './fakes.js';

function appWith(source: ProductSource = new InMemoryProductSource(CATALOGUE), featured = ['5', '1', '6', '3', '2']) {
  const catalogue = createCatalogueModule({ productSource: source, featuredProvider: featuredOf(featured) });
  return createApp({ catalogue, enquiry: { router: Router() } }, { corsOrigin: 'http://localhost:5173' });
}

describe('catalogue routes', () => {
  const app = appWith();

  it('GET /api/catalogue/featured returns the 5 chosen products', async () => {
    const res = await request(app).get('/api/catalogue/featured');
    expect(res.status).toBe(200);
    expect(res.body.products.map((p: { id: string }) => p.id)).toEqual(['5', '1', '6', '3', '2']);
  });

  it('GET /api/catalogue/categories lists categories', async () => {
    const res = await request(app).get('/api/catalogue/categories');
    expect(res.body.categories).toEqual(["men's clothing", 'jewelery', 'electronics']);
  });

  it('GET /api/catalogue/categories/:name returns top rated and additional products', async () => {
    const res = await request(app).get(`/api/catalogue/categories/${encodeURIComponent("men's clothing")}`);
    expect(res.status).toBe(200);
    expect(res.body.topRated).toHaveLength(3);
    expect(res.body.additional).toHaveLength(1);
  });

  it('GET /api/catalogue/categories/:name returns 404 for an unknown category', async () => {
    const res = await request(app).get('/api/catalogue/categories/toys');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/catalogue/products?q= only returns matching products', async () => {
    const res = await request(app).get('/api/catalogue/products').query({ q: 'casual' });
    expect(res.status).toBe(200);
    expect(res.body.query).toBe('casual');
    expect(res.body.products.map((p: { id: string }) => p.id)).toEqual(['2', '3']);
  });

  it.each([
    ['missing', {}],
    ['blank', { q: '   ' }],
    ['too long', { q: 'x'.repeat(101) }],
  ])('GET /api/catalogue/products returns 400 when the search term is %s', async (_label, query) => {
    const res = await request(app).get('/api/catalogue/products').query(query);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toEqual({ field: 'q', message: expect.any(String) });
  });

  it('GET /api/catalogue/products/:id returns the product', async () => {
    const res = await request(app).get('/api/catalogue/products/6');
    expect(res.status).toBe(200);
    expect(res.body.product.title).toBe('SSD 1TB');
  });

  it('GET /api/catalogue/products/:id returns 404 for an unknown id and 400 for a malformed one', async () => {
    expect((await request(app).get('/api/catalogue/products/999')).status).toBe(404);
    expect((await request(app).get('/api/catalogue/products/bad%20id!')).status).toBe(400);
  });

  it('returns 502 with a friendly message when the product source is down', async () => {
    const down: ProductSource = {
      listProducts: () => Promise.reject(UpstreamUnavailable()),
      getProduct: () => Promise.reject(UpstreamUnavailable()),
      listCategories: () => Promise.reject(UpstreamUnavailable()),
    };
    const res = await request(appWith(down)).get('/api/catalogue/featured');
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('UPSTREAM_UNAVAILABLE');
  });
});
