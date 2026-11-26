import { type ChangeEvent, type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { type ApiError, toApiError } from '../../api/client';
import { submitEnquiry } from '../../api/endpoints';
import type { Product } from '../../api/types';
import { CheckIcon, CopyIcon, ExternalIcon } from '../../components/Icons';
import { demoEmailUrl } from '../../lib/config';
import { type EnquiryErrors, type EnquiryValues, validateEnquiry } from './validation';
import styles from './EnquiryForm.module.css';

type Status = { kind: 'editing' } | { kind: 'submitting' } | { kind: 'sent'; reference: string };

const EMPTY: EnquiryValues = { name: '', email: '', phone: '', message: '', website: '' };
const MESSAGE_MAX = 2000;

function friendlyError(err: ApiError): string {
  if (err.status === 429) return "You've sent several enquiries in a short time. Please wait a few minutes and try again.";
  return err.message;
}

export function EnquiryForm({
  product,
  onDone,
  onBusyChange,
}: {
  product: Product;
  onDone: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [values, setValues] = useState<EnquiryValues>(EMPTY);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'editing' });
  const [copied, setCopied] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const thankYouRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  // Move focus so keyboard and screen-reader users land where the action is.
  useEffect(() => {
    if (status.kind === 'sent') thankYouRef.current?.focus();
  }, [status.kind]);
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);
  useEffect(() => {
    onBusyChange?.(status.kind === 'submitting');
  }, [status.kind, onBusyChange]);

  const set = (field: keyof EnquiryValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const clientErrors = validateEnquiry(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstInvalid(clientErrors);
      return;
    }

    setStatus({ kind: 'submitting' });
    try {
      const res = await submitEnquiry({
        productId: product.id,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        message: values.message.trim() || undefined,
        website: values.website || undefined,
      });
      setStatus({ kind: 'sent', reference: res.reference });
    } catch (err) {
      const apiErr = toApiError(err);
      const serverErrors: EnquiryErrors = {};
      for (const d of apiErr.details) {
        if (d.field in EMPTY) serverErrors[d.field as keyof EnquiryValues] = d.message;
      }
      setErrors(serverErrors);
      setFormError(Object.keys(serverErrors).length ? 'Please fix the highlighted fields.' : friendlyError(apiErr));
      setStatus({ kind: 'editing' });
    }
  }

  function focusFirstInvalid(errs: EnquiryErrors) {
    const first = (['name', 'email', 'phone', 'message'] as const).find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  if (status.kind === 'sent') {
    const emailUrl = demoEmailUrl(status.reference);
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(status.reference);
        setCopied(true);
      } catch {
        /* clipboard unavailable: reference is still visible */
      }
    };
    return (
      <div className={styles.success} role="status">
        <div className={styles.check} aria-hidden="true">
          <CheckIcon width={28} height={28} strokeWidth={2.5} />
        </div>
        <h2 ref={thankYouRef} tabIndex={-1} className={`display ${styles.successTitle}`}>
          Thank you, {values.name.trim().split(' ')[0]}!
        </h2>
        <p className={styles.successText}>
          We've received your enquiry about <strong>{product.title}</strong>. Our sales team will reply to{' '}
          <strong>{values.email.trim()}</strong> soon.
        </p>
        <div className={styles.reference}>
          <span>Reference</span>
          <code>{status.reference}</code>
          <button type="button" className={styles.copy} onClick={copy} aria-label="Copy reference">
            {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
          </button>
        </div>
        <div className={styles.successActions}>
          {emailUrl && (
            <a href={emailUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-block">
              View the email sent to sales <ExternalIcon width={16} height={16} />
            </a>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            Continue browsing
          </button>
        </div>
        {emailUrl && <p className={styles.demoNote}>Demo only: emails are caught by Mailpit instead of being delivered.</p>}
      </div>
    );
  }

  const submitting = status.kind === 'submitting';
  const field = (name: keyof EnquiryValues) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    disabled: submitting,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${uid}-${name}-error` : undefined,
    className: `${styles.input} ${errors[name] ? styles.invalid : ''}`,
  });
  const errorFor = (name: keyof EnquiryValues) =>
    errors[name] && (
      <p id={`${uid}-${name}-error`} className={styles.fieldError}>
        {errors[name]}
      </p>
    );

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-label="Enquiry form">
      <p className={styles.intro}>Leave your details and our sales team will get back to you by email.</p>

      {formError && (
        <div className={styles.alert} role="alert">
          {formError}
        </div>
      )}

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Your details</legend>
        <div className={styles.field}>
          <label htmlFor={`${uid}-name`}>
            Name <span className={styles.required}>*</span>
          </label>
          <input {...field('name')} ref={firstFieldRef} autoComplete="name" maxLength={100} placeholder="Jane Doe" required />
          {errorFor('name')}
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={`${uid}-email`}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              {...field('email')}
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="jane@example.com"
              required
            />
            {errorFor('email')}
          </div>
          <div className={styles.field}>
            <label htmlFor={`${uid}-phone`}>
              Phone <span className={styles.optional}>optional</span>
            </label>
            <input {...field('phone')} type="tel" autoComplete="tel" maxLength={30} placeholder="+44 20 7946 0000" />
            {errorFor('phone')}
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Your question</legend>
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor={`${uid}-message`}>
              Message <span className={styles.optional}>optional</span>
            </label>
            <span className={styles.counter} aria-hidden="true">
              {values.message.length}/{MESSAGE_MAX}
            </span>
          </div>
          <textarea
            {...field('message')}
            rows={5}
            maxLength={MESSAGE_MAX}
            placeholder="E.g. Is this available in other sizes? When could it be delivered?"
          />
          {errorFor('message')}
        </div>
      </fieldset>

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner" aria-hidden="true" /> Sending…
            </>
          ) : (
            'Send enquiry'
          )}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone} disabled={submitting}>
          Cancel
        </button>
      </div>
      <p className={styles.privacy}>We only use your details to reply to this enquiry.</p>
    </form>
  );
}
