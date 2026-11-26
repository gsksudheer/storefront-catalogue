import nodemailer, { type Transporter } from 'nodemailer';
import type { Mailer, MailMessage } from '../ports.js';

export interface SmtpOptions {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
}

/**
 * SMTP delivery via nodemailer. Locally this points at Mailpit; in production any SMTP
 * provider works (including Amazon SES's SMTP interface) with only env changes.
 */
export class SmtpMailer implements Mailer {
  private readonly transport: Transporter;

  constructor(
    private readonly options: SmtpOptions,
    transport?: Transporter,
  ) {
    this.transport =
      transport ??
      nodemailer.createTransport({
        host: options.host,
        port: options.port,
        secure: options.port === 465,
        auth: options.user ? { user: options.user, pass: options.pass } : undefined,
        // Fail in seconds, not nodemailer's 2-minute default, so the user gets a timely error.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({ from: this.options.from, ...message });
  }
}
