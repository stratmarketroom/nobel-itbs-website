import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { ContentLocale, TranslationStatus } from './localization';
import { selectPublishedTranslation } from './localization';
import { contentDataSource, requireSupabaseContent } from './data-source';

export type ContentPageKey = 'home' | 'about' | 'partnerships' | 'for_organisations' | 'privacy_policy' | 'terms_of_use' | 'refund_policy';

export type StructuredContentPage = {
  pageKey: ContentPageKey;
  pageType: string;
  renderedLocale: ContentLocale;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  sections: Record<string, unknown>;
};

type DbTranslation = {
  language_code: ContentLocale;
  translation_status: TranslationStatus;
  seo_title: string | null;
  seo_description: string | null;
  h1: string | null;
  sections: Record<string, unknown>;
};

type DbPage = {
  page_key: ContentPageKey;
  page_type: string;
  content_page_translations: DbTranslation[];
};

async function loadPage(pageKey: ContentPageKey): Promise<DbPage | null | undefined> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return undefined;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data, error } = await client.from('content_pages').select(`
      page_key, page_type,
      content_page_translations (language_code, translation_status, seo_title, seo_description, h1, sections)
    `).eq('page_key', pageKey).eq('status', 'published').maybeSingle();
    if (error) return undefined;
    return data as unknown as DbPage | null;
  } catch {
    return undefined;
  }
}

export async function getStructuredContentPage(pageKey: ContentPageKey, locale: ContentLocale): Promise<StructuredContentPage | null> {
  if (contentDataSource() === 'seed') return null;
  const page = requireSupabaseContent(await loadPage(pageKey), `Content page ${pageKey}`);
  if (!page) return null;
  const translation = selectPublishedTranslation(page.content_page_translations.map((item) => ({
    ...item,
    languageCode: item.language_code,
    translationStatus: item.translation_status,
  })), locale);
  if (!translation?.seo_title || !translation.seo_description || !translation.h1) return null;
  return {
    pageKey,
    pageType: page.page_type,
    renderedLocale: translation.languageCode,
    seoTitle: translation.seo_title,
    seoDescription: translation.seo_description,
    h1: translation.h1,
    sections: translation.sections,
  };
}
