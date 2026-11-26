import { enquiryRoutes } from './enquiry.routes.js';
import { EnquiryService } from './enquiry.service.js';
import type { Mailer, ProductLookup } from './ports.js';

export type { Mailer, MailMessage, ProductLookup } from './ports.js';
export { SmtpMailer } from './adapters/smtp.mailer.js';

export interface EnquiryDeps {
  mailer: Mailer;
  productLookup: ProductLookup;
  salesInbox: string;
  rateLimit?: { windowMs: number; limit: number };
}

/** Public entry point of the enquiry module. */
export function createEnquiryModule(deps: EnquiryDeps) {
  const service = new EnquiryService(deps.mailer, deps.productLookup, deps.salesInbox);
  return {
    router: enquiryRoutes(service, {
      rateLimit: deps.rateLimit ?? { windowMs: 15 * 60_000, limit: 10 },
    }),
  };
}
