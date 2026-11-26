import { createApp } from './app.js';
import { loadConfig } from './shared/config.js';
import { logger } from './shared/logger.js';
import {
  CachedProductSource,
  createCatalogueModule,
  FakeStoreProductSource,
  JsonFeaturedProvider,
} from './modules/catalogue/index.js';
import { createEnquiryModule } from './modules/enquiry/index.js';

/** Composition root: the only place that knows which concrete adapters are used. */
const config = loadConfig();

const productSource = new CachedProductSource(
  new FakeStoreProductSource({ baseUrl: config.FAKESTORE_BASE_URL, timeoutMs: config.FAKESTORE_TIMEOUT_MS }),
  { ttlMs: config.CATALOGUE_CACHE_TTL_SECONDS * 1000 },
);

const catalogue = createCatalogueModule({
  productSource,
  featuredProvider: await JsonFeaturedProvider.fromFile(config.FEATURED_CONFIG_PATH),
});

const enquiry = createEnquiryModule({
  // TODO(step 3): SMTP mailer
  mailer: { send: async () => {} },
  // In-process today; becomes an HTTP client if enquiry is split into its own service.
  productLookup: { getProductSummary: (id) => catalogue.getProductSummary(id) },
  salesInbox: config.SALES_INBOX_EMAIL,
});

const app = createApp({ catalogue, enquiry }, { corsOrigin: config.CORS_ORIGIN });

app.listen(config.PORT, () => {
  logger.info(`API listening on http://localhost:${config.PORT}`);
});
