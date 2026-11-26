import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Router } from 'express';
import { createApp } from '../app.js';

const emptyModules = { catalogue: { router: Router() }, enquiry: { router: Router() } };

describe('app', () => {
  const app = createApp(emptyModules, { corsOrigin: 'http://localhost:5173' });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown routes return the standard JSON error shape', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('sets security headers and hides x-powered-by', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
