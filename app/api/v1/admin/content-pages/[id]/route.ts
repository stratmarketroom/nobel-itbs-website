import {
  pageRecordStatuses,
  pageTranslationStatuses,
  updateContentPageTranslation,
  type ContentTranslationUpdate,
  type PageRecordStatus,
} from '@/lib/content/admin';
import { contentLocales, type ContentLocale, type TranslationStatus } from '@/lib/content/localization';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > 5000) throw new ApiError('bad_request', 400, 'Invalid text field.');
  return value.trim();
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    if (!uuidPattern.test(id)) throw new ApiError('bad_request', 400, 'Invalid content page ID.');
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) throw new ApiError('bad_request', 400, 'Valid JSON body is required.');
    if (!pageRecordStatuses.includes(body.pageStatus as PageRecordStatus)) throw new ApiError('bad_request', 400, 'Invalid page status.');
    if (!contentLocales.includes(body.languageCode as ContentLocale)) throw new ApiError('bad_request', 400, 'Invalid language code.');
    if (!pageTranslationStatuses.includes(body.translationStatus as TranslationStatus)) throw new ApiError('bad_request', 400, 'Invalid translation status.');
    if (!body.sections || typeof body.sections !== 'object' || Array.isArray(body.sections)) throw new ApiError('bad_request', 400, 'Sections must be a JSON object.');

    const input: ContentTranslationUpdate = {
      pageStatus: body.pageStatus as PageRecordStatus,
      languageCode: body.languageCode as ContentLocale,
      translationStatus: body.translationStatus as TranslationStatus,
      seoTitle: nullableText(body.seoTitle),
      seoDescription: nullableText(body.seoDescription),
      h1: nullableText(body.h1),
      sections: body.sections as Record<string, unknown>,
    };
    return jsonOk({ page: await updateContentPageTranslation(context, id, input) });
  } catch (error) {
    return jsonError(error);
  }
}
