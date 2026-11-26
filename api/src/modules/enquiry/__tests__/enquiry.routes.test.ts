import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Router } from 'express';
import { createApp } from '../../../app.js';
import { createEnquiryModule } from '../index.js';
import { FakeMailer, productLookup, validEnquiry } from './fakes.js';

function setup(limit = 100) {
  const mailer = new FakeMailer();
  const enquiry = createEnquiryModule({
    mailer,
    productLookup,
    salesInbox: 'sales@shop.test',
    rateLimit: { windowMs: 60_000, limit },
  });
  const app = createApp({ catalogue: { router: Router() }, enquiry }, { corsOrigin: 'http://localhost:5173' });
  return { app, mailer };
}

describe('POST /api/enquiries', () => {
  it('returns 201 with a reference and emails the sales inbox', async () => {
    const { app, mailer } = setup();
    const res = await request(app).post('/api/enquiries').send(validEnquiry);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'received', reference: expect.stringMatching(/^[A-Z0-9]{8}$/) });
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]!.to).toBe('sales@shop.test');
  });

  it('returns 400 with field-level details for invalid input and sends nothing', async () => {
    const { app, mailer } = setup();
    const res = await request(app).post('/api/enquiries').send({ productId: '1', name: '', email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(['name', 'email']);
    expect(mailer.sent).toHaveLength(0);
  });

  it('returns 400 for malformed JSON instead of a 500', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/enquiries').set('Content-Type', 'application/json').send('{"name":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 413 for an oversized body', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/enquiries').send({ ...validEnquiry, message: 'x'.repeat(20_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns 404 for an unknown product', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/enquiries').send({ ...validEnquiry, productId: '999' });
    expect(res.status).toBe(404);
  });

  it('returns 503 when email delivery fails', async () => {
    const { app, mailer } = setup();
    mailer.failWith = new Error('SMTP down');
    const res = await request(app).post('/api/enquiries').send(validEnquiry);
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('ENQUIRY_NOT_SENT');
  });

  it('looks successful to bots that fill the honeypot, but sends nothing', async () => {
    const { app, mailer } = setup();
    const res = await request(app).post('/api/enquiries').send({ ...validEnquiry, website: 'spam' });
    expect(res.status).toBe(201);
    expect(mailer.sent).toHaveLength(0);
  });

  it('rate limits repeated submissions with 429', async () => {
    const { app } = setup(2);
    await request(app).post('/api/enquiries').send(validEnquiry).expect(201);
    await request(app).post('/api/enquiries').send(validEnquiry).expect(201);
    const res = await request(app).post('/api/enquiries').send(validEnquiry);
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
