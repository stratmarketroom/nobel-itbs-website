import 'server-only';
import type { AdminContext } from '@/lib/supabase/server';
import { ApiError, assertCanManageContent, getSupabaseRequestClient } from '@/lib/supabase/server';
import type { ContentLocale, TranslationStatus } from './localization';

export const pageRecordStatuses = ['draft', 'published', 'archived'] as const;
export const pageTranslationStatuses = ['missing', 'draft', 'published'] as const;
export type PageRecordStatus = (typeof pageRecordStatuses)[number];

export type AdminContentTranslation = {
  language_code: ContentLocale;
  translation_status: TranslationStatus;
  seo_title: string | null;
  seo_description: string | null;
  h1: string | null;
  sections: Record<string, unknown>;
  updated_at: string;
};

export type AdminContentPage = {
  id: string;
  page_key: string;
  page_type: string;
  status: PageRecordStatus;
  updated_at: string;
  content_page_translations: AdminContentTranslation[];
};

export type ContentTranslationUpdate = {
  pageStatus: PageRecordStatus;
  languageCode: ContentLocale;
  translationStatus: TranslationStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  h1: string | null;
  sections: Record<string, unknown>;
};

export async function listContentPages(context: AdminContext): Promise<AdminContentPage[]> {
  assertCanManageContent(context);
  const client = getSupabaseRequestClient(context.accessToken);
  const { data, error } = await client.from('content_pages').select(`
    id, page_key, page_type, status, updated_at,
    content_page_translations (language_code, translation_status, seo_title, seo_description, h1, sections, updated_at)
  `).order('page_key');
  if (error) throw new ApiError('server_error', 500, 'Content pages could not be loaded.');
  return (data ?? []) as unknown as AdminContentPage[];
}

export async function updateContentPageTranslation(
  context: AdminContext,
  pageId: string,
  input: ContentTranslationUpdate,
): Promise<AdminContentPage> {
  assertCanManageContent(context);
  const client = getSupabaseRequestClient(context.accessToken);
  const pageUpdate = await client.from('content_pages').update({ status: input.pageStatus }).eq('id', pageId).select('id').maybeSingle();
  if (pageUpdate.error) throw new ApiError('server_error', 500, 'Page status could not be updated.');
  if (!pageUpdate.data) throw new ApiError('not_found', 404, 'Content page not found.');

  const translationUpdate = await client.from('content_page_translations').upsert({
    page_id: pageId,
    language_code: input.languageCode,
    translation_status: input.translationStatus,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    h1: input.h1,
    sections: input.sections,
  }, { onConflict: 'page_id,language_code' });
  if (translationUpdate.error) throw new ApiError('bad_request', 400, 'Translation could not be saved. Check required published fields.');

  const pages = await listContentPages(context);
  const page = pages.find((item) => item.id === pageId);
  if (!page) throw new ApiError('not_found', 404, 'Content page not found.');
  return page;
}
