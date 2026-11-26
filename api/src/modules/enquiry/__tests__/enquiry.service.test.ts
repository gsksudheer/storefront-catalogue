import { describe, expect, it } from 'vitest';
import { EnquiryService } from '../enquiry.service.js';
import { FakeMailer, productLookup, validEnquiry } from './fakes.js';

const setup = () => {
  const mailer = new FakeMailer();
  const service = new EnquiryService(mailer, productLookup, 'sales@shop.test', () => 'REF12345');
  return { mailer, service };
};

describe('EnquiryService.submit', () => {
  it('emails the sales inbox with the enquiry and returns a reference', async () => {
    const { mailer, service } = setup();
    await expect(service.submit(validEnquiry)).resolves.toEqual({ reference: 'REF12345' });

    expect(mailer.sent).toHaveLength(1);
    const mail = mailer.sent[0]!;
    expect(mail.to).toBe('sales@shop.test');
    expect(mail.replyTo).toBe('ada@example.com');
    expect(mail.subject).toBe('New enquiry: Fjallraven Backpack [REF12345]');
    expect(mail.text).toContain('Ada Lovelace');
    expect(mail.text).toContain('+44 20 7946 0000');
    expect(mail.text).toContain('Is this available in blue?');
  });

  it('uses the product title from the catalogue, not from the client', async () => {
    const { mailer, service } = setup();
    await service.submit({ ...validEnquiry, title: 'SPOOFED' } as typeof validEnquiry);
    expect(mailer.sent[0]!.subject).not.toContain('SPOOFED');
  });

  it('HTML-escapes customer input in the email body', async () => {
    const { mailer, service } = setup();
    await service.submit({ ...validEnquiry, name: '<script>alert(1)</script>' });
    expect(mailer.sent[0]!.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(mailer.sent[0]!.html).not.toContain('<script>');
  });

  it('rejects enquiries for unknown products without sending', async () => {
    const { mailer, service } = setup();
    await expect(service.submit({ ...validEnquiry, productId: '999' })).rejects.toMatchObject({ status: 404 });
    expect(mailer.sent).toHaveLength(0);
  });

  it('surfaces a 503 when the email cannot be sent, so the user is not told "thank you"', async () => {
    const { mailer, service } = setup();
    mailer.failWith = new Error('ECONNREFUSED');
    await expect(service.submit(validEnquiry)).rejects.toMatchObject({ status: 503, code: 'ENQUIRY_NOT_SENT' });
  });

  it('silently drops honeypot submissions without emailing', async () => {
    const { mailer, service } = setup();
    await expect(service.submit({ ...validEnquiry, website: 'http://spam.test' })).resolves.toEqual({
      reference: 'REF12345',
    });
    expect(mailer.sent).toHaveLength(0);
  });
});
