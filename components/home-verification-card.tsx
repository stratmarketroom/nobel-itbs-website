'use client';

import Link from 'next/link';
import { KeyboardEvent, useId, useState } from 'react';
import type { ContentLocale } from '@/lib/content/localization';

export type HomeVerificationCopy = {
  title: string;
  inputLabel: string;
  placeholder: string;
  submitLabel: string;
  linkLabel: string;
  numberTab: string;
  qrTab: string;
  qrInstruction: string;
  tabsLabel: string;
};

type HomeVerificationCardProps = {
  copy: HomeVerificationCopy;
  locale: ContentLocale;
  verifyHref: string;
};

export function HomeVerificationCard({ copy, locale, verifyHref }: HomeVerificationCardProps) {
  const [activeTab, setActiveTab] = useState<'number' | 'qr'>('number');
  const instanceId = useId().replaceAll(':', '');
  const numberTabId = `home-verify-number-tab-${locale}-${instanceId}`;
  const numberPanelId = `home-verify-number-panel-${locale}-${instanceId}`;
  const qrTabId = `home-verify-qr-tab-${locale}-${instanceId}`;
  const qrPanelId = `home-verify-qr-panel-${locale}-${instanceId}`;
  const inputId = `home-document-number-${locale}-${instanceId}`;

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'ArrowLeft' || event.key === 'Home' ? 'number' : 'qr';
    setActiveTab(next);
    document.getElementById(next === 'number' ? numberTabId : qrTabId)?.focus();
  }

  return (
    <aside className="content-home-verify" aria-label={copy.title}>
      <h2>{copy.title}</h2>

      <div className="content-home-verify-tabs" role="tablist" aria-label={copy.tabsLabel}>
        <button
          type="button"
          role="tab"
          id={numberTabId}
          aria-controls={numberPanelId}
          aria-selected={activeTab === 'number'}
          tabIndex={activeTab === 'number' ? 0 : -1}
          onClick={() => setActiveTab('number')}
          onKeyDown={handleTabKey}
        >
          {copy.numberTab}
        </button>
        <button
          type="button"
          role="tab"
          id={qrTabId}
          aria-controls={qrPanelId}
          aria-selected={activeTab === 'qr'}
          tabIndex={activeTab === 'qr' ? 0 : -1}
          onClick={() => setActiveTab('qr')}
          onKeyDown={handleTabKey}
        >
          {copy.qrTab}
        </button>
      </div>

      <div
        className="content-home-verify-panel"
        id={numberPanelId}
        role="tabpanel"
        aria-labelledby={numberTabId}
        hidden={activeTab !== 'number'}
      >
        <form className="content-home-verify-form" action={verifyHref} method="get">
          <label htmlFor={inputId}>{copy.inputLabel}</label>
          <div>
            <input
              id={inputId}
              name="documentNumber"
              placeholder={copy.placeholder}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit">{copy.submitLabel}</button>
          </div>
        </form>
      </div>

      <div
        className="content-home-verify-panel content-home-verify-qr"
        id={qrPanelId}
        role="tabpanel"
        aria-labelledby={qrTabId}
        hidden={activeTab !== 'qr'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h6v6H4V4Zm2 2v2h2V6H6Zm8-2h6v6h-6V4Zm2 2v2h2V6h-2ZM4 14h6v6H4v-6Zm2 2v2h2v-2H6Zm8-2h2v2h-2v-2Zm4 0h2v4h-2v-4Zm-4 4h2v2h-2v-2Zm4 2v-2h2v2h-2Z" />
        </svg>
        <p>{copy.qrInstruction}</p>
      </div>

      <Link className="content-home-text-link" href={verifyHref}>
        {copy.linkLabel}<span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
