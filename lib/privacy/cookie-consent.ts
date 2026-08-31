export const COOKIE_CONSENT_STORAGE_KEY = 'nobel_cookie_consent';
export const COOKIE_CONSENT_CHANGE_EVENT = 'nobel-cookie-consent';
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 31_536_000;

export type CookieConsentDecision = 'accepted' | 'declined' | 'pending';
export type PersistedCookieConsentDecision = Exclude<CookieConsentDecision, 'pending'>;

export function parseCookieConsentDecision(value: string | null | undefined): CookieConsentDecision {
  return value === 'accepted' || value === 'declined' ? value : 'pending';
}

export function readCookieConsentDecision(cookieHeader: string): CookieConsentDecision {
  const encodedDecision = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_STORAGE_KEY}=`))
    ?.slice(COOKIE_CONSENT_STORAGE_KEY.length + 1);

  if (!encodedDecision) return 'pending';

  try {
    return parseCookieConsentDecision(decodeURIComponent(encodedDecision));
  } catch {
    return 'pending';
  }
}

export function serializeCookieConsentDecision(
  decision: PersistedCookieConsentDecision,
  secure: boolean,
) {
  return [
    `${COOKIE_CONSENT_STORAGE_KEY}=${decision}`,
    'Path=/',
    `Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}
