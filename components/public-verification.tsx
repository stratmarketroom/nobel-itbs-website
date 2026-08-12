'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useId, useState } from 'react';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import type { PublicCredentialVerification, PublicVerificationErrorCode } from '@/lib/credentials/verification-types';
import { verificationCopy } from '@/lib/credentials/verification-copy';
import { homeCopy } from '@/lib/i18n';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'result'; value: PublicCredentialVerification }
  | { kind: 'error'; code: Exclude<PublicVerificationErrorCode, 'invalid_request'> | 'connection_error' };

type PublicVerificationProps = { locale: ContentLocale; token?: string; initialDocumentNumber?: string };

const localeLabels: Record<ContentLocale, string> = { en: 'EN', ua: 'UA', cz: 'CZ' };
const numberFormat = /^NITBS-[CD]-\d{4}-\d{6}$/;

async function requestVerification(endpoint: string, init?: RequestInit): Promise<ViewState> {
  try {
    const response = await fetch(endpoint, { ...init, cache: 'no-store' });
    const payload = await response.json() as PublicCredentialVerification | { error?: { code?: PublicVerificationErrorCode } };
    if (response.status === 429) return { kind: 'error', code: 'rate_limited' };
    if (!response.ok) return { kind: 'error', code: 'temporary_error' };
    return { kind: 'result', value: payload as PublicCredentialVerification };
  } catch {
    return { kind: 'error', code: 'connection_error' };
  }
}

function tokenPath(locale: ContentLocale, token: string): string {
  return localizePublicPath(locale, `/verify/${encodeURIComponent(token)}`);
}

function formatIssueDate(value: string, locale: ContentLocale) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale === 'ua' ? 'uk-UA' : locale === 'cz' ? 'cs-CZ' : 'en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

