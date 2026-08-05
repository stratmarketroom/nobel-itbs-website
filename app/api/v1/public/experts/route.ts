import { NextResponse } from 'next/server';
import { resolveContentLocale } from '@/lib/content/localization';
import { getPublicExperts } from '@/lib/experts/public';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveContentLocale(url.searchParams.get('locale'));
  const experts = await getPublicExperts(locale);

  return NextResponse.json(experts, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  });
}
