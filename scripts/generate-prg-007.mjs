import { readFileSync, writeFileSync } from 'node:fs';

const locales = [
  ['en', 'EN'],
  ['ua', 'UA'],
  ['cz', 'CZ'],
];

const entities = [
  { kind: 'area', id: '00000000-0000-4000-8000-000000000101', slug: 'business-management', source: 'BUSINESS_MANAGEMENT_AREA', sortOrder: 10 },
  { kind: 'area', id: '00000000-0000-4000-8000-000000000102', slug: 'technology-innovation', source: 'TECHNOLOGY_INNOVATION_AREA', sortOrder: 20 },
  { kind: 'area', id: '00000000-0000-4000-8000-000000000103', slug: 'psychology-human', source: 'PSYCHOLOGY_HUMAN_AREA', sortOrder: 30 },
  { kind: 'type', id: '00000000-0000-4000-8000-000000000201', slug: 'certificate-programme', source: 'CERTIFICATE_PROGRAMME_TYPE', sortOrder: 10 },
  { kind: 'type', id: '00000000-0000-4000-8000-000000000202', slug: 'mini-mba', source: 'MINI_MBA_TYPE', sortOrder: 20 },
  { kind: 'type', id: '00000000-0000-4000-8000-000000000203', slug: 'professional-development-course', source: 'PROFESSIONAL_DEVELOPMENT_COURSE_TYPE', sortOrder: 30 },
];

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

