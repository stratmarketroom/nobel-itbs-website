import { readFileSync } from 'node:fs';

export const headingsMigrationPath = 'supabase/migrations/20260902170000_qa_i18n_001_localized_managed_headings.sql';
export const semanticMigrationPath = 'supabase/migrations/20260902180000_qa_semantic_001_managed_content_structure.sql';
const baselinePath = 'supabase/migrations/20260805120000_cnt_003_public_layout_navigation.sql';
const localizations = JSON.parse(readFileSync(new URL('./managed-headings-localization.json', import.meta.url), 'utf8'));

export function baselineRecords() {
  const source = readFileSync(baselinePath, 'utf8');
  const records = [...source.matchAll(/\(select id from public\.content_pages where page_key = '(home|about|partnerships|for_organisations)'\),([\s\S]*?)::jsonb/g)].map((match) => {
    const literals = [...match[2].matchAll(/'((?:''|[^'])*)'/g)].map((value) => value[1].replaceAll("''", "'"));
    if (literals.length !== 6) throw new Error('Unexpected CNT-003 baseline record format');
    return { pageKey: match[1], locale: literals[0], sections: JSON.parse(literals[5]) };
  });
  if (records.length !== 12 || new Set(records.map((record) => `${record.pageKey}/${record.locale}`)).size !== 12) {
    throw new Error('Expected twelve unique immutable CNT-003 baseline translations');
  }
  return records;
}

export function localizeBaseline(record) {
  const localization = localizations.find((item) => item.pageKey === record.pageKey && item.locale === record.locale);
  const sections = structuredClone(record.sections);
  if (!localization) return sections;
  for (const block of sections.blocks) {
    block.fields = { ...block.fields, ...localization.blockFields[block.key] };
    const cardTitles = localization.cardTitles[block.key];
    if (cardTitles) {
      for (const card of block.cards) {
        card.fields = { ...card.fields, ...(cardTitles[card.title] ? { title: cardTitles[card.title] } : {}) };
      }
    }
  }
  return sections;
}

export function headingReplacements() {
  return baselineRecords().filter((record) => record.pageKey !== 'home' && record.locale !== 'en')
    .map((record) => ({ ...record, expected: record.sections, sections: localizeBaseline(record) }));
}

export function semanticReplacements(records) {
  const baseline = baselineRecords();
  return records.filter((record) => record.pageKey !== 'home').map((record) => {
    const original = baseline.find((item) => item.pageKey === record.pageKey && item.locale === record.locale);
    if (!original) throw new Error('Missing immutable managed-page baseline');
    return { ...record, expected: localizeBaseline(original) };
  });
}

function literal(value) { return `'${String(value).replaceAll("'", "''")}'`; }

export function guardedMigration(ticket, alias, records) {
  if (records.length !== (ticket === 'QA-I18N-001' ? 6 : 9)) throw new Error('Unexpected replacement count');
  const values = records.map((record) => `      (
        ${literal(record.pageKey)},
        ${literal(record.locale)},
        ${literal(JSON.stringify(record.expected))}::jsonb,
        ${literal(JSON.stringify(record.sections))}::jsonb
      )`).join(',\n');
  return `-- ${ticket}: guarded managed-page content correction.
-- Expected snapshots come from immutable CNT-003 plus prior remediation steps.
-- Never overwrite CMS edits: any drift or missing row aborts the whole transaction.

begin;

do $$
declare
  affected_rows integer;
begin
  with ${alias}(page_key, language_code, expected_sections, sections) as (
    values
${values}
  )
  update public.content_page_translations as translation
  set sections = ${alias}.sections
  from public.content_pages as page,
    ${alias}
  where page.id = translation.page_id
    and page.page_key = ${alias}.page_key
    and translation.language_code = ${alias}.language_code
    and translation.sections = ${alias}.expected_sections;

  get diagnostics affected_rows = row_count;
  if affected_rows <> ${records.length} then
    raise exception
      '${ticket} expected ${records.length} unchanged managed-page translations, matched %; content drift or missing translations. Reconcile CMS edits before retrying. No changes committed.',
      affected_rows;
  end if;
end
$$;

commit;
`;
}

export function migrationRows(path = semanticMigrationPath) {
  const sql = readFileSync(path, 'utf8');
  return [...sql.matchAll(/\(\s*'(about|partnerships|for_organisations)',\s*'(en|ua|cz)',([\s\S]*?)::jsonb\s*\)/g)].map((match) => {
    const payloads = [...`${match[3]}::jsonb`.matchAll(/'((?:''|[^'])*)'::jsonb/g)]
      .map((value) => JSON.parse(value[1].replaceAll("''", "'")));
    return { pageKey: match[1], locale: match[2], sections: payloads.at(-1), expected: payloads.length > 1 ? payloads[0] : undefined };
  });
}
