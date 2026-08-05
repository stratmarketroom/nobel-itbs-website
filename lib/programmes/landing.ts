import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';
import type { ContentLocale, TranslationStatus } from '@/lib/content/localization';
import { selectPublishedTranslation } from '@/lib/content/localization';
import { getProgrammeCatalogue } from './catalogue';
import { getSeedProgrammeNamespaceEntity } from './landing-seed';
import type { ProgrammeCatalogueItem } from './catalogue-types';
import type { ProgrammeLandingEntity, ProgrammeNamespaceEntity, ProgrammePricingOption, ProgrammeSection, TaxonomyLandingEntity } from './landing-types';

type DbTranslationBase = {
  language_code: ContentLocale;
  translation_status: TranslationStatus;
};

type DbProgrammeTranslation = DbTranslationBase & {
  title: string | null;
  summary: string | null;
  hero_copy: string | null;
  sections: Record<string, ProgrammeSection | string>;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
};

type DbPricingTranslation = DbTranslationBase & {
  title: string | null;
  description: string | null;
  cta_label: string | null;
};

type DbPricingOption = {
  id: string;
  price: number | null;
  currency_code: string | null;
  application_url: string | null;
  sort_order: number;
  programme_pricing_option_translations: DbPricingTranslation[];
};

type DbRun = {
  status: 'upcoming' | 'open' | 'ongoing' | 'closed';
  starts_at: string | null;
  ends_at: string | null;
  application_url: string | null;
};

type DbProgramme = {
  slug: string;
  format: 'distance' | 'blended_distance';
  application_url: string | null;
  instruction_language_codes: string[];
  programme_translations: DbProgrammeTranslation[];
  programme_runs: DbRun[];
  programme_pricing_options: DbPricingOption[];
};

type DbTaxonomyTranslation = DbTranslationBase & {
  title: string | null;
  landing_title?: string | null;
  short_description: string | null;
  intro_content: string | null;
  sections: Record<string, unknown>;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
};

type DbTaxonomy = {
  slug: string;
  programme_area_translations?: DbTaxonomyTranslation[];
  programme_type_translations?: DbTaxonomyTranslation[];
};

type QueryResult = {
  programme: DbProgramme | null;
  area: DbTaxonomy | null;
  type: DbTaxonomy | null;
};

function localized<T extends DbTranslationBase>(translations: T[], locale: ContentLocale): (T & { languageCode: ContentLocale; translationStatus: TranslationStatus }) | null {
  return selectPublishedTranslation(
    translations.map((translation) => ({
      ...translation,
      languageCode: translation.language_code,
      translationStatus: translation.translation_status,
    })),
    locale,
  );
}

function currentRun(runs: DbRun[]): DbRun | null {
  const today = new Date().toISOString().slice(0, 10);
  const active = runs.filter((run) => run.status !== 'closed' && (run.ends_at === null || run.ends_at >= today));
  for (const status of ['open', 'ongoing', 'upcoming'] as const) {
    const run = active.find((item) => item.status === status);
    if (run) return run;
  }
  return null;
}

