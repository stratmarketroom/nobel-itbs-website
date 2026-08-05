'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

const copy = {
  en: { aria: 'Cookie consent', text: 'We use necessary cookies to operate this website. With your consent, we may also use optional cookies for analytics and website improvement. You can accept or decline them.', accept: 'Accept', decline: 'Decline' },
  ua: { aria: 'Згода на використання cookie', text: 'Ми використовуємо необхідні cookie для роботи сайту. За вашою згодою ми також можемо використовувати необов’язкові cookie для аналітики та покращення сайту. Ви можете прийняти або відхилити їх.', accept: 'Приймаю', decline: 'Не приймаю' },
  cz: { aria: 'Souhlas s používáním souborů cookie', text: 'Používáme nezbytné soubory cookie pro fungování tohoto webu. S vaším souhlasem můžeme používat také volitelné soubory cookie pro analytiku a zlepšování webu. Můžete je přijmout nebo odmítnout.', accept: 'Přijímám', decline: 'Odmítám' },
} as const;

export function CookieConsent() {
  const path = usePathname();
  const locale: keyof typeof copy = path === '/ua' || path.startsWith('/ua/') ? 'ua' : path === '/cz' || path.startsWith('/cz/') ? 'cz' : 'en';
  const consent = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange);
      window.addEventListener('nobel-cookie-consent', onStoreChange);
      return () => {
        window.removeEventListener('storage', onStoreChange);
        window.removeEventListener('nobel-cookie-consent', onStoreChange);
      };
    },
    () => window.localStorage.getItem('nobel_cookie_consent') ?? 'pending',
    () => 'unknown',
  );
  function decide(value: 'accepted' | 'declined') {
    window.localStorage.setItem('nobel_cookie_consent', value);
    window.dispatchEvent(new CustomEvent('nobel-cookie-consent', { detail: value }));
  }
  if (consent !== 'pending') return null;
  const current = copy[locale];
  return <aside className="cookie-consent" aria-label={current.aria}><p>{current.text}</p><div><button type="button" onClick={() => decide('declined')}>{current.decline}</button><button type="button" onClick={() => decide('accepted')}>{current.accept}</button></div></aside>;
}
