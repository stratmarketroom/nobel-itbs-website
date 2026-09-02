import assert from 'node:assert/strict';
import test from 'node:test';
import { migrationRows, renderedSection, renderFixture } from './lib/managed-content-test-fixtures.mjs';

const rows = migrationRows();

test('the migration fixture includes all nine managed translations', () => {
  assert.equal(rows.length, 9);
  assert.equal(new Set(rows.map((row) => `${row.pageKey}/${row.locale}`)).size, 9);
});

test('Czech numbered title/body fields render as adjacent semantic pairs', () => {
  const row = rows.find((item) => item.pageKey === 'about' && item.locale === 'cz');
  for (const [key, count] of [['two_areas_of_work', 2], ['our_educational_approach', 4]]) {
    const html = renderedSection(row, key);
    assert.equal((html.match(/<dt>/g) ?? []).length, count);
    assert.equal((html.match(/<dd>/g) ?? []).length, count);
    assert.match(html, /<dt>Profesní/);
    assert.doesNotMatch(html, /<p>Profesní (programy|relevance)<\/p>/);
  }
});

test('numbered pairs remain in numeric order after JSONB ordering', () => {
  const row = structuredClone(rows[0]);
  row.sections.blocks = [row.sections.blocks[0], { key: 'test', title: 'Test', fields: {
    title_10: 'Tenth', body_10: 'Body 10', title_2: 'Second', body_2: 'Body 2', title_1: 'First', body_1: 'Body 1',
  } }];
  const html = renderedSection(row, 'test');
  assert.ok(html.indexOf('<dt>First') < html.indexOf('<dt>Second'));
  assert.ok(html.indexOf('<dt>Second') < html.indexOf('<dt>Tenth'));
  assert.equal((html.match(/Body 1<\/dd>/g) ?? []).length, 1);
});

test('all About final CTAs use their current locale without ticks or duplicate prefixes', () => {
  for (const row of rows.filter((item) => item.pageKey === 'about')) {
    const prefix = row.locale === 'en' ? '' : `/${row.locale}`;
    const html = renderedSection(row, 'final_cta');
    assert.ok(html.includes(`href="${prefix}/programmes"`));
    assert.ok(html.includes(`href="${prefix}/for-organisations"`));
    assert.equal((html.match(/<a /g) ?? []).length, 2);
    assert.doesNotMatch(html, /href="[^\"]*`|\/(ua|cz)\/\1\//);
  }
});

test('fallback English content still links to the requested locale', () => {
  const row = structuredClone(rows.find((item) => item.pageKey === 'about' && item.locale === 'en'));
  row.locale = 'ua';
  assert.match(renderedSection(row, 'final_cta'), /href="\/ua\/programmes"/);
});

test('malformed or external editorial targets fall back to safe local routes', () => {
  for (const target of ['javascript:alert(1)', '//example.invalid', '/en//example.invalid', '/ua//example.invalid', '/\\example.invalid', '/bad\npath']) {
    for (const locale of ['en', 'ua', 'cz']) {
      const row = structuredClone(rows.find((item) => item.pageKey === 'about' && item.locale === locale));
      row.sections.blocks.find((block) => block.key === 'final_cta').fields.primary_cta_target = target;
      const prefix = locale === 'en' ? '' : `/${locale}`;
      assert.ok(renderedSection(row, 'final_cta').includes(`href="${prefix}/programmes"`));
    }
  }
});

test('B2B and partnership fallback CTAs link to the existing contact form once', () => {
  for (const row of rows.filter((item) => item.pageKey !== 'about')) {
    const html = renderedSection(row, 'final_cta');
    assert.match(html, /href="#contact"/);
    assert.equal((html.match(/<a /g) ?? []).length, 1);
    assert.match(renderFixture(row), /id="contact"/);
  }
});

test('configured organisation destination is reused with a separate contact fallback', () => {
  for (const row of rows.filter((item) => item.pageKey === 'for_organisations')) {
    const html = renderedSection(row, 'final_cta', 'https://example.invalid/approved-b2b');
    assert.match(html, /href="https:\/\/example.invalid\/approved-b2b"/);
    assert.match(html, /href="#contact"/);
    assert.equal((html.match(/<a /g) ?? []).length, 2);
  }
});

test('existing ordered steps and ordinary lists keep semantic markup', () => {
  for (const row of rows.filter((item) => item.pageKey === 'for_organisations')) {
    assert.equal((renderedSection(row, 'how_cooperation_works').match(/<li>/g) ?? []).length, 4);
    assert.match(renderedSection(row, 'how_cooperation_works'), /<ol /);
    assert.match(renderedSection(row, 'what_the_client_receives'), /<ul /);
  }
});
