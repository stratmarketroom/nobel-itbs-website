'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import type { ContentLocale } from '@/lib/content/localization';
import {
  privacyPolicyPath,
  programmeQuestionCopy,
  type ProgrammeQuestionErrors,
  type ProgrammeQuestionInput,
  validateProgrammeQuestion,
} from '@/lib/contact/programme-question';

type ProgrammeQuestionFormProps = {
  programmeSlug: string;
  programmeTitle: string;
  locale: ContentLocale;
};

const initialValues = {
  name: '', email: '', phone: '', message: '', privacyAccepted: false, website: '',
};

export function ProgrammeQuestionForm({ programmeSlug, programmeTitle, locale }: ProgrammeQuestionFormProps) {
  const copy = programmeQuestionCopy[locale];
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ProgrammeQuestionErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [submissionError, setSubmissionError] = useState('');

  function input(): ProgrammeQuestionInput {
    return { programmeSlug, locale, ...values };
  }

  function clearError(field: keyof ProgrammeQuestionErrors) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const validationErrors = validateProgrammeQuestion(input());
    setErrors(validationErrors);
    setSubmissionError('');
    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/v1/public/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input()),
      });
      const result = await response.json() as { error?: { code?: string; fields?: ProgrammeQuestionErrors } };

      if (!response.ok) {
        if (result.error?.fields) setErrors(result.error.fields);
        setSubmissionError(result.error?.code === 'rate_limited' ? `${copy.rateTitle}. ${copy.rateBody}` : copy.temporary);
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

  if (status === 'success') {
    return (
      <div className="programme-question-success" ref={successRef} role="status" tabIndex={-1}>
        <span aria-hidden="true">✓</span>
        <div><h3>{copy.successTitle}</h3><p>{copy.successBody}</p></div>
      </div>
    );
  }

  return (
    <form className="programme-question-form" ref={formRef} onSubmit={submit} noValidate>
      <div className="programme-context" aria-label={`${copy.programme}: ${programmeTitle}`}>
        <span>{copy.programme}</span><strong>{programmeTitle}</strong>
      </div>
      <p className="required-hint"><span aria-hidden="true">*</span> {copy.required}</p>

      <div className="programme-question-fields">
        <div className="form-field">
          <label htmlFor={`${programmeSlug}-name`}>{copy.name} <span aria-hidden="true">*</span></label>
          <input id={`${programmeSlug}-name`} autoComplete="name" required value={values.name} onChange={(event) => { setValues({ ...values, name: event.target.value }); clearError('name'); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${programmeSlug}-name-error` : undefined} placeholder={copy.namePlaceholder} />
          {errors.name ? <p className="field-error" id={`${programmeSlug}-name-error`}>{errors.name}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor={`${programmeSlug}-email`}>{copy.email} <span aria-hidden="true">*</span></label>
          <input id={`${programmeSlug}-email`} type="email" inputMode="email" autoComplete="email" required value={values.email} onChange={(event) => { setValues({ ...values, email: event.target.value }); clearError('email'); }} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${programmeSlug}-email-error` : undefined} placeholder={copy.emailPlaceholder} />
          {errors.email ? <p className="field-error" id={`${programmeSlug}-email-error`}>{errors.email}</p> : null}
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor={`${programmeSlug}-phone`}>{copy.phone} <small>{copy.optional}</small></label>
          <input id={`${programmeSlug}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(event) => { setValues({ ...values, phone: event.target.value }); clearError('phone'); }} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${programmeSlug}-phone-error` : undefined} placeholder={copy.phonePlaceholder} />
          {errors.phone ? <p className="field-error" id={`${programmeSlug}-phone-error`}>{errors.phone}</p> : null}
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor={`${programmeSlug}-message`}>{copy.message} <span aria-hidden="true">*</span></label>
          <textarea id={`${programmeSlug}-message`} rows={6} required value={values.message} onChange={(event) => { setValues({ ...values, message: event.target.value }); clearError('message'); }} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? `${programmeSlug}-message-error` : undefined} placeholder={copy.messagePlaceholder} />
          {errors.message ? <p className="field-error" id={`${programmeSlug}-message-error`}>{errors.message}</p> : null}
        </div>
      </div>

      <div className="form-honeypot" hidden aria-hidden="true">
        <label htmlFor={`${programmeSlug}-website`}>Website</label>
        <input id={`${programmeSlug}-website`} tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => setValues({ ...values, website: event.target.value })} />
      </div>

      <div className="privacy-field">
        <input id={`${programmeSlug}-privacy`} type="checkbox" required checked={values.privacyAccepted} onChange={(event) => { setValues({ ...values, privacyAccepted: event.target.checked }); clearError('privacyAccepted'); }} aria-invalid={Boolean(errors.privacyAccepted)} aria-describedby={errors.privacyAccepted ? `${programmeSlug}-privacy-error` : undefined} />
        <label htmlFor={`${programmeSlug}-privacy`}>{copy.privacyBefore}<Link href={privacyPolicyPath(locale)}>{copy.privacyLink}</Link>{copy.privacyAfter}</label>
      </div>
      {errors.privacyAccepted ? <p className="field-error privacy-error" id={`${programmeSlug}-privacy-error`}>{errors.privacyAccepted}</p> : null}

      {submissionError ? <p className="form-submit-error" role="alert">{submissionError}</p> : null}
      <button className="button primary programme-question-submit" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? copy.submitting : copy.submit}<span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
