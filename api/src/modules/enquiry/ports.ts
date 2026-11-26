export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/** Email delivery. Swap SMTP for SES/SendGrid/etc. by adding another implementation. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/**
 * What the enquiry module needs to know about products. Satisfied in-process by the
 * catalogue module today; could become an HTTP client if enquiry is split into its own service.
 */
export interface ProductLookup {
  getProductSummary(id: string): Promise<{ id: string; title: string } | null>;
}
