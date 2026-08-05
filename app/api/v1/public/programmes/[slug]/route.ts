import { NextResponse } from 'next/server';
import { resolveContentLocale } from '@/lib/content/localization';
import { getProgrammeNamespaceEntity } from '@/lib/programmes/landing';
import { getProgrammeSlugRedirect } from '@/lib/programmes/slug-redirects';

type ProgrammeRouteContext = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: ProgrammeRouteContext) {
  const { slug } = await context.params;
  const locale = resolveContentLocale(new URL(request.url).searchParams.get('locale'));
  const entity = await getProgrammeNamespaceEntity(slug, locale);

  if (!entity) {
    const currentSlug = await getProgrammeSlugRedirect(slug);
    if (currentSlug) {
      const destination = new URL(request.url);
      destination.pathname = `/api/v1/public/programmes/${currentSlug}`;
      return NextResponse.redirect(destination, 301);
    }
    return NextResponse.json({ error: { code: 'not_found', message: 'Programme page not found.' } }, { status: 404 });
  }

  return NextResponse.json({ locale, entity }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  });
}
