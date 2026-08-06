'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import type { ContentLocale } from '@/lib/content/localization';
import { privacyPolicyPath } from '@/lib/contact/programme-question';
import {
  publicEnquiryCopy,
  type PublicEnquiryErrors,
  type PublicEnquiryInput,
  type PublicEnquiryType,
  validatePublicEnquiry,
} from '@/lib/contact/public-enquiry';

const initialValues = { name: '', email: '', phone: '', message: '', privacyAccepted: false, website: '' };

export function PublicEnquiryForm({ type, locale }: { type: PublicEnquiryType; locale: ContentLocale }) {
  const copy = publicEnquiryCopy[locale];
  const formCopy = copy.forms[type];
  const prefix = `${type}-${locale}`;
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PublicEnquiryErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [submissionError, setSubmissionError] = useState('');

  function input(): PublicEnquiryInput { return { type, locale, ...values }; }
  function clearError(field: keyof PublicEnquiryErrors) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    const validationErrors = validatePublicEnquiry(input());
    setErrors(validationErrors);
    setSubmissionError('');
    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/v1/public/contact-submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input()),
      });
      const result = await response.json() as { error?: { code?: string; fields?: PublicEnquiryErrors } };
      if (!response.ok) {
        if (result.error?.fields) setErrors(result.error.fields);
        setSubmissionError(
          result.error?.code === 'rate_limited' ? copy.rate
            : result.error?.code === 'captcha_required' || result.error?.code === 'captcha_failed' ? copy.captcha
              : copy.temporary,
        );
        setStatus('idle');
        return;
      }
      setStatus('success');
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setSubmissionError(copy.connection);
      setStatus('idle');
    }
  }

  return (
    <section className="programme-question-section" id="contact" aria-labelledby={`${prefix}-title`}>
      <div className="programme-question-intro">
        <p className="eyebrow">{formCopy.eyebrow}</p>
        <h2 id={`${prefix}-title`}>{formCopy.title}</h2>
        <p>{formCopy.intro}</p>
      </div>
      {status === 'success' ? (
        <div className="programme-question-success" ref={successRef} role="status" tabIndex={-1}>
          <span aria-hidden="true">✓</span><div><h3>{formCopy.successTitle}</h3><p>{formCopy.successBody}</p></div>
        </div>
      ) : (
        <form className="programme-question-form" ref={formRef} onSubmit={submit} noValidate>
          <p className="required-hint"><span aria-hidden="true">*</span> {copy.required}</p>
          <div className="programme-question-fields">
            <div className="form-field"><label htmlFor={`${prefix}-name`}>{copy.name} <span aria-hidden="true">*</span></label><input id={`${prefix}-name`} autoComplete="name" required value={values.name} onChange={(event) => { setValues({ ...values, name: event.target.value }); clearError('name'); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${prefix}-name-error` : undefined} placeholder={copy.namePlaceholder} />{errors.name ? <p className="field-error" id={`${prefix}-name-error`}>{errors.name}</p> : null}</div>
            <div className="form-field"><label htmlFor={`${prefix}-email`}>{copy.email} <span aria-hidden="true">*</span></label><input id={`${prefix}-email`} type="email" inputMode="email" autoComplete="email" required value={values.email} onChange={(event) => { setValues({ ...values, email: event.target.value }); clearError('email'); }} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${prefix}-email-error` : undefined} placeholder={copy.emailPlaceholder} />{errors.email ? <p className="field-error" id={`${prefix}-email-error`}>{errors.email}</p> : null}</div>
            <div className="form-field form-field-wide"><label htmlFor={`${prefix}-phone`}>{copy.phone} <small>{copy.optional}</small></label><input id={`${prefix}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(event) => { setValues({ ...values, phone: event.target.value }); clearError('phone'); }} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${prefix}-phone-error` : undefined} placeholder={copy.phonePlaceholder} />{errors.phone ? <p className="field-error" id={`${prefix}-phone-error`}>{errors.phone}</p> : null}</div>
            <div className="form-field form-field-wide"><label htmlFor={`${prefix}-message`}>{copy.message} <span aria-hidden="true">*</span></label><textarea id={`${prefix}-message`} rows={6} required value={values.message} onChange={(event) => { setValues({ ...values, message: event.target.value }); clearError('message'); }} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? `${prefix}-message-error` : undefined} placeholder={copy.messagePlaceholder} />{errors.message ? <p className="field-error" id={`${prefix}-message-error`}>{errors.message}</p> : null}</div>
          </div>
          <div className="form-honeypot" hidden aria-hidden="true"><label htmlFor={`${prefix}-website`}>Website</label><input id={`${prefix}-website`} tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => setValues({ ...values, website: event.target.value })} /></div>
          <div className="privacy-field"><input id={`${prefix}-privacy`} type="checkbox" required checked={values.privacyAccepted} onChange={(event) => { setValues({ ...values, privacyAccepted: event.target.checked }); clearError('privacyAccepted'); }} aria-invalid={Boolean(errors.privacyAccepted)} aria-describedby={errors.privacyAccepted ? `${prefix}-privacy-error` : undefined} /><label htmlFor={`${prefix}-privacy`}>{copy.privacyBefore}<Link href={privacyPolicyPath(locale)}>{copy.privacyLink}</Link>{copy.privacyAfter}</label></div>
          {errors.privacyAccepted ? <p className="field-error privacy-error" id={`${prefix}-privacy-error`}>{errors.privacyAccepted}</p> : null}
          {submissionError ? <p className="form-submit-error" role="alert">{submissionError}</p> : null}
          <button className="button primary programme-question-submit" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? copy.submitting : formCopy.submit}<span aria-hidden="true">→</span></button>
        </form>
      )}
    </section>
  );
}
