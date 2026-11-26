import { type ChangeEvent, type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { type ApiError, toApiError } from '../../api/client';
import { submitEnquiry } from '../../api/endpoints';
import type { Product } from '../../api/types';
import { type EnquiryErrors, type EnquiryValues, validateEnquiry } from './validation';
import styles from './EnquiryForm.module.css';

type Status = { kind: 'editing' } | { kind: 'submitting' } | { kind: 'sent'; reference: string };

const EMPTY: EnquiryValues = { name: '', email: '', phone: '', message: '', website: '' };

function friendlyError(err: ApiError): string {
  if (err.status === 429) return "You've sent several enquiries in a short time. Please wait a few minutes and try again.";
  return err.message;
}

export function EnquiryForm({ product, onCancel }: { product: Product; onCancel: () => void }) {
  const [values, setValues] = useState<EnquiryValues>(EMPTY);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'editing' });
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
    return (
      <div className={styles.success} role="status">
        <div className={styles.check} aria-hidden="true">
          ✓
        </div>
        <h2 ref={thankYouRef} tabIndex={-1} className={styles.successTitle}>
          Thank you, {values.name.trim().split(' ')[0]}!
        </h2>
        <p>
          We've received your enquiry about <strong>{product.title}</strong>. Our sales team will reply to{' '}
          <strong>{values.email.trim()}</strong> soon.
        </p>
        <p className={styles.reference}>
          Reference: <code>{status.reference}</code>
        </p>
      </div>
    );
  }

  const submitting = status.kind === 'submitting';
  const field = (name: keyof EnquiryValues) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: set(name),
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
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-title`}>
      <div>
        <h2 id={`${uid}-title`} className={styles.title}>
          Enquire about this product
        </h2>
        <p className={styles.subtitle}>Leave your details and our sales team will get back to you.</p>
      </div>

      {formError && (
        <div className={styles.alert} role="alert">
          {formError}
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={`${uid}-name`}>
            Name <span className={styles.required}>*</span>
          </label>
          <input {...field('name')} ref={firstFieldRef} autoComplete="name" maxLength={100} required />
          {errorFor('name')}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-email`}>
            Email <span className={styles.required}>*</span>
          </label>
          <input {...field('email')} type="email" autoComplete="email" maxLength={254} required />
          {errorFor('email')}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${uid}-phone`}>
          Phone <span className={styles.optional}>(optional)</span>
        </label>
        <input {...field('phone')} type="tel" autoComplete="tel" maxLength={30} />
        {errorFor('phone')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${uid}-message`}>
          Message <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          {...field('message')}
          rows={4}
          maxLength={2000}
          placeholder="E.g. Is this available in other sizes? When could it be delivered?"
        />
        {errorFor('message')}
      </div>

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set('website')}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send enquiry'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
      <p className={styles.privacy}>We only use your details to reply to this enquiry.</p>
    </form>
  );
}
