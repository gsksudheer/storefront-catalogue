import { validateEnquiry } from './validation';

const valid = { name: 'Ada', email: 'ada@example.com', phone: '', message: '', website: '' };

describe('validateEnquiry', () => {
  it('accepts a minimal valid enquiry', () => {
    expect(validateEnquiry(valid)).toEqual({});
  });

  it.each([
    ['name', { name: '  ' }],
    ['email', { email: '' }],
    ['email', { email: 'ada@' }],
    ['phone', { phone: 'abc' }],
    ['message', { message: 'x'.repeat(2001) }],
  ])('flags an invalid %s', (field, override) => {
    expect(validateEnquiry({ ...valid, ...override })).toHaveProperty(field);
  });
});
