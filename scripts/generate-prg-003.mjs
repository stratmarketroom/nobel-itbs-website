import { readFileSync, writeFileSync } from 'node:fs';

const programmes = [
  {
    id: '00000000-0000-4000-8000-000000000301',
    slug: 'ai-production',
    areaId: '00000000-0000-4000-8000-000000000101',
    typeId: '00000000-0000-4000-8000-000000000202',
    format: 'blended_distance',
    applicationProvider: 'partner_site',
    applicationUrl: null,
    source: 'AI_PRODUCTION',
  },
  {
    id: '00000000-0000-4000-8000-000000000302',
    slug: 'general-psychology',
    areaId: '00000000-0000-4000-8000-000000000103',
    typeId: '00000000-0000-4000-8000-000000000203',
    format: 'distance',
    applicationProvider: 'leeloo',
    applicationUrl: null,
    source: 'GENERAL_PSYCHOLOGY',
  },
  {
    id: '00000000-0000-4000-8000-000000000303',
    slug: 'child-psychology',
    areaId: '00000000-0000-4000-8000-000000000103',
    typeId: '00000000-0000-4000-8000-000000000203',
    format: 'distance',
    applicationProvider: 'leeloo',
    applicationUrl: null,
    source: 'CHILD_PSYCHOLOGY',
  },
  {
    id: '00000000-0000-4000-8000-000000000304',
    slug: 'neuroplastic-reconstruction',
    areaId: '00000000-0000-4000-8000-000000000103',
    typeId: '00000000-0000-4000-8000-000000000203',
    format: 'blended_distance',
    applicationProvider: 'partner_site',
    applicationUrl: 'https://school.kholodenko.net/',
    source: 'NEUROPLASTIC_RECONSTRUCTION',
  },
  {
    id: '00000000-0000-4000-8000-000000000305',
    slug: 'space-business',
    areaId: '00000000-0000-4000-8000-000000000102',
    typeId: '00000000-0000-4000-8000-000000000201',
    format: 'distance',
    applicationProvider: 'leeloo',
    applicationUrl: null,
    source: 'SPACE_BUSINESS',
  },
];

const localeSources = [
  ['en', 'EN'],
  ['ua', 'UA'],
  ['cz', 'CZ'],
];

const sectionKey = new Map([
  ['Programme Facts', 'facts'],
  ['Value Section', 'value'],
  ['Audience', 'audience'],
  ['Outcomes', 'outcomes'],
  ['Curriculum', 'curriculum'],
  ['Learning Experience', 'learning_experience'],
  ['Languages', 'languages'],
  ['Expert', 'expert'],
  ['Experts', 'expert'],
  ['Lecturer', 'expert'],
  ['Final Project', 'final_project'],
  ['Documents', 'assessment_document'],
  ['Assessment And Document', 'assessment_document'],
  ['Academic Context', 'academic_context'],
  ['Official Context', 'official_context'],
  ['Partnership Model', 'partnership_model'],
  ['Professional Boundary', 'professional_boundary'],
  ['FAQ', 'faq'],
  ['Closing CTA', 'closing_cta'],
]);

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;
const sqlNullableString = (value) => (value === null ? 'null' : sqlString(value));

function splitSections(markdown) {
  const matches = [...markdown.matchAll(/^## (.+)$/gm)];
  const result = new Map();
  for (const [index, match] of matches.entries()) {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    result.set(match[1].trim(), markdown.slice(start, end).trim());
  }
  return result;
}

function parseFields(content) {
  const fields = {};
  const body = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^`([a-z0-9_]+)`:\s*(.*)$/);
    if (!match) {
      body.push(line);
      continue;
    }
    const [, key, value] = match;
    if (!key.startsWith('internal_note_')) {
      fields[key] = value.trim();
    }
  }
  return { fields, body: body.join('\n').trim() };
}

function parseFaq(content) {
  const matches = [...content.matchAll(/^### (.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? content.length;
    return {
      question: match[1].trim(),
      answer: content.slice(start, end).trim(),
    };
  });
}

