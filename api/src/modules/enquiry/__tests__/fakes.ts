import type { Mailer, MailMessage, ProductLookup } from '../ports.js';

/** Records messages instead of sending them; can be told to fail. */
export class FakeMailer implements Mailer {
  sent: MailMessage[] = [];
  failWith: Error | null = null;
  async send(message: MailMessage) {
    if (this.failWith) throw this.failWith;
    this.sent.push(message);
  }
}

export const productLookup: ProductLookup = {
  getProductSummary: async (id) => (id === '1' ? { id: '1', title: 'Fjallraven Backpack' } : null),
};

export const validEnquiry = {
  productId: '1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+44 20 7946 0000',
  message: 'Is this available in blue?',
};
