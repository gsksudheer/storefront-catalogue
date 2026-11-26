/**
 * Demo-only link to the Mailpit inbox so reviewers can see enquiry emails arrive.
 * Set at build time (VITE_DEMO_INBOX_URL); unset in production builds, so nothing renders.
 */
export function demoInboxUrl(): string | undefined {
  const url = import.meta.env.VITE_DEMO_INBOX_URL as string | undefined;
  return url ? url.replace(/\/+$/, '') : undefined;
}

/** Deep link to the exact email: the enquiry reference is in the email subject. */
export function demoEmailUrl(reference: string): string | undefined {
  const base = demoInboxUrl();
  return base ? `${base}/search?q=${encodeURIComponent(reference)}` : undefined;
}