function parseBlock(key, content) {
  if (key === 'faq') {
    return { items: parseFaq(content) };
  }

  const { fields, body } = parseFields(content);
  const heading = fields.heading ?? null;
  delete fields.heading;

  const block = {};
  if (heading) block.heading = heading;
  if (Object.keys(fields).length > 0) block.fields = fields;
  if (body) block.content = body;
  return block;
}

function ownerApprovedOverrides(slug, languageCode, sections) {
  if (slug === 'neuroplastic-reconstruction') {
    const cohort = {
      en: { heading: 'Current cohort', fields: { start_date: '5 October 2026' } },
      ua: { heading: 'Поточний набір', fields: { start_date: '5 жовтня 2026 року' } },
      cz: { heading: 'Aktuální běh', fields: { start_date: '5. října 2026' } },
    };
    sections.current_cohort = cohort[languageCode];
  }

  if (slug === 'space-business') {
    const documentBlock = {
      en: {
        heading: 'Certificate upon completion',
        fields: { issuer: 'University of Alfred Nobel', hours_on_certificate: false },
        content: 'After meeting the programme requirements, the learner receives a certificate issued by the University of Alfred Nobel. The programme volume is 90 hours; the hours are not stated on the certificate.',
      },
      ua: {
        heading: 'Сертифікат після завершення',
        fields: { issuer: 'Університет імені Альфреда Нобеля', hours_on_certificate: false },
        content: 'Після виконання умов програми слухач отримує сертифікат Університету імені Альфреда Нобеля. Обсяг програми становить 90 годин; години на сертифікаті не зазначаються.',
      },
      cz: {
        heading: 'Certifikát po dokončení',
        fields: { issuer: 'Univerzita Alfreda Nobela', hours_on_certificate: false },
        content: 'Po splnění podmínek programu získá účastník certifikát Univerzity Alfreda Nobela. Rozsah programu činí 90 hodin; počet hodin se na certifikátu neuvádí.',
      },
    };
    sections.assessment_document = documentBlock[languageCode];
  }
}

function readTranslation(programme, languageCode, sourceLocale) {
  const path = `docs/preparation/programmes/${programme.source}_${sourceLocale}_MASTER_COPY.md`;
  const markdown = readFileSync(path, 'utf8');
  const sourceSections = splitSections(markdown);
  const seo = parseFields(sourceSections.get('SEO') ?? '').fields;
  const hero = parseFields(sourceSections.get('Hero') ?? '').fields;
  const sections = {
    eyebrow: hero.eyebrow,
    primary_cta_label: hero.primary_cta,
  };

  for (const [sourceHeading, key] of sectionKey) {
    const content = sourceSections.get(sourceHeading);
    if (content) sections[key] = parseBlock(key, content);
  }

  ownerApprovedOverrides(programme.slug, languageCode, sections);

  return {
    languageCode,
    title: hero.h1,
    summary: hero.lead,
    heroCopy: hero.supporting_copy,
    sections,
    seoTitle: seo.seo_title,
    seoDescription: seo.seo_description,
    ogTitle: seo.og_title,
    ogDescription: seo.og_description,
  };
}

const translations = programmes.flatMap((programme) =>
  localeSources.map(([languageCode, sourceLocale]) => ({
    programme,
    ...readTranslation(programme, languageCode, sourceLocale),
  })),
);

for (const translation of translations) {
  const required = [
    translation.title,
    translation.summary,
    translation.heroCopy,
    translation.seoTitle,
    translation.seoDescription,
    translation.ogTitle,
    translation.ogDescription,
  ];
  if (required.some((value) => !value)) {
    throw new Error(`Incomplete ${translation.programme.slug}/${translation.languageCode} translation.`);
  }
  for (const key of [
    'facts',
    'value',
    'audience',
    'outcomes',
    'curriculum',
    'learning_experience',
    'assessment_document',
    'faq',
    'closing_cta',
  ]) {
    if (!translation.sections[key]) {
      throw new Error(`${translation.programme.slug}/${translation.languageCode} is missing ${key}.`);
    }
  }
}

