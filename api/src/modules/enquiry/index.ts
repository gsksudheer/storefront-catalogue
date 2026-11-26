import { Router } from 'express';
import type { Mailer, ProductLookup } from './ports.js';

export type { Mailer, MailMessage, ProductLookup } from './ports.js';

export interface EnquiryDeps {
  mailer: Mailer;
  productLookup: ProductLookup;
  salesInbox: string;
}

/** Public entry point of the enquiry module. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createEnquiryModule(_deps: EnquiryDeps) {
  const router = Router();
  // TODO(step 3): validation + service + POST /api/enquiries
  return { router };
}
