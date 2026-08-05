import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { ContentLocale, TranslationStatus } from '@/lib/content/localization';
import { selectPublishedTranslation } from '@/lib/content/localization';
import { getSeedProgrammeCatalogue } from './catalogue-seed';
import type { EnrolmentBadge, ProgrammeCatalogueItem, ProgrammeCatalogueResponse } from './catalogue-types';

type DbTranslation = {
  language_code: ContentLocale;
  translation_status: TranslationStatus;
  title: string | null;
  catalogue_description: string | null;
  catalogue_facts: string | null;
  catalogue_document_summary: string | null;
};

type DbTaxonomyTranslation = {
  language_code: ContentLocale;
  translation_status: TranslationStatus;
  title: string | null;
};

type DbTaxonomy = {
  slug: string;
  programme_area_translations?: DbTaxonomyTranslation[];
  programme_type_translations?: DbTaxonomyTranslation[];
};

type DbProgrammeRun = {
  status: 'upcoming' | 'open' | 'ongoing' | 'closed';
  starts_at: string | null;
  ends_at: string | null;
};

type DbProgramme = {
  slug: string;
  format: 'distance' | 'blended_distance';
  featured: boolean;
  enrolment_badge_override: EnrolmentBadge | null;
  instruction_language_codes: string[];
  programme_translations: DbTranslation[];
  programme_areas: DbTaxonomy | DbTaxonomy[] | null;
  programme_types: DbTaxonomy | DbTaxonomy[] | null;
  programme_runs: DbProgrammeRun[];
};

function toOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function isRunCurrent(run: DbProgrammeRun, today: string): boolean {
  return run.ends_at === null || run.ends_at >= today;
}

function selectCurrentRun(runs: DbProgrammeRun[], today: string): DbProgrammeRun | null {
  const currentRuns = runs.filter((run) => isRunCurrent(run, today));
  const priority: DbProgrammeRun['status'][] = ['open', 'ongoing', 'upcoming'];

  for (const status of priority) {
    const match = currentRuns.find((run) => run.status === status);
    if (match) return match;
  }

  return null;
}

function badgeFor(programme: DbProgramme, run: DbProgrammeRun | null): EnrolmentBadge {
  if (programme.enrolment_badge_override) return programme.enrolment_badge_override;
  if (run?.status === 'open') return 'open';
  if (run?.status === 'ongoing') return 'ongoing';
  if (run?.status === 'upcoming') return 'coming_soon';
  return 'inactive';
}

function translateTaxonomy(taxonomy: DbTaxonomy, locale: ContentLocale, key: 'programme_area_translations' | 'programme_type_translations'): string | null {
  const translation = selectPublishedTranslation(
    (taxonomy[key] ?? []).map((item) => ({
      ...item,
      languageCode: item.language_code,
      translationStatus: item.translation_status,
    })),
    locale,
  );

  return translation?.title ?? null;
}

function projectProgramme(programme: DbProgramme, locale: ContentLocale, today: string): ProgrammeCatalogueItem | null {
  const translation = selectPublishedTranslation(
    programme.programme_translations.map((item) => ({
      ...item,
      languageCode: item.language_code,
      translationStatus: item.translation_status,
    })),
    locale,
  );
  const area = toOne(programme.programme_areas);
  const type = toOne(programme.programme_types);
  const run = selectCurrentRun(programme.programme_runs, today);

  if (!translation?.title || !translation.catalogue_description || !translation.catalogue_facts || !translation.catalogue_document_summary || !area || !type) {
    return null;
  }

  const areaTitle = translateTaxonomy(area, locale, 'programme_area_translations');
  const typeTitle = translateTaxonomy(type, locale, 'programme_type_translations');
  if (!areaTitle || !typeTitle) return null;

  return {
    slug: programme.slug,
    title: translation.title,
    description: translation.catalogue_description,
    facts: translation.catalogue_facts,
    documentSummary: translation.catalogue_document_summary,
    area: { slug: area.slug, title: areaTitle },
    type: { slug: type.slug, title: typeTitle },
    format: programme.format,
    instructionLanguageCodes: programme.instruction_language_codes,
    enrolmentBadge: badgeFor(programme, run),
    currentRunStartsAt: run?.starts_at ?? null,
    featured: programme.featured,
  };
}

async function loadFromSupabase(locale: ContentLocale): Promise<ProgrammeCatalogueItem[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(1500) }),
    },
  });
  try {
    const query = client
      .from('programmes')
      .select(`
      slug,
      format,
      featured,
      enrolment_badge_override,
      instruction_language_codes,
      programme_translations (
        language_code,
        translation_status,
        title,
        catalogue_description,
        catalogue_facts,
        catalogue_document_summary
      ),
      programme_areas (
        slug,
        programme_area_translations (language_code, translation_status, title)
      ),
      programme_types (
        slug,
        programme_type_translations (language_code, translation_status, title)
      ),
      programme_runs (status, starts_at, ends_at)
      `)
      .eq('publication_status', 'published')
      .order('catalogue_sort_order', { ascending: true });
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      query,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), 2000);
      }),
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    if (!result) return null;

    const { data, error } = result;

    if (error || !data) return null;

    const today = new Date().toISOString().slice(0, 10);
    return (data as unknown as DbProgramme[])
      .map((programme) => projectProgramme(programme, locale, today))
      .filter((programme): programme is ProgrammeCatalogueItem => programme !== null);
  } catch {
    return null;
  }
}

export async function getProgrammeCatalogue(locale: ContentLocale): Promise<ProgrammeCatalogueResponse> {
  const databaseItems = await loadFromSupabase(locale);

  return {
    locale,
    items: databaseItems ?? getSeedProgrammeCatalogue(locale),
  };
}
