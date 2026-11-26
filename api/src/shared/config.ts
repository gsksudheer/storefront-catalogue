import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PRODUCT_SOURCE: z.enum(['fakestore']).default('fakestore'),
  FAKESTORE_BASE_URL: z.string().url().default('https://fakestoreapi.com'),
  FAKESTORE_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  CATALOGUE_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  FEATURED_CONFIG_PATH: z.string().default('./config/featured.json'),
  MAIL_DRIVER: z.enum(['smtp']).default('smtp'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Storefront <no-reply@storefront.local>'),
  SALES_INBOX_EMAIL: z.string().email().default('sales@storefront.local'),
});

export type AppConfig = z.infer<typeof EnvSchema>;

/** Parse env once at startup; fail fast with a readable error if misconfigured. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`);
  }
  return parsed.data;
}
