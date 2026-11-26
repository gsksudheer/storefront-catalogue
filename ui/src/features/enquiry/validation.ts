/**
 * Client-side checks for instant feedback. They mirror the API's rules, but the API stays
 * the source of truth: server field errors are shown the same way.
 */
export interface EnquiryValues {
  name: string;
  email: string;
  phone: string;
  message: string;
  website: string; // honeypot
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+()\-\s]*$/;

export function validateEnquiry(v: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (!v.name.trim()) errors.name = 'Please enter your name';
  else if (v.name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer';

  if (!v.email.trim()) errors.email = 'Please enter your email address';
  else if (!EMAIL.test(v.email.trim())) errors.email = 'Enter a valid email address, like name@example.com';

  if (v.phone.trim() && !PHONE.test(v.phone.trim())) errors.phone = 'Phone may only contain digits, spaces and + ( ) -';
  if (v.message.trim().length > 2000) errors.message = 'Message must be 2000 characters or fewer';
  return errors;
}
