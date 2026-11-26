import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('applies defaults for local development', () => {
    const config = loadConfig({});
    expect(config.PORT).toBe(4000);
    expect(config.SALES_INBOX_EMAIL).toBe('sales@storefront.local');
  });

  it('fails fast on invalid values', () => {
    expect(() => loadConfig({ SALES_INBOX_EMAIL: 'not-an-email' })).toThrow(/Invalid configuration/);
  });
});
