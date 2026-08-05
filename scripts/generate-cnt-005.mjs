import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const policies = [
  { key: 'privacy_policy', slug: 'privacy-policy', files: { en: 'docs/legal/source/en/2026-03-01-privacy-policy-en.docx', cz: 'docs/legal/source/cz/2026-03-01-privacy-policy-cz.docx', ua: 'docs/legal/working/ua/2026-07-31-privacy-policy-ua.md' }, titles: { en: 'Privacy Policy', ua: 'Політика конфіденційності', cz: 'Zásady ochrany osobních údajů' } },
  { key: 'terms_of_use', slug: 'terms-of-use', files: { en: 'docs/legal/source/en/2026-03-01-terms-of-use-en.docx', cz: 'docs/legal/source/cz/2026-03-01-terms-of-use-cz.docx', ua: 'docs/legal/working/ua/2026-07-31-terms-of-use-ua.md' }, titles: { en: 'Terms of Use (Public Contract)', ua: 'Умови (Публічний договір)', cz: 'Podmínky používání (obchodní podmínky)' } },
  { key: 'refund_policy', slug: 'refund-policy', files: { en: 'docs/legal/source/en/2026-03-01-refund-policy-en.docx', cz: 'docs/legal/source/cz/2026-03-01-refund-policy-cz.docx', ua: 'docs/legal/working/ua/2026-07-31-refund-policy-ua.md' }, titles: { en: 'Refund Policy', ua: 'Політика повернення', cz: 'Podmínky vrácení peněz' } },
];

function decodeXml(value) { return value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))); }
function docxParagraphs(path) {
  const xml = execFileSync('unzip', ['-p', path, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 20_000_000 });
  return xml.split('</w:p>').map((part) => decodeXml([...part.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]).join('')).trim()).filter(Boolean);
}
function blocksFromParagraphs(paragraphs) {
  const blocks = [{ heading: '', paragraphs: [] }];
  for (const paragraph of paragraphs.slice(2)) {
    if (/^\d+\.\s+\S/.test(paragraph) && paragraph.length < 180) blocks.push({ heading: paragraph, paragraphs: [] });
    else blocks.at(-1).paragraphs.push(paragraph);
  }
  return blocks.filter((block) => block.heading || block.paragraphs.length);
}
function blocksFromMarkdown(path) {
  const source = readFileSync(path, 'utf8');
  const parts = source.split(/^## /m);
  const intro = parts.shift().split('\n').slice(1).join('\n').split(/\n\n+/).map((value) => value.replace(/\s+/g, ' ').trim()).filter((value) => value && !/^(Статус:|Канонічна версія:|Індексація:)/.test(value));
  const blocks = [{ heading: '', paragraphs: intro }];
  for (const part of parts) {
    const [heading, ...body] = part.split('\n');
    const paragraphs = body.join('\n').replace(/^### /gm, '').split(/\n\n+/).map((value) => value.replace(/\s+/g, ' ').trim()).filter(Boolean);
    blocks.push({ heading: heading.trim(), paragraphs });
  }
  return blocks;
}
function literal(value) { return `'${String(value).replaceAll("'", "''")}'`; }

const pageRows = policies.map((policy, index) => `('00000000-0000-4000-8000-00000000030${index + 1}', ${literal(policy.key)}, 'legal', 'published')`);
const translationRows = [];
for (const policy of policies) for (const locale of ['en', 'ua', 'cz']) {
  const path = policy.files[locale];
  const blocks = path.endsWith('.docx') ? blocksFromParagraphs(docxParagraphs(path)) : blocksFromMarkdown(path);
  const title = policy.titles[locale];
  const description = locale === 'ua' ? `Повний юридичний документ Nobel ITBS: ${title}.` : locale === 'cz' ? `Úplný právní dokument Nobel ITBS: ${title}.` : `Full Nobel ITBS legal document: ${title}.`;
  translationRows.push(`((select id from public.content_pages where page_key=${literal(policy.key)}),${literal(locale)},'published',${literal(`${title} | Nobel ITBS`)},${literal(description)},${literal(title)},${literal(JSON.stringify({ slug: policy.slug, blocks }))}::jsonb)`);
}

const sql = `-- CNT-005: Legal Pages\n-- Full EN/CZ lawyer-provided documents plus the approved UA website translations.\n\ninsert into public.content_pages (id,page_key,page_type,status) values\n${pageRows.join(',\n')}\non conflict (page_key) do update set page_type=excluded.page_type,status=excluded.status;\n\ninsert into public.content_page_translations (page_id,language_code,translation_status,seo_title,seo_description,h1,sections) values\n${translationRows.join(',\n')}\non conflict (page_id,language_code) do update set translation_status=excluded.translation_status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,h1=excluded.h1,sections=excluded.sections;\n`;
writeFileSync('supabase/migrations/20260805140000_cnt_005_legal_pages.sql', sql);
console.log(`Generated CNT-005 migration with ${translationRows.length} full legal translations.`);
