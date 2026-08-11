import { NextResponse } from 'next/server';
import { resolveContentLocale } from '@/lib/content/localization';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveContentLocale(url.searchParams.get('locale'));
  const catalogue = await getProgrammeCatalogue(locale);

  return NextResponse.json(catalogue, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
