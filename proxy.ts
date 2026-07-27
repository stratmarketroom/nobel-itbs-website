import { NextResponse, type NextRequest } from 'next/server';
import { prefixedLocales } from '@/lib/i18n';

const publicFilePattern = /\.(.*)$/;

export function proxy(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
