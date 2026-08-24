import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { ContentLocale } from '@/lib/content/localization';
import { contentDataSource, requireSupabaseContent } from '@/lib/content/data-source';

export type SitemapPublicationEntity = {
  path: string;
  publishedLocales: ContentLocale[];
};

type DbTranslation = {
  language_code: string;
  translation_status: string;
};

type DbContentPage = {
  page_key: string;
  content_page_translations: DbTranslation[];
};

type DbProgrammeEntity = {
  slug: string;
  translations: DbTranslation[];
};

const indexableContentPaths: Record<string, string> = {
  home: '/',
  for_organisations: '/for-organisations',
  partnerships: '/partnerships',
  about: '/about',
};

const releaseProgrammeSlugs = [
  'ai-production',
  'general-psychology',
  'child-psychology',
  'neuroplastic-reconstruction',
  'space-business',
];

const releaseAreaSlugs = ['business-management', 'technology-innovation', 'psychology-human'];
const releaseTypeSlugs = ['certificate-programme', 'mini-mba', 'professional-development-course'];
const allLocales: ContentLocale[] = ['en', 'ua', 'cz'];

function publishedLocales(translations: DbTranslation[]): ContentLocale[] {
  return allLocales.filter((locale) => translations.some((translation) => (
    translation.language_code === locale && translation.translation_status === 'published'
  )));
}

function approvedSeedPublication(): SitemapPublicationEntity[] {
  return [
    { path: '/programmes', publishedLocales: allLocales },
    { path: '/verify', publishedLocales: allLocales },
    ...Object.values(indexableContentPaths).map((path) => ({ path, publishedLocales: allLocales })),
    ...[...releaseAreaSlugs, ...releaseTypeSlugs, ...releaseProgrammeSlugs]
      .map((slug) => ({ path: `/programmes/${slug}`, publishedLocales: allLocales })),
  ];
}

function programmeEntities(
  rows: Array<{ slug: string; [translationKey: string]: unknown }>,
  translationKey: string,
): DbProgrammeEntity[] {
  return rows.map((row) => ({
    slug: row.slug,
    translations: Array.isArray(row[translationKey]) ? row[translationKey] as DbTranslation[] : [],
  }));
}

async function loadSupabasePublication(): Promise<SitemapPublicationEntity[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
  });

  try {
    const results = await Promise.all([
      client.from('content_pages')
        .select('page_key, content_page_translations (language_code, translation_status)')
        .eq('status', 'published')
        .in('page_key', Object.keys(indexableContentPaths)),
      client.from('programme_areas')
        .select('slug, programme_area_translations (language_code, translation_status)')
        .eq('status', 'published'),
      client.from('programme_types')
        .select('slug, programme_type_translations (language_code, translation_status)')
        .eq('status', 'published'),
      client.from('programmes')
        .select('slug, programme_translations (language_code, translation_status)')
        .eq('publication_status', 'published'),
    ]);

    if (results.some((result) => result.error || !result.data)) return null;

    const contentPages = results[0].data as unknown as DbContentPage[];
    const areas = programmeEntities(results[1].data as unknown as Array<{ slug: string; [key: string]: unknown }>, 'programme_area_translations');
    const types = programmeEntities(results[2].data as unknown as Array<{ slug: string; [key: string]: unknown }>, 'programme_type_translations');
    const programmes = programmeEntities(results[3].data as unknown as Array<{ slug: string; [key: string]: unknown }>, 'programme_translations');

    return [
      { path: '/programmes', publishedLocales: allLocales },
      { path: '/verify', publishedLocales: allLocales },
      ...contentPages.map((page) => ({
        path: indexableContentPaths[page.page_key],
        publishedLocales: publishedLocales(page.content_page_translations),
      })),
      ...[...areas, ...types, ...programmes].map((entity) => ({
        path: `/programmes/${entity.slug}`,
        publishedLocales: publishedLocales(entity.translations),
      })),
    ].filter((entity) => entity.path && entity.publishedLocales.length > 0);
  } catch {
    return null;
  }
}

export async function getSitemapPublication(): Promise<SitemapPublicationEntity[]> {
  const publication = contentDataSource() === 'seed'
    ? approvedSeedPublication()
    : requireSupabaseContent(await loadSupabasePublication(), 'SEO sitemap publication state');

  return publication.sort((a, b) => a.path.localeCompare(b.path));
}