export function PublicVerification({ locale, token, initialDocumentNumber = '' }: PublicVerificationProps) {
  const copy = verificationCopy[locale];
  const shellCopy = homeCopy[locale];
  const inputId = useId();
  const errorId = useId();
  const initialNumber = initialDocumentNumber.trim().toUpperCase();
  const [documentNumber, setDocumentNumber] = useState(initialNumber);
  const [fieldError, setFieldError] = useState('');
  const [state, setState] = useState<ViewState>(token ? { kind: 'loading' } : { kind: 'idle' });

  const performRequest = useCallback(async (endpoint: string, init?: RequestInit) => {
    setState({ kind: 'loading' });
    setState(await requestVerification(endpoint, init));
  }, []);

  useEffect(() => {
    if (token) void requestVerification(`/api/v1/public/verify/${encodeURIComponent(token)}`).then(setState);
  }, [token]);

  useEffect(() => {
    if (token || !numberFormat.test(initialNumber)) return;
    void requestVerification('/api/v1/public/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentNumber: initialNumber }),
    }).then(setState);
  }, [initialNumber, token]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = documentNumber.trim().toUpperCase();
    if (!normalized) return setFieldError(copy.requiredError);
    if (!numberFormat.test(normalized)) return setFieldError(copy.formatError);
    setFieldError('');
    setDocumentNumber(normalized);
    void performRequest('/api/v1/public/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentNumber: normalized }),
    });
  }

  function retry() {
    if (token) {
      void performRequest(`/api/v1/public/verify/${encodeURIComponent(token)}`);
      return;
    }
    const normalized = documentNumber.trim().toUpperCase();
    if (numberFormat.test(normalized)) {
      void performRequest('/api/v1/public/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentNumber: normalized }),
      });
    }
  }

  const errorCopy = state.kind === 'error'
    ? state.code === 'rate_limited' ? copy.rateLimited
      : state.code === 'connection_error' ? copy.connection
        : copy.temporary
    : null;

  return (
    <main className="verification-page">
      <header className="site-header verification-header">
        <Link className="brand" href={shellCopy.homeHref} aria-label="Nobel ITBS home">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
        </Link>
        <nav className="nav" aria-label={shellCopy.navLabel}>
          {shellCopy.nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.href.endsWith('/verify') ? 'page' : undefined}>{item.label}</Link>
          ))}
        </nav>
        <nav className="locale-switcher" aria-label={shellCopy.localeLabel}>
          {(['en', 'ua', 'cz'] as const).map((itemLocale) => (
            <Link key={itemLocale} href={token ? tokenPath(itemLocale, token) : localizePublicPath(itemLocale, '/verify')} aria-current={itemLocale === locale ? 'page' : undefined}>
              {localeLabels[itemLocale]}
            </Link>
          ))}
        </nav>
      </header>

      <section className="verification-hero" aria-labelledby="verification-title">
        <div className="verification-intro">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="verification-title">{copy.title}</h1>
          <p className="verification-lead">{copy.lead}</p>
          <p className="verification-instruction">{copy.instruction}</p>
        </div>

        <div className="verification-tool">
          {!token ? (
            <form onSubmit={submit} noValidate>
              <label htmlFor={inputId}>{copy.fieldLabel}</label>
              <div className="verification-input-row">
                <input
                  id={inputId}
                  name="documentNumber"
                  value={documentNumber}
                  onChange={(event) => { setDocumentNumber(event.target.value); setFieldError(''); }}
                  placeholder={copy.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? errorId : `${inputId}-helper`}
                  disabled={state.kind === 'loading'}
                />
                <button type="submit" disabled={state.kind === 'loading'}>{state.kind === 'loading' ? copy.submitting : copy.submit}</button>
              </div>
              {fieldError ? <p className="verification-field-error" id={errorId}>{fieldError}</p> : <p className="verification-helper" id={`${inputId}-helper`}>{copy.fieldHelper}</p>}
            </form>
          ) : state.kind === 'loading' ? (
            <div className="verification-loading" role="status"><span aria-hidden="true" />{copy.loading}</div>
          ) : null}

          <div className="verification-result" aria-live="polite">
            {state.kind === 'result' && state.value.result === 'valid' ? (
              <article className="verification-status verification-status-valid">
                <p className="verification-status-label"><span aria-hidden="true">✓</span>{copy.valid.status}</p>
                <h2>{copy.valid.heading}</h2><p>{copy.valid.body}</p>
                <dl>
                  <div><dt>{copy.fields.documentNumber}</dt><dd>{state.value.document.documentNumber}</dd></div>
                  <div><dt>{copy.fields.holderName}</dt><dd>{state.value.document.holderName}</dd></div>
                  <div><dt>{copy.fields.programmeTitle}</dt><dd>{state.value.document.programmeTitle}</dd></div>
                  <div><dt>{copy.fields.credentialType}</dt><dd>{state.value.document.credentialType}</dd></div>
                  <div><dt>{copy.fields.issueDate}</dt><dd>{formatIssueDate(state.value.document.issueDate, locale)}</dd></div>
                </dl>
                <p className="verification-note">{copy.valid.note}</p>
              </article>
            ) : null}
            {state.kind === 'result' && state.value.result === 'revoked' ? (
              <article className="verification-status verification-status-revoked">
                <p className="verification-status-label"><span aria-hidden="true">!</span>{copy.revoked.status}</p>
                <h2>{copy.revoked.heading}</h2><p>{copy.revoked.body}</p>
              </article>
            ) : null}
            {state.kind === 'result' && state.value.result === 'not_found' ? (
              <article className="verification-status verification-status-not-found">
                <p className="verification-status-label"><span aria-hidden="true">?</span>{copy.notFound.heading}</p>
                <h2>{copy.notFound.heading}</h2><p>{copy.notFound.body}</p><p className="verification-note">{copy.notFound.helper}</p>
              </article>
            ) : null}
            {errorCopy ? (
              <article className="verification-status verification-status-error">
                <p className="verification-status-label"><span aria-hidden="true">!</span>{errorCopy.heading}</p>
                <h2>{errorCopy.heading}</h2><p>{errorCopy.body}</p>
                <button type="button" onClick={retry}>{errorCopy.button}</button>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="site-footer verification-footer">
        <div className="footer-brand"><Image src="/brand/nobel-logo-full-horizontal-web.svg" width={180} height={42} alt="Nobel ITBS" /><p>{shellCopy.footer.text}</p></div>
        {shellCopy.footer.columns.map((column) => <nav key={column.title} aria-label={column.title}><h2>{column.title}</h2>{column.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>)}
        <address><h2>{copy.contact}</h2>{shellCopy.footer.contact.map((line) => <span key={line}>{line}</span>)}</address>
      </footer>
    </main>
  );
}