function splitSections(markdown) {
  const matches = [...markdown.matchAll(/^## (?:\d+\.\s*)?(.+)$/gm)];
  const sections = [];
  for (const [index, match] of matches.entries()) {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    sections.push({ heading: match[1].trim(), content: markdown.slice(start, end).trim() });
  }
  return sections;
}

function fields(content) {
  const result = {};
  for (const match of content.matchAll(/^`([a-z0-9_]+)`:\s*([\s\S]*?)(?=\n`[a-z0-9_]+`:\s*|\n\n|$)/gm)) {
    result[match[1]] = match[2].replace(/\s*\n\s*/g, ' ').trim();
  }
  return result;
}

function listItems(content) {
  const items = [];
  let current = '';
  for (const line of content.split('\n')) {
    if (/^-\s+/.test(line)) {
      if (current) items.push(current);
      current = line.replace(/^-\s+/, '').replace(/;$/, '').trim();
    } else if (current && line.trim() && !line.startsWith('`')) {
      current += ` ${line.trim()}`;
    }
  }
  if (current) items.push(current);
  return items;
}

function contentWithoutFields(content) {
  return content
    .replace(/^`[a-z0-9_]+`:\s*[\s\S]*?(?=\n`[a-z0-9_]+`:\s*|\n\n|$)/gm, '')
    .trim();
}

function parseTranslation(entity, languageCode, sourceLocale) {
  const markdown = readFileSync(`docs/preparation/pages/${entity.source}_${sourceLocale}_MASTER_COPY.md`, 'utf8');
  const sections = splitSections(markdown);
  const byHeading = (pattern) => sections.find((section) => pattern.test(section.heading));
  const seo = fields(byHeading(/^SEO$/)?.content ?? '');
  const hero = fields(byHeading(/^Hero$/)?.content ?? '');
  const intro = sections[3];
  const audience = sections[4];
  const outcomes = sections[5];
  const listing = sections[6];
  const closing = sections[7];
  const listingFields = fields(listing?.content ?? '');
  const closingFields = fields(closing?.content ?? '');

  const translation = {
    languageCode,
    title: hero.h1 ?? hero.type_label,
    eyebrow: hero.eyebrow,
    lead: hero.lead,
    supportingCopy: hero.supporting_copy ?? '',
    primaryCtaLabel: hero.primary_cta,
    introHeading: intro?.heading ?? '',
    introContent: contentWithoutFields(intro?.content ?? ''),
    audienceHeading: audience?.heading ?? '',
    audienceItems: listItems(audience?.content ?? ''),
    outcomesHeading: outcomes?.heading ?? '',
    outcomesItems: listItems(outcomes?.content ?? ''),
    listingHeading: listingFields.section_title ?? listingFields.heading ?? listing?.heading ?? '',
    listingIntro: listingFields.section_intro ?? listingFields.intro ?? '',
    emptyHeading: listingFields.empty_state_heading ?? listingFields.empty_state ?? '',
    emptyBody: listingFields.empty_state_body ?? '',
    closingHeading: closingFields.heading ?? '',
    closingCopy: closingFields.copy ?? '',
    closingLabel: closingFields.cta ?? closingFields.label ?? hero.primary_cta,
    seoTitle: seo.seo_title,
    seoDescription: seo.seo_description,
    ogTitle: seo.og_title,
    ogDescription: seo.og_description,
  };

  for (const key of ['title', 'eyebrow', 'lead', 'primaryCtaLabel', 'introHeading', 'introContent', 'audienceHeading', 'outcomesHeading', 'listingHeading', 'closingHeading', 'seoTitle', 'seoDescription', 'ogTitle', 'ogDescription']) {
    if (!translation[key]) throw new Error(`${entity.slug}/${languageCode} missing ${key}`);
  }
  if (translation.audienceItems.length === 0 || translation.outcomesItems.length === 0) {
    throw new Error(`${entity.slug}/${languageCode} missing structured lists`);
  }

  return translation;
}

const generated = {
  entities: entities.map((entity) => ({
    kind: entity.kind,
    id: entity.id,
    slug: entity.slug,
    sortOrder: entity.sortOrder,
    translations: locales.map(([languageCode, sourceLocale]) => parseTranslation(entity, languageCode, sourceLocale)),
  })),
};

const areaRows = generated.entities
  .filter((entity) => entity.kind === 'area')
  .flatMap((entity) => entity.translations.map((translation) => {
    const structuredSections = {
      eyebrow: translation.eyebrow,
      supporting_copy: translation.supportingCopy,
      primary_cta_label: translation.primaryCtaLabel,
      about: { heading: translation.introHeading, content: translation.introContent },
      audience: { heading: translation.audienceHeading, items: translation.audienceItems },
      outcomes: { heading: translation.outcomesHeading, items: translation.outcomesItems },
      listing: {
        heading: translation.listingHeading,
        intro: translation.listingIntro,
        empty_heading: translation.emptyHeading,
        empty_body: translation.emptyBody,
      },
      closing_cta: {
        heading: translation.closingHeading,
        copy: translation.closingCopy,
        label: translation.closingLabel,
      },
    };
    return `  (${sqlString(entity.id)}, ${sqlString(translation.languageCode)}, 'published', ${sqlString(translation.title)}, ${sqlString(translation.lead)}, ${sqlString(translation.introContent)}, $json$${JSON.stringify(structuredSections)}$json$::jsonb, ${sqlString(translation.seoTitle)}, ${sqlString(translation.seoDescription)}, ${sqlString(translation.ogTitle)}, ${sqlString(translation.ogDescription)})`;
  }))
  .join(',\n');

const migration = `-- PRG-007: SEO Landing Pages and Shared Programme Slug Namespace
-- Area landing sections, complete EN/UA/CZ publication data, and cross-entity slug collision prevention.

alter table public.programme_area_translations
  add column sections jsonb not null default '{}'::jsonb,
  add column og_title text null,
  add column og_description text null,
  add constraint programme_area_translations_sections_object check (jsonb_typeof(sections) = 'object');

insert into public.programme_area_translations (
  area_id, language_code, translation_status, title, short_description,
  intro_content, sections, seo_title, seo_description, og_title, og_description
)
values
${areaRows}
on conflict (area_id, language_code) do update
set
  translation_status = excluded.translation_status,
  title = excluded.title,
  short_description = excluded.short_description,
  intro_content = excluded.intro_content,
  sections = excluded.sections,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_title = excluded.og_title,
  og_description = excluded.og_description;

alter table public.programme_area_translations
  add constraint programme_area_translations_published_landing_complete check (
    translation_status <> 'published'
    or (
      sections ?& array['eyebrow', 'primary_cta_label', 'about', 'audience', 'outcomes', 'listing', 'closing_cta']
      and og_title is not null and btrim(og_title) <> ''
      and og_description is not null and btrim(og_description) <> ''
    )
  );

create or replace function internal.assert_programme_slug_available(
  p_slug text,
  p_entity_type text,
  p_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.programmes where slug = p_slug and (p_entity_type <> 'programme' or id <> p_entity_id)
    union all
    select 1 from public.programme_areas where slug = p_slug and (p_entity_type <> 'area' or id <> p_entity_id)
    union all
    select 1 from public.programme_types where slug = p_slug and (p_entity_type <> 'type' or id <> p_entity_id)
  ) then
    raise unique_violation using
      constraint = 'programme_shared_slug_unique',
      message = format('Programme namespace slug "%s" is already used.', p_slug);
  end if;
end;
$$;

comment on function internal.assert_programme_slug_available(text, text, uuid) is
  'Rejects slug collisions across programmes, programme areas, and programme types.';

revoke all on function internal.assert_programme_slug_available(text, text, uuid) from public;
grant execute on function internal.assert_programme_slug_available(text, text, uuid) to postgres, service_role;

create or replace function internal.enforce_programme_shared_slug()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entity_type text;
begin
  entity_type := case tg_table_name
    when 'programmes' then 'programme'
    when 'programme_areas' then 'area'
    when 'programme_types' then 'type'
    else null
  end;
  if entity_type is null then
    raise exception 'Unsupported programme namespace table: %', tg_table_name;
  end if;
  perform internal.assert_programme_slug_available(new.slug, entity_type, new.id);
  return new;
end;
$$;

revoke all on function internal.enforce_programme_shared_slug() from public;
grant execute on function internal.enforce_programme_shared_slug() to postgres, service_role;

create trigger programmes_enforce_shared_slug
before insert or update of slug on public.programmes
for each row execute function internal.enforce_programme_shared_slug();

create trigger programme_areas_enforce_shared_slug
before insert or update of slug on public.programme_areas
for each row execute function internal.enforce_programme_shared_slug();

create trigger programme_types_enforce_shared_slug
before insert or update of slug on public.programme_types
for each row execute function internal.enforce_programme_shared_slug();
`;

writeFileSync('lib/programmes/generated-taxonomy-content.json', `${JSON.stringify(generated, null, 2)}\n`);
writeFileSync('supabase/migrations/20260804150000_prg_007_seo_landing_pages.sql', migration);

console.log(`Generated PRG-007 migration and fallback content for ${entities.length} landing pages.`);
