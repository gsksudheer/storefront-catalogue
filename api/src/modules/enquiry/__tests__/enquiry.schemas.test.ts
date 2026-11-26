import { describe, expect, it } from 'vitest';
import { EnquiryInput } from '../enquiry.schemas.js';
import { validEnquiry } from './fakes.js';

const fieldsWithErrors = (input: unknown) => {
  const r = EnquiryInput.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

describe('EnquiryInput', () => {
  it('accepts a valid enquiry and trims values', () => {
    const r = EnquiryInput.parse({ ...validEnquiry, name: '  Ada  ', email: ' ada@example.com ' });
    expect(r.name).toBe('Ada');
    expect(r.email).toBe('ada@example.com');
  });

  it('only requires product, name and email', () => {
    expect(fieldsWithErrors({ productId: '1', name: 'Ada', email: 'ada@example.com' })).toEqual([]);
  });

  it('treats empty optional fields as absent', () => {
    const r = EnquiryInput.parse({ ...validEnquiry, phone: '', message: '  ' });
    expect(r.phone).toBeUndefined();
    expect(r.message).toBeUndefined();
  });

  it.each([
    ['name', { name: '   ' }],
    ['email', { email: 'not-an-email' }],
    ['email', { email: 'a@b.co\r\nBcc: victim@x.test' }],
    ['phone', { phone: 'call me maybe' }],
    ['message', { message: 'x'.repeat(2001) }],
    ['productId', { productId: '../etc' }],
  ])('rejects an invalid %s', (field, override) => {
    expect(fieldsWithErrors({ ...validEnquiry, ...override })).toContain(field);
  });
});