const programmeRows = programmes
  .map(
    (programme) =>
      `  (${sqlString(programme.id)}, ${sqlString(programme.areaId)}, ${sqlString(programme.typeId)}, ${sqlString(programme.slug)}, 'published', ${sqlString(programme.format)}, ${sqlString(programme.applicationProvider)}, ${sqlNullableString(programme.applicationUrl)}, null, false)`,
  )
  .join(',\n');

const translationRows = translations
  .map(
    (translation) => `  (
    ${sqlString(translation.programme.id)}, ${sqlString(translation.languageCode)}, 'published',
    ${sqlString(translation.title)},
    ${sqlString(translation.summary)},
    ${sqlString(translation.heroCopy)},
    $json$${JSON.stringify(translation.sections, null, 2)}$json$::jsonb,
    ${sqlString(translation.seoTitle)},
    ${sqlString(translation.seoDescription)},
    ${sqlString(translation.ogTitle)},
    ${sqlString(translation.ogDescription)}
  )`,
  )
  .join(',\n');

const migration = `-- PRG-003: Programme Core
-- Five approved launch programmes and complete EN/UA/CZ structured sales content.
-- Generated from approved programme master copy with owner decisions dated 2026-08-04.

create type public.programme_publication_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.programme_format as enum (
  'distance',
  'blended_distance'
);

create type public.programme_application_provider as enum (
  'leeloo',
  'partner_site'
);

comment on type public.programme_publication_status is
  'Publication lifecycle for programme sales pages.';
comment on type public.programme_format is
  'Approved Release 1 delivery formats used by launch programmes.';
comment on type public.programme_application_provider is
  'External application destination managed by Nobel ITBS or a programme partner.';

create table public.programmes (
  id uuid primary key default extensions.gen_random_uuid(),
  area_id uuid not null references public.programme_areas(id) on delete restrict,
  type_id uuid not null references public.programme_types(id) on delete restrict,
  slug text not null unique,
  publication_status public.programme_publication_status not null default 'draft',
  format public.programme_format not null,
  application_provider public.programme_application_provider not null,
  application_url text null,
  enrolment_badge_override text null,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programmes_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint programmes_application_url_http check (
    application_url is null
    or application_url ~ '^https://'
  )
);

comment on table public.programmes is
  'Stable programme identity, classification, delivery format, and publication state.';
comment on column public.programmes.application_provider is
  'The approved external destination type: Leeloo or a partner-owned website.';
comment on column public.programmes.application_url is
  'Optional external application URL; when null, the public page uses the programme question fallback.';

create table public.programme_translations (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  title text null,
  summary text null,
  hero_copy text null,
  sections jsonb not null default '{}'::jsonb,
  seo_title text null,
  seo_description text null,
  og_title text null,
  og_description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (programme_id, language_code),
  constraint programme_translations_sections_object check (
    jsonb_typeof(sections) = 'object'
  ),
  constraint programme_translations_published_complete check (
    translation_status <> 'published'
    or (
      title is not null and btrim(title) <> ''
      and summary is not null and btrim(summary) <> ''
      and hero_copy is not null and btrim(hero_copy) <> ''
      and sections ?& array[
        'eyebrow',
        'primary_cta_label',
        'facts',
        'value',
        'audience',
        'outcomes',
        'curriculum',
        'learning_experience',
        'assessment_document',
        'faq',
        'closing_cta'
      ]
      and seo_title is not null and btrim(seo_title) <> ''
      and seo_description is not null and btrim(seo_description) <> ''
      and og_title is not null and btrim(og_title) <> ''
      and og_description is not null and btrim(og_description) <> ''
    )
  )
);

comment on table public.programme_translations is
  'Localized sales-page copy stored as fixed semantic sections, not arbitrary page-builder blocks.';
comment on column public.programme_translations.sections is
  'Fixed semantic programme sections; pricing and run state are intentionally managed by later modules.';

create index programme_translations_language_status_idx
  on public.programme_translations (language_code, translation_status);
create index programmes_area_publication_idx
  on public.programmes (area_id, publication_status);
create index programmes_type_publication_idx
  on public.programmes (type_id, publication_status);

create trigger programmes_set_updated_at
before update on public.programmes
for each row
execute function internal.set_updated_at();

create trigger programme_translations_set_updated_at
before update on public.programme_translations
for each row
execute function internal.set_updated_at();

insert into public.programmes (
  id,
  area_id,
  type_id,
  slug,
  publication_status,
  format,
  application_provider,
  application_url,
  enrolment_badge_override,
  featured
)
values
${programmeRows};

insert into public.programme_translations (
  programme_id,
  language_code,
  translation_status,
  title,
  summary,
  hero_copy,
  sections,
  seo_title,
  seo_description,
  og_title,
  og_description
)
values
${translationRows};

alter table public.programmes enable row level security;
alter table public.programmes force row level security;
alter table public.programme_translations enable row level security;
alter table public.programme_translations force row level security;

revoke all on table public.programmes from public, anon, authenticated;
revoke all on table public.programme_translations from public, anon, authenticated;
grant select on table public.programmes to anon;
grant select on table public.programme_translations to anon;
grant select, insert, update, delete on table public.programmes to authenticated;
grant select, insert, update, delete on table public.programme_translations to authenticated;
grant select, insert, update, delete on table public.programmes to postgres, service_role;
grant select, insert, update, delete on table public.programme_translations to postgres, service_role;
grant usage on type public.programme_publication_status to anon, authenticated, service_role;
grant usage on type public.programme_format to anon, authenticated, service_role;
grant usage on type public.programme_application_provider to anon, authenticated, service_role;

create policy programmes_public_read
on public.programmes for select to anon
using (publication_status = 'published');

create policy programmes_reference_read
on public.programmes for select to authenticated
using (
  publication_status = 'published'
  and internal.is_active_admin()
);

create policy programmes_content_read
on public.programmes for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programmes_content_insert
on public.programmes for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programmes_content_update
on public.programmes for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programmes_content_delete
on public.programmes for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_public_read
on public.programme_translations for select to anon
using (
  translation_status = 'published'
  and exists (
    select 1 from public.programmes programme_record
    where programme_record.id = programme_id
      and programme_record.publication_status = 'published'
  )
);

create policy programme_translations_reference_read
on public.programme_translations for select to authenticated
using (
  translation_status = 'published'
  and internal.is_active_admin()
  and exists (
    select 1 from public.programmes programme_record
    where programme_record.id = programme_id
      and programme_record.publication_status = 'published'
  )
);

create policy programme_translations_content_read
on public.programme_translations for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_content_insert
on public.programme_translations for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_content_update
on public.programme_translations for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_content_delete
on public.programme_translations for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
`;

writeFileSync(
  'supabase/migrations/20260804110000_prg_003_programme_core.sql',
  migration,
);

writeFileSync(
  'lib/programmes/generated-programme-content.json',
  `${JSON.stringify({
    programmes: programmes.map((programme) => ({
      slug: programme.slug,
      areaId: programme.areaId,
      typeId: programme.typeId,
      format: programme.format,
      applicationProvider: programme.applicationProvider,
      applicationUrl: programme.applicationUrl,
    })),
    translations: translations.map((translation) => ({
      slug: translation.programme.slug,
      languageCode: translation.languageCode,
      title: translation.title,
      summary: translation.summary,
      heroCopy: translation.heroCopy,
      sections: translation.sections,
      seoTitle: translation.seoTitle,
      seoDescription: translation.seoDescription,
      ogTitle: translation.ogTitle,
      ogDescription: translation.ogDescription,
    })),
  }, null, 2)}\n`,
);

console.log(`Generated PRG-003 migration and public fallback with ${programmes.length} programmes and ${translations.length} translations.`);
