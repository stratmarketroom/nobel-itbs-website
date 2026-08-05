import { contentLocales, type ContentLocale } from '@/lib/content/localization';
import { getStructuredContentPage, type ContentPageKey } from '@/lib/content/pages';
import { jsonOk } from '@/lib/api/responses';

const pageKeys: ContentPageKey[] = ['home', 'about', 'partnerships', 'for_organisations'];

export async function GET(request: Request, props: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await props.params;
  const localeValue = new URL(request.url).searchParams.get('locale') ?? 'en';
  if (!pageKeys.includes(pageKey as ContentPageKey) || !contentLocales.includes(localeValue as ContentLocale)) {
    return Response.json({ error: { code: 'not_found' } }, { status: 404 });
  }
  const page = await getStructuredContentPage(pageKey as ContentPageKey, localeValue as ContentLocale);
  if (!page) return Response.json({ error: { code: 'not_found' } }, { status: 404 });
  return jsonOk({ page });
}
