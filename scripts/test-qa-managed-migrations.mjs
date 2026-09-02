import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { headingsMigrationPath, migrationRows, semanticMigrationPath } from './lib/managed-content-migrations.mjs';

// Optional isolated PostgreSQL runner, installed outside the repository.
// Never reads application environment files or connects to hosted databases.
const modulePath = process.env.NOBEL_QA_PGLITE_MODULE;
if (!modulePath) throw new Error('Set NOBEL_QA_PGLITE_MODULE to an installed PGlite module for in-memory SQL tests.');
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
const baseline = readFileSync('supabase/migrations/20260805120000_cnt_003_public_layout_navigation.sql', 'utf8');
const headings = readFileSync(headingsMigrationPath, 'utf8');
const semantic = readFileSync(semanticMigrationPath, 'utf8');
const headingRows = migrationRows(headingsMigrationPath);
const semanticRows = migrationRows(semanticMigrationPath);
let passed = 0;

async function snapshot() {
  return (await db.query('select * from public.content_page_translations order by page_id, language_code')).rows;
}

async function rejectWithoutChanges(sql, message) {
  const before = await snapshot();
  await assert.rejects(db.exec(sql), /content drift or missing translations/);
  await db.exec('rollback;');
  assert.deepEqual(await snapshot(), before, message);
  passed += 1;
}

try {
  await db.exec(`
    create table public.content_pages (id uuid primary key, page_key text unique, status text);
    create table public.content_page_translations (
      page_id uuid references public.content_pages(id), language_code text,
      translation_status text, seo_title text, seo_description text, h1 text,
      sections jsonb not null, primary key (page_id, language_code)
    );
    insert into public.content_pages values
      ('00000000-0000-4000-8000-000000000201', 'home', 'published'),
      ('00000000-0000-4000-8000-000000000202', 'about', 'published'),
      ('00000000-0000-4000-8000-000000000203', 'partnerships', 'published'),
      ('00000000-0000-4000-8000-000000000204', 'for_organisations', 'published');
  `);
  await db.exec(baseline);
  const before = await snapshot();
  await db.exec(headings);
  for (const row of headingRows) {
    const actual = await db.query('select t.sections from public.content_page_translations t join public.content_pages p on p.id=t.page_id where p.page_key=$1 and t.language_code=$2', [row.pageKey, row.locale]);
    assert.deepEqual(actual.rows[0].sections, row.sections);
  }
  passed += 1;
  await db.exec(semantic);
  for (const row of semanticRows) {
    const actual = await db.query('select t.sections from public.content_page_translations t join public.content_pages p on p.id=t.page_id where p.page_key=$1 and t.language_code=$2', [row.pageKey, row.locale]);
    assert.deepEqual(actual.rows[0].sections, row.sections);
  }
  passed += 1;
  const after = await snapshot();
  assert.deepEqual(after.filter((row) => row.page_id.endsWith('201')), before.filter((row) => row.page_id.endsWith('201')));
  assert.deepEqual(after.map((row) => ({ ...row, sections: null })), before.map((row) => ({ ...row, sections: null })));
  passed += 1;

  for (const [sql, prerequisite, records] of [[headings, '', headingRows], [semantic, headings, semanticRows]]) {
    for (const row of records) {
      await db.exec(baseline);
      if (prerequisite) await db.exec(prerequisite);
      await db.query(`update public.content_page_translations t set sections=jsonb_set(sections, '{blocks,0,fields,eyebrow}', '"CMS manual edit"'::jsonb)
        from public.content_pages p where p.id=t.page_id and p.page_key=$1 and t.language_code=$2`, [row.pageKey, row.locale]);
      await rejectWithoutChanges(sql, `CMS edit must survive for ${row.pageKey}/${row.locale}`);
    }
    await db.exec(baseline);
    if (prerequisite) await db.exec(prerequisite);
    await db.exec("delete from public.content_page_translations where page_id='00000000-0000-4000-8000-000000000202' and language_code='ua';");
    await rejectWithoutChanges(sql, 'A missing translation must roll back every other update');
  }
  console.log(`Managed migration SQL tests passed: ${passed} cases (exact outputs, unchanged Home/metadata, drift in all 15 targets, missing-row rollback).`);
} finally {
  await db.close();
}
