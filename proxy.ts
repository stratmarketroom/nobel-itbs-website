import { NextResponse, type NextRequest } from 'next/server';
import { prefixedLocales } from '@/lib/i18n';
import { getProgrammeSlugRedirect } from '@/lib/programmes/slug-redirects';

const publicFilePattern = /\.(.*)$/;

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    publicFilePattern.test(pathname)
  ) {
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
