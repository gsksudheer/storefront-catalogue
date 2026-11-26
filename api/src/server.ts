import { createApp } from './app.js';
import { loadConfig } from './shared/config.js';
import { logger } from './shared/logger.js';
import { createCatalogueModule } from './modules/catalogue/index.js';
import { createEnquiryModule } from './modules/enquiry/index.js';

/**
 * Composition root: the only place that knows which concrete adapters are used.
 * TODO(step 2/3): replace placeholder adapters with FakeStore, JSON featured, SMTP mailer.
 */
const config = loadConfig();

const catalogue = createCatalogueModule({
  productSource: {
    listProducts: async () => [],
    getProduct: async () => null,
    listCategories: async () => [],
  },
  featuredProvider: { getFeaturedIds: async () => [] },
});

const enquiry = createEnquiryModule({
  mailer: { send: async () => {} },
  productLookup: { getProductSummary: async () => null },
  salesInbox: config.SALES_INBOX_EMAIL,
});

const app = createApp({ catalogue, enquiry }, { corsOrigin: config.CORS_ORIGIN });

app.listen(config.PORT, () => {
  logger.info(`API listening on http://localhost:${config.PORT}`);
});
