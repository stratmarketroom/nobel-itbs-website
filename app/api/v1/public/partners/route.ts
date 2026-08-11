import { NextResponse } from 'next/server';
import { resolveContentLocale } from '@/lib/content/localization';
import { getPublicPartners } from '@/lib/partners/public';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveContentLocale(url.searchParams.get('locale'));
  const partners = await getPublicPartners(locale);

  return NextResponse.json(partners, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  });
}
