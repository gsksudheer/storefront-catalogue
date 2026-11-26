import nodemailer from 'nodemailer';
import { describe, expect, it } from 'vitest';
import { SmtpMailer } from '../adapters/smtp.mailer.js';

describe('SmtpMailer', () => {
  it('sends the message with the configured from address', async () => {
    // jsonTransport builds the message without a network connection.
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const mailer = new SmtpMailer({ host: 'unused', port: 1025, from: 'Shop <no-reply@shop.test>' }, transport);

    const sent = transport.sendMail.bind(transport);
    let envelope: unknown;
    transport.sendMail = (async (opts: object) => {
      const info = await sent(opts);
      envelope = JSON.parse(info.message);
      return info;
    }) as typeof transport.sendMail;

    await mailer.send({ to: 'sales@shop.test', subject: 'Hi', text: 'Body', html: '<p>Body</p>', replyTo: 'c@x.test' });
    expect(envelope).toMatchObject({
      from: { address: 'no-reply@shop.test', name: 'Shop' },
      to: [{ address: 'sales@shop.test' }],
      replyTo: [{ address: 'c@x.test' }],
      subject: 'Hi',
    });
  });

  it('propagates delivery failures to the caller', async () => {
    const mailer = new SmtpMailer({ host: '127.0.0.1', port: 1, from: 'x@shop.test' });
    await expect(mailer.send({ to: 'a@b.test', subject: 's', text: 't', html: 'h' })).rejects.toThrow();
  });
});
