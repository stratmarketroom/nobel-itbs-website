import { readFileSync, writeFileSync } from 'node:fs';

const pages = [
  { key: 'home', type: 'home', files: { en: 'HOME_EN_MASTER_COPY.md', ua: 'HOME_UA_MASTER_COPY.md', cz: 'HOME_CZ_MASTER_COPY.md' }, range: [3, 11] },
  { key: 'about', type: 'editorial', files: { en: 'ABOUT_US_EN_MASTER_COPY.md', ua: 'ABOUT_US_UA_MASTER_COPY.md', cz: 'ABOUT_US_CZ_MASTER_COPY.md' }, range: [3, 12] },
  { key: 'partnerships', type: 'partnerships', files: { en: 'PARTNERSHIPS_EN_MASTER_COPY.md', ua: 'PARTNERSHIPS_UA_MASTER_COPY.md', cz: 'PARTNERSHIPS_CZ_MASTER_COPY.md' }, range: [3, 10] },
  { key: 'for_organisations', type: 'b2b', files: { en: 'FOR_ORGANISATIONS_EN_MASTER_COPY.md', ua: 'FOR_ORGANISATIONS_UA_MASTER_COPY.md', cz: 'FOR_ORGANISATIONS_CZ_MASTER_COPY.md' }, range: [3, 11] },
];

function clean(value) {
  return value.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function fieldsFrom(text) {
  const fields = {};
  const matches = [...text.matchAll(/`([a-z0-9_]+)`: ([\s\S]*?)(?=\n\n|\n`[a-z0-9_]+`:|\n### |$)/g)];
  for (const match of matches) fields[match[1]] = clean(match[2]);
  return fields;
}

function publicContent(text) {
  const publicSource = text
    .replace(/`[a-z0-9_]+`: [\s\S]*?(?=\n\n|\n`[a-z0-9_]+`:|\n### |$)/g, '')
    .replace(/^(?:Editorial rule|Publication dependency|Programme cards|Partner card fields|Expert card fields|Primary CTA|Secondary CTA|Utility action):[\s\S]*(?![\s\S])/gim, '')
    .trim();
  const items = [];
  const paragraphs = [];
  let currentItem = '';

  function finishItem() {
    if (currentItem) items.push(clean(currentItem));
    currentItem = '';
  }

  for (const sourceLine of publicSource.split('\n')) {
    const line = sourceLine.trim();
    if (!line) {
      finishItem();
      continue;
    }
    if (line.startsWith('- ')) {
      finishItem();
      currentItem = line.slice(2);
    } else if (currentItem) {
      currentItem = `${currentItem} ${line}`;
    } else {
      paragraphs.push(line);
    }
  }
  finishItem();

  return {
    body: clean(paragraphs.join('\n')),
    ...(items.length ? { items } : {}),
  };
}

function parseDocument(path) {
  const source = readFileSync(path, 'utf8');
  const seo = source.match(/## (?:\d+\. )?SEO\n([\s\S]*?)(?=\n## )/)?.[1] ?? '';
  const seoFields = fieldsFrom(seo);
  const blocks = [];
  for (const match of source.matchAll(/^## (?:(\d+)\. )?([^\n]+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) {
    const heading = match[2].trim();
    if (/^(Editorial Role|Editorial Guardrails|SEO|Removed|Approved Editorial Decisions|Remaining|Publication Dependencies|Claims Not Yet Approved)/i.test(heading)) continue;
    const sectionBody = match[3].trim();
    const firstSubheading = sectionBody.search(/^### /m);
    const leadPart = firstSubheading >= 0 ? sectionBody.slice(0, firstSubheading) : sectionBody;
    const cards = [];
    for (const card of sectionBody.matchAll(/^### ([^\n]+)\n([\s\S]*?)(?=^### |(?![\s\S]))/gm)) {
      cards.push({
        title: card[1].trim(),
        fields: fieldsFrom(card[2]),
        ...publicContent(card[2]),
      });
    }
    blocks.push({
      key: heading.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      title: heading,
      fields: fieldsFrom(leadPart),
      ...publicContent(leadPart),
      cards,
    });
  }
  const hero = blocks[0];
  return {
    seoTitle: seoFields.seo_title,
    seoDescription: seoFields.seo_description,
    h1: hero?.fields.h1,
    sections: { blocks },
  };
}

function literal(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const rows = [];
const records = [];
for (const page of pages) {
  for (const [locale, file] of Object.entries(page.files)) {
    const parsed = parseDocument(`docs/preparation/pages/${file}`);
    if (!parsed.seoTitle || !parsed.seoDescription || !parsed.h1 || parsed.sections.blocks.length === 0) {
      throw new Error(`Incomplete generated content for ${page.key}/${locale}`);
    }
    records.push({ pageKey: page.key, locale, ...parsed });
    rows.push(`(
      (select id from public.content_pages where page_key = ${literal(page.key)}),
      ${literal(locale)}, 'published', ${literal(parsed.seoTitle)}, ${literal(parsed.seoDescription)},
      ${literal(parsed.h1)}, ${literal(JSON.stringify(parsed.sections))}::jsonb
    )`);
  }
}

const sql = `-- CNT-003: Public Layout and Navigation\n-- Generated from approved EN/UA/CZ master copy.\n\nupdate public.content_pages\nset status = 'published'\nwhere page_key in ('home', 'about', 'partnerships', 'for_organisations');\n\ninsert into public.content_page_translations (\n  page_id, language_code, translation_status, seo_title, seo_description, h1, sections\n) values\n${rows.join(',\n')}\non conflict (page_id, language_code) do update set\n  translation_status = excluded.translation_status,\n  seo_title = excluded.seo_title,\n  seo_description = excluded.seo_description,\n  h1 = excluded.h1,\n  sections = excluded.sections;\n`;

const managedSectionRows = records
  .filter((record) => record.pageKey !== 'home')
  .map((record) => `(
        ${literal(record.pageKey)},
        ${literal(record.locale)},
        ${literal(JSON.stringify(record.sections))}::jsonb
      )`);
const managedSectionsFixSql = `-- QA-SEMANTIC-001: restore complete managed-page sections and semantic lists.
-- Generated from the approved EN/UA/CZ master copy without rewriting CNT-003.

begin;

do $$
declare
  affected_rows integer;
begin
  with replacements(page_key, language_code, sections) as (
    values
${managedSectionRows.join(',\n')}
  )
  update public.content_page_translations as translation
  set sections = replacements.sections
  from public.content_pages as page,
    replacements
  where page.id = translation.page_id
    and page.page_key = replacements.page_key
    and translation.language_code = replacements.language_code;

  get diagnostics affected_rows = row_count;
  if affected_rows <> ${managedSectionRows.length} then
    raise exception
      'QA-SEMANTIC-001 expected ${managedSectionRows.length} managed-page translations, updated %',
      affected_rows;
  end if;
end
$$;

commit;
`;

const outputPath = process.argv[2] || 'supabase/migrations/20260805120000_cnt_003_public_layout_navigation.sql';
const managedSectionsFix = process.argv[3] === '--managed-sections-fix';
writeFileSync(outputPath, managedSectionsFix ? managedSectionsFixSql : sql);
console.log(managedSectionsFix
  ? `Generated QA-SEMANTIC-001 migration with ${managedSectionRows.length} managed-page translations.`
  : `Generated CNT-003 migration with ${rows.length} localized page records.`);
