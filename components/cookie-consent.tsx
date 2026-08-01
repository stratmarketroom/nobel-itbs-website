'use client';

import { useEffect, useState } from 'react';

type CookieLocale = 'en' | 'ua' | 'cz';

const cookieCopy: Record<CookieLocale, { ariaLabel: string; text: string; accept: string; decline: string }> = {
  en: {
    ariaLabel: 'Cookie consent',
    text:
      'We use necessary cookies to operate this website. With your consent, we may also use optional cookies for analytics and website improvement. You can accept or decline them.',
    accept: 'Accept',
    decline: 'Decline',
  },
  ua: {
    ariaLabel: 'Згода на використання cookie',
    text:
      'Ми використовуємо необхідні cookie для роботи сайту. За вашою згодою ми також можемо використовувати необов’язкові cookie для аналітики та покращення сайту. Ви можете прийняти або відхилити їх.',
    accept: 'Приймаю',
    decline: 'Не приймаю',
  },
  cz: {
    ariaLabel: 'Souhlas s používáním souborů cookie',
    text:
      'Používáme nezbytné soubory cookie pro fungování tohoto webu. S vaším souhlasem můžeme používat také volitelné soubory cookie pro analytiku a zlepšování webu. Můžete je přijmout nebo odmítnout.',
    accept: 'Přijímám',
    decline: 'Odmítám',
  },
};

function getLocaleFromPath(pathname: string): CookieLocale {
  if (pathname.startsWith('/ua')) {
    return 'ua';
  }

  if (pathname.startsWith('/cz')) {
    return 'cz';
  }

  return 'en';
}

export function CookieConsent() {
  const [locale, setLocale] = useState<CookieLocale>('en');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocale(getLocaleFromPath(window.location.pathname));
      setIsVisible(!localStorage.getItem('nobel-itbs-cookie-consent'));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const storeChoice = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(
      'nobel-itbs-cookie-consent',
      JSON.stringify({ choice, version: 'release-1-minimal', decidedAt: new Date().toISOString() }),
    );
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const copy = cookieCopy[locale];

  return (
    <section className="cookie-consent" aria-label={copy.ariaLabel}>
      <p>{copy.text}</p>
      <div>
        <button type="button" onClick={() => storeChoice('accepted')}>
          {copy.accept}
        </button>
        <button type="button" onClick={() => storeChoice('declined')}>
          {copy.decline}
        </button>
      </div>
    </section>
  );
}
