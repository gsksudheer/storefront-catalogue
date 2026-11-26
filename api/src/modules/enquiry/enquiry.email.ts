import type { MailMessage } from './ports.js';

export interface EnquiryEmailData {
  reference: string;
  product: { id: string; title: string };
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Renders the sales notification. Kept separate from delivery so the template can change
 * (or move to the email provider's templating) without touching the Mailer.
 * All customer input is HTML-escaped; only server-controlled values go into the subject.
 */
export function renderEnquiryEmail(to: string, d: EnquiryEmailData): MailMessage {
  const rows: [string, string][] = [
    ['Reference', d.reference],
    ['Product', `${d.product.title} (id ${d.product.id})`],
    ['Name', d.name],
    ['Email', d.email],
    ['Phone', d.phone ?? '-'],
    ['Message', d.message ?? '-'],
  ];

  return {
    to,
    replyTo: d.email,
    subject: `New enquiry: ${d.product.title} [${d.reference}]`,
    text: `New product enquiry\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`,
    html:
      `<h2>New product enquiry</h2><table cellpadding="4">` +
      rows
        .map(([k, v]) => `<tr><th align="left">${k}</th><td>${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`)
        .join('') +
      `</table>`,
  };
}
