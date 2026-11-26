import { randomUUID } from 'node:crypto';
import { AppError, NotFound } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';
import { renderEnquiryEmail } from './enquiry.email.js';
import type { EnquiryInput } from './enquiry.schemas.js';
import type { Mailer, ProductLookup } from './ports.js';

export interface EnquiryReceipt {
  reference: string;
}

export class EnquiryService {
  constructor(
    private readonly mailer: Mailer,
    private readonly products: ProductLookup,
    private readonly salesInbox: string,
    private readonly newReference: () => string = () => randomUUID().slice(0, 8).toUpperCase(),
  ) {}

  async submit(input: EnquiryInput): Promise<EnquiryReceipt> {
    const reference = this.newReference();

    // Silently accept bot submissions so they get no signal, but never email them.
    if (input.website) {
      logger.info({ reference }, 'Enquiry dropped by honeypot');
      return { reference };
    }

    // Product title comes from our catalogue, not the client, so it can't be spoofed.
    const product = await this.products.getProductSummary(input.productId);
    if (!product) throw NotFound(`Product "${input.productId}" not found`);

    const message = renderEnquiryEmail(this.salesInbox, {
      reference,
      product,
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
    });

    try {
      await this.mailer.send(message);
    } catch (err) {
      // No database yet, so a failed send must be surfaced: never show "Thank you" for a lost enquiry.
      logger.error({ err, reference, productId: product.id }, 'Failed to send enquiry email');
      throw new AppError(503, 'ENQUIRY_NOT_SENT', 'We could not send your enquiry right now. Please try again.');
    }

    logger.info({ reference, productId: product.id }, 'Enquiry sent');
    return { reference };
  }
}