function projectPricing(options: DbPricingOption[], locale: ContentLocale): ProgrammePricingOption[] {
  return [...options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((option) => {
      const translation = localized(option.programme_pricing_option_translations, locale);
      if (!translation?.title || !translation.description || !translation.cta_label) return [];
      return [{
        id: option.id,
        title: translation.title,
        description: translation.description,
        ctaLabel: translation.cta_label,
        price: option.price,
        currencyCode: option.currency_code,
        applicationUrl: option.application_url,
      }];
    });
}

function projectProgramme(row: DbProgramme, locale: ContentLocale, catalogue: ProgrammeCatalogueItem[]): ProgrammeLandingEntity | null {
  const translation = localized(row.programme_translations, locale);
  const card = catalogue.find((item) => item.slug === row.slug);
  if (!translation?.title || !translation.summary || !translation.hero_copy || !translation.seo_title || !translation.seo_description || !translation.og_title || !translation.og_description || !card) return null;

  const { eyebrow, primary_cta_label: primaryCtaLabel, ...sections } = translation.sections;
  const run = currentRun(row.programme_runs);
  return {
    kind: 'programme',
    slug: row.slug,
    renderedLocale: translation.languageCode,
    title: translation.title,
    summary: translation.summary,
    heroCopy: translation.hero_copy,
    eyebrow: typeof eyebrow === 'string' ? eyebrow : `${card.type.title} | ${card.area.title}`,
    primaryCtaLabel: typeof primaryCtaLabel === 'string' ? primaryCtaLabel : '',
    primaryCtaUrl: run?.application_url ?? row.application_url,
    area: card.area,
    type: card.type,
    format: row.format,
    instructionLanguageCodes: row.instruction_language_codes,
    enrolmentBadge: card.enrolmentBadge,
    currentRunStartsAt: run?.starts_at ?? card.currentRunStartsAt,
    sections: sections as Record<string, ProgrammeSection>,
    pricingOptions: projectPricing(row.programme_pricing_options, locale),
    seo: {
      title: translation.seo_title,
      description: translation.seo_description,
      ogTitle: translation.og_title,
      ogDescription: translation.og_description,
    },
  };
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stringItems(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function projectTaxonomy(row: DbTaxonomy, kind: 'area' | 'type', locale: ContentLocale, catalogue: ProgrammeCatalogueItem[]): TaxonomyLandingEntity | null {
  const rows = kind === 'area' ? row.programme_area_translations : row.programme_type_translations;
  const translation = localized(rows ?? [], locale);
  if (!translation?.title || !translation.short_description || !translation.intro_content || !translation.seo_title || !translation.seo_description || !translation.og_title || !translation.og_description) return null;

  const sections = object(translation.sections);
  const about = object(sections.about);
  const audience = object(sections.audience);
  const outcomes = object(kind === 'area' ? sections.outcomes : sections.comparison);
  const listing = object(sections.listing);
  const closing = object(sections.closing_cta);

  return {
    kind,
    slug: row.slug,
    renderedLocale: translation.languageCode,
    title: kind === 'type' ? (translation.landing_title ?? translation.title) : translation.title,
    eyebrow: stringValue(sections.eyebrow) || (kind === 'area' ? 'Programme Area' : 'Programme Type'),
    lead: translation.short_description,
    supportingCopy: stringValue(sections.supporting_copy),
    primaryCtaLabel: stringValue(sections.primary_cta_label),
    sections: {
      introHeading: stringValue(about.heading) || translation.title,
      introContent: stringValue(about.content) || translation.intro_content,
      audienceHeading: stringValue(audience.heading),
      audienceItems: stringItems(audience.items),
      outcomesHeading: stringValue(outcomes.heading),
      outcomesItems: stringItems(outcomes.items),
      listingHeading: stringValue(listing.heading),
      listingIntro: stringValue(listing.intro),
      emptyHeading: stringValue(listing.empty_heading),
      emptyBody: stringValue(listing.empty_body),
      closingHeading: stringValue(closing.heading),
      closingCopy: stringValue(closing.copy),
      closingLabel: stringValue(closing.label),
    },
    programmes: catalogue.filter((programme) => kind === 'area' ? programme.area.slug === row.slug : programme.type.slug === row.slug),
    seo: {
      title: translation.seo_title,
      description: translation.seo_description,
      ogTitle: translation.og_title,
      ogDescription: translation.og_description,
    },
  };
}

async function loadNamespaceRows(slug: string): Promise<QueryResult | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(1800) }) },
  });

  const programmeQuery = client.from('programmes').select(`
    slug, format, application_url, instruction_language_codes,
    programme_translations (language_code, translation_status, title, summary, hero_copy, sections, seo_title, seo_description, og_title, og_description),
    programme_runs (status, starts_at, ends_at, application_url),
    programme_pricing_options (id, price, currency_code, application_url, sort_order, programme_pricing_option_translations (language_code, translation_status, title, description, cta_label))
  `).eq('slug', slug).maybeSingle();
  const areaQuery = client.from('programme_areas').select(`
    slug, programme_area_translations (language_code, translation_status, title, short_description, intro_content, sections, seo_title, seo_description, og_title, og_description)
  `).eq('slug', slug).maybeSingle();
  const typeQuery = client.from('programme_types').select(`
    slug, programme_type_translations (language_code, translation_status, title, landing_title, short_description, intro_content, sections, seo_title, seo_description, og_title, og_description)
  `).eq('slug', slug).maybeSingle();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Promise.all([programmeQuery, areaQuery, typeQuery]),
      new Promise<null>((resolve) => { timeoutId = setTimeout(() => resolve(null), 2000); }),
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    if (!result || result.some((entry) => entry.error)) return null;
    return {
      programme: result[0].data as unknown as DbProgramme | null,
      area: result[1].data as unknown as DbTaxonomy | null,
      type: result[2].data as unknown as DbTaxonomy | null,
    };
  } catch {
    if (timeoutId) clearTimeout(timeoutId);
    return null;
  }
}

export const getProgrammeNamespaceEntity = cache(async (slug: string, locale: ContentLocale): Promise<ProgrammeNamespaceEntity | null> => {
  const [catalogue, rows] = await Promise.all([
    getProgrammeCatalogue(locale),
    loadNamespaceRows(slug),
  ]);

  if (rows?.programme) return projectProgramme(rows.programme, locale, catalogue.items);
  if (rows?.area) return projectTaxonomy(rows.area, 'area', locale, catalogue.items);
  if (rows?.type) return projectTaxonomy(rows.type, 'type', locale, catalogue.items);
  return getSeedProgrammeNamespaceEntity(slug, locale, catalogue.items);
});
