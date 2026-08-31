import { NextResponse, type NextRequest } from 'next/server';
import { htmlLanguageForPathname, htmlLanguageHeader } from '@/lib/content/html-language';
import { prefixedLocales } from '@/lib/i18n';
import { getProgrammeSlugRedirect } from '@/lib/programmes/slug-redirects';
import { canonicalHost } from '@/lib/seo/urls';

const publicFilePattern = /\.(.*)$/;
const localeAliases = { en: '', uk: '/ua', cs: '/cz' } as const;
const legacyRedirects: Record<string, string> = {
  '/human': '/programmes/psychology-human',
  '/tech': '/programmes/technology-innovation',
  '/business': '/programmes/business-management',
  '/tracks': '/programmes',
  '/works': '/about',
  '/aboutus': '/about',
  '/about-us-en': '/about',
  '/course-en': '/programmes/space-business',
  '/contacts-en': '/about',
  '/termsofservice': '/terms-of-use',
  '/terms': '/terms-of-use',
  '/refund': '/refund-policy',
  '/privacypolicy': '/privacy-policy',
  '/privacy': '/privacy-policy',
  '/home-page-2': '/',
};
const removedLegacyPaths = new Set(['/blog-en']);

function normalizedPathname(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}

function localeAliasPath(pathname: string): string | null {
  for (const [alias, prefix] of Object.entries(localeAliases)) {
    const aliasRoot = `/${alias}`;
    if (pathname === aliasRoot) return prefix || '/';
    if (pathname.startsWith(`${aliasRoot}/`)) return `${prefix}${pathname.slice(aliasRoot.length)}` || '/';
  }
  return null;
}

function canonicalHostRedirect(request: NextRequest, pathname: string): NextResponse | null {
  const forwardedHost = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const host = forwardedHost.split(':')[0];
  const protocol = (request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', ''))
    .split(',')[0]
    .trim()
    .toLowerCase();

  if (host !== `www.${canonicalHost}` && !(host === canonicalHost && protocol !== 'https')) return null;

  const destination = new URL(request.url);
  destination.protocol = 'https:';
  destination.hostname = canonicalHost;
  destination.port = '';
  destination.pathname = pathname;
  return NextResponse.redirect(destination, 301);
}

function redirectPath(request: NextRequest, pathname: string): NextResponse {
  const destination = new URL(request.url);
  destination.pathname = pathname;
  return NextResponse.redirect(destination, 301);
}

function goneResponse(): NextResponse {
  return new NextResponse('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function programmeSlugPath(pathname: string): { locale: 'en' | 'ua' | 'cz'; slug: string } | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 2 && segments[0] === 'programmes') {
    return { locale: 'en', slug: segments[1] };
  }
  if (
    segments.length === 3
    && prefixedLocales.includes(segments[0] as 'ua' | 'cz')
    && segments[1] === 'programmes'
  ) {
    return { locale: segments[0] as 'ua' | 'cz', slug: segments[2] };
  }
  return null;
}

function nextWithHtmlLanguage(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(htmlLanguageHeader, htmlLanguageForPathname(request.nextUrl.pathname));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function nextWithoutPublicDiscovery(request: NextRequest) {
  const response = nextWithHtmlLanguage(request);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalized = normalizedPathname(pathname);
  const aliased = localeAliasPath(normalized);
  const canonicalCandidate = aliased ?? normalized;
  if (removedLegacyPaths.has(canonicalCandidate)) return goneResponse();

  const legacyDestination = legacyRedirects[canonicalCandidate];
  const hostRedirect = canonicalHostRedirect(request, legacyDestination ?? canonicalCandidate);
  if (hostRedirect) return hostRedirect;

  if (legacyDestination) return redirectPath(request, legacyDestination);
  if (aliased !== null || normalized !== pathname) return redirectPath(request, canonicalCandidate);

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    publicFilePattern.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api')) {
    return nextWithoutPublicDiscovery(request);
  }

  const [firstSegment] = pathname.split('/').filter(Boolean);

  if (firstSegment && firstSegment.length === 2 && !prefixedLocales.includes(firstSegment as 'ua' | 'cz')) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  const programmePath = programmeSlugPath(pathname);
  if (programmePath) {
    const currentSlug = await getProgrammeSlugRedirect(programmePath.slug);
    if (currentSlug) {
      const destination = request.nextUrl.clone();
      destination.pathname = programmePath.locale === 'en'
        ? `/programmes/${currentSlug}`
        : `/${programmePath.locale}/programmes/${currentSlug}`;
      return NextResponse.redirect(destination, 301);
    }
  }

  return nextWithHtmlLanguage(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
