import { Router } from 'express';
import type { z } from 'zod';
import { BadRequest } from '../../shared/errors.js';
import { CategoryParams, ProductIdParams, SearchQuery } from './catalogue.schemas.js';
import type { CatalogueService } from './catalogue.service.js';

function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw BadRequest(details[0]?.message ?? 'Invalid request', details);
  }
  return result.data;
}

/** HTTP layer only: validate input, call the service, shape the response. */
export function catalogueRoutes(service: CatalogueService): Router {
  const router = Router();

  router.get('/featured', async (_req, res) => {
    res.json({ products: await service.getFeatured() });
  });

  router.get('/categories', async (_req, res) => {
    res.json({ categories: await service.listCategories() });
  });

  router.get('/categories/:name', async (req, res) => {
    const { name } = validate(CategoryParams, req.params);
    res.json(await service.getCategory(name));
  });

  router.get('/products', async (req, res) => {
    const { q } = validate(SearchQuery, req.query);
    res.json({ query: q, products: await service.search(q) });
  });

  router.get('/products/:id', async (req, res) => {
    const { id } = validate(ProductIdParams, req.params);
    res.json({ product: await service.getProduct(id) });
  });

  return router;
}
