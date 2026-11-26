import { describe, expect, it } from 'vitest';
import { CatalogueService } from '../catalogue.service.js';
import { AppError } from '../../../shared/errors.js';
import { CATALOGUE, featuredOf, InMemoryProductSource } from './fakes.js';

const ids = (products: { id: string }[]) => products.map((p) => p.id);
const serviceWith = (featured: string[]) =>
  new CatalogueService(new InMemoryProductSource(CATALOGUE), featuredOf(featured));

describe('CatalogueService.getFeatured', () => {
  it('returns exactly the chosen products in the configured order', async () => {
    const featured = await serviceWith(['5', '1', '6', '3', '2']).getFeatured();
    expect(ids(featured)).toEqual(['5', '1', '6', '3', '2']);
  });

  it('skips ids that no longer exist instead of failing the page', async () => {
    const featured = await serviceWith(['1', '999', '5']).getFeatured();
    expect(ids(featured)).toEqual(['1', '5']);
  });
});

describe('CatalogueService.getCategory', () => {
  it('puts featured picks first, tops up with highest rated, rest are additional', async () => {
    // Product 2 is featured despite a low rating: the owner's choice wins.
    const view = await serviceWith(['2']).getCategory("men's clothing");
    expect(view.category).toBe("men's clothing");
    expect(ids(view.topRated)).toEqual(['2', '1', '3']);
    expect(ids(view.additional)).toEqual(['4']);
  });

  it('falls back to rating when nothing in the category is featured', async () => {
    const view = await serviceWith(['5']).getCategory("men's clothing");
    expect(ids(view.topRated)).toEqual(['1', '3', '4']);
    expect(ids(view.additional)).toEqual(['2']);
  });

  it('never shows a product in both lists', async () => {
    const view = await serviceWith(['1', '3']).getCategory("men's clothing");
    const all = [...ids(view.topRated), ...ids(view.additional)];
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(4);
  });

  it('matches category names case-insensitively', async () => {
    const view = await serviceWith([]).getCategory('ELECTRONICS');
    expect(view.category).toBe('electronics');
  });

  it('throws NOT_FOUND for an unknown category', async () => {
    await expect(serviceWith([]).getCategory('toys')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});

describe('CatalogueService.search', () => {
  const service = serviceWith([]);

  it('matches title case-insensitively', async () => {
    expect(ids(await service.search('JACKET'))).toEqual(['1']);
  });

  it('matches description and category text', async () => {
    expect(ids(await service.search('sata'))).toEqual(['6']);
    expect(ids(await service.search('jewelery'))).toEqual(['5']);
  });

  it('requires every word to match', async () => {
    expect(ids(await service.search('mens casual'))).toEqual(['2', '3']);
    expect(ids(await service.search('mens ssd'))).toEqual([]);
  });

  it('returns nothing for a blank query', async () => {
    expect(await service.search('   ')).toEqual([]);
  });
});

describe('CatalogueService.getProduct', () => {
  it('returns the product', async () => {
    expect((await serviceWith([]).getProduct('6')).title).toBe('SSD 1TB');
  });

  it('throws NOT_FOUND for an unknown id', async () => {
    const err = await serviceWith([]).getProduct('999').catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(404);
  });
});
