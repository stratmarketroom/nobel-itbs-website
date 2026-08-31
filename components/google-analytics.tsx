'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  getPrivacySafeAnalyticsPath,
} from '@/lib/analytics/google-analytics';
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  parseCookieConsentDecision,
  readCookieConsentDecision,
  type CookieConsentDecision,
} from '@/lib/privacy/cookie-consent';

type DataLayerValue = unknown[];
type Gtag = (...args: DataLayerValue) => void;

declare global {
  interface Window {
    dataLayer?: DataLayerValue[];
    gtag?: Gtag;
    nobelGoogleAnalyticsConfigured?: boolean;
  }
}

const googleAnalyticsScriptId = 'nobel-google-analytics';
const googleAnalyticsDisableKey = `ga-disable-${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

function getConsentSnapshot(initialConsent: CookieConsentDecision) {
  try {
    const storedDecision = parseCookieConsentDecision(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
    if (storedDecision !== 'pending') return storedDecision;
  } catch {
    // The necessary cookie remains available when localStorage is unavailable.
  }

  const cookieDecision = readCookieConsentDecision(document.cookie);
  return cookieDecision === 'pending' ? initialConsent : cookieDecision;
}

function configureGoogleAnalytics(safePath: string) {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: DataLayerValue) => window.dataLayer?.push(args));

  if (!window.nobelGoogleAnalyticsConfigured) {
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.nobelGoogleAnalyticsConfigured = true;
  }

  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  window.gtag('config', GOOGLE_ANALYTICS_MEASUREMENT_ID, {
    send_page_view: false,
    page_path: safePath,
    page_location: `${window.location.origin}${safePath}`,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  if (!document.getElementById(googleAnalyticsScriptId)) {
    const script = document.createElement('script');
    script.id = googleAnalyticsScriptId;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
}

export function GoogleAnalytics({ initialConsent }: { initialConsent: CookieConsentDecision }) {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const consent = useSyncExternalStore(
    subscribeToConsent,
    () => getConsentSnapshot(initialConsent),
    () => initialConsent,
  );

  useEffect(() => {
    const safePath = getPrivacySafeAnalyticsPath(pathname);

    if (safePath === null || consent !== 'accepted') {
      Object.defineProperty(window, googleAnalyticsDisableKey, { configurable: true, value: true, writable: true });
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      lastTrackedPath.current = null;
      return;
    }

    Object.defineProperty(window, googleAnalyticsDisableKey, { configurable: true, value: false, writable: true });
    configureGoogleAnalytics(safePath);

    if (lastTrackedPath.current === safePath) return;

    window.gtag?.('event', 'page_view', {
      page_path: safePath,
      page_location: `${window.location.origin}${safePath}`,
      page_title: document.title,
    });
    lastTrackedPath.current = safePath;
  }, [consent, pathname]);

  return null;
}
