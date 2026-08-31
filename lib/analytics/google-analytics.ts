export const GOOGLE_ANALYTICS_MEASUREMENT_ID = 'G-RT0GQGPC6V';

const publicLocales = new Set(['ua', 'cz']);

export function getPrivacySafeAnalyticsPath(pathname: string): string | null {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const segments = normalizedPath.split('/').filter(Boolean);

  if (segments[0] === 'admin') return null;

  const hasLocalePrefix = publicLocales.has(segments[0]);
  const routeIndex = hasLocalePrefix ? 1 : 0;
  const localePrefix = hasLocalePrefix ? `/${segments[0]}` : '';

  if (segments[routeIndex] === 'verify' && segments.length > routeIndex + 1) {
    return `${localePrefix}/verify/result`;
  }

  return normalizedPath || '/';
}
