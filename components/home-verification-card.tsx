'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { HomeCopy, Locale } from '@/lib/i18n';

type HomeVerificationCardProps = {
  copy: HomeCopy['verify'];
  locale: Locale;
};

const tabCopy: Record<Locale, { number: string; qr: string; qrInstruction: string; tabsLabel: string }> = {
  en: {
    number: 'Document number',
    qr: 'QR code',
    qrInstruction: 'Scan the QR code on the document with your phone camera to open its verification page.',
    tabsLabel: 'Verification method',
  },
  ua: {
    number: 'Номер документа',
    qr: 'QR-код',
    qrInstruction: 'Відскануйте QR-код на документі камерою телефона, щоб відкрити сторінку перевірки.',
    tabsLabel: 'Спосіб перевірки',
  },
  cz: {
    number: 'Číslo dokumentu',
    qr: 'QR kód',
    qrInstruction: 'Naskenujte QR kód na dokumentu fotoaparátem telefonu a otevřete ověřovací stránku.',
    tabsLabel: 'Způsob ověření',
  },
};

export function HomeVerificationCard({ copy, locale }: HomeVerificationCardProps) {
  const [activeTab, setActiveTab] = useState<'number' | 'qr'>('number');
  const tabs = tabCopy[locale];

  return (
    <aside className="verify-panel" aria-label={copy.title}>
      <h2>{copy.title}</h2>

      <div className="verify-tabs" role="tablist" aria-label={tabs.tabsLabel}>
        <button
          type="button"
          role="tab"
          id={`verify-number-tab-${locale}`}
          aria-controls={`verify-number-panel-${locale}`}
          aria-selected={activeTab === 'number'}
          onClick={() => setActiveTab('number')}
        >
          {tabs.number}
        </button>
        <button
          type="button"
          role="tab"
          id={`verify-qr-tab-${locale}`}
          aria-controls={`verify-qr-panel-${locale}`}
          aria-selected={activeTab === 'qr'}
          onClick={() => setActiveTab('qr')}
        >
          {tabs.qr}
        </button>
      </div>

      {activeTab === 'number' ? (
        <div
          className="verify-tab-panel"
          id={`verify-number-panel-${locale}`}
          role="tabpanel"
          aria-labelledby={`verify-number-tab-${locale}`}
        >
          <form className="verify-mini-form" action={copy.link.href}>
            <label htmlFor={`document-number-${locale}`}>{copy.inputLabel}</label>
            <div>
              <input id={`document-number-${locale}`} name="documentNumber" placeholder={copy.placeholder} />
              <button type="submit">{copy.submitLabel}</button>
            </div>
          </form>
        </div>
      ) : (
        <div
          className="verify-tab-panel verify-qr-panel"
          id={`verify-qr-panel-${locale}`}
          role="tabpanel"
          aria-labelledby={`verify-qr-tab-${locale}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4h6v6H4V4Zm2 2v2h2V6H6Zm8-2h6v6h-6V4Zm2 2v2h2V6h-2ZM4 14h6v6H4v-6Zm2 2v2h2v-2H6Zm8-2h2v2h-2v-2Zm4 0h2v4h-2v-4Zm-4 4h2v2h-2v-2Zm4 2v-2h2v2h-2Z" />
          </svg>
          <p>{tabs.qrInstruction}</p>
        </div>
      )}

      <Link className="text-link" href={copy.link.href}>
        {copy.link.label}
        <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
