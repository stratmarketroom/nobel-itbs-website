import { existsSync, readFileSync } from 'node:fs';
const files = [
  'supabase/migrations/20260805120000_cnt_003_public_layout_navigation.sql',
  'supabase/migrations/20260811130000_cnt_003_correct_home_content.sql',
  'supabase/migrations/20260812100000_cnt_003_restore_production_home_sections.sql',
  'supabase/tests/database/cnt_003_public_layout_navigation.test.sql',
  'supabase/tests/database/cnt_003_home_content_correction.test.sql',
  'components/managed-content-page.tsx',
  'app/about/page.tsx', 'app/[locale]/about/page.tsx',
  'app/for-organisations/page.tsx', 'app/[locale]/for-organisations/page.tsx',
  'app/partnerships/page.tsx', 'app/[locale]/partnerships/page.tsx',
];
const errors = files.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const component = existsSync(files[5]) ? readFileSync(files[5], 'utf8') : '';
for (const href of ['/programmes', '/for-organisations', '/partnerships', '/about', '/verify']) if (!component.includes(href)) errors.push(`Navigation missing ${href}`);
if (/news/i.test(component)) errors.push('News must not appear in Release 1 navigation.');
const migration = existsSync(files[0]) ? readFileSync(files[0], 'utf8') : '';
for (const key of ['home', 'about', 'partnerships', 'for_organisations']) if (!migration.includes(`'${key}'`)) errors.push(`Migration missing ${key}`);

const homeCorrection = existsSync(files[1]) ? readFileSync(files[1], 'utf8') : '';
const approvedSections = [...homeCorrection.matchAll(/\$json\$([\s\S]*?)\$json\$/g)].map((match) => {
  try { return JSON.parse(match[1]); } catch { errors.push('Home correction contains invalid JSON.'); return null; }
}).filter(Boolean);
if (approvedSections.length !== 3) errors.push('Home correction must contain EN, UA, and CZ payloads.');
for (const sections of approvedSections) {
  if (sections.blocks?.length !== 9) errors.push('Every corrected Home translation must contain nine blocks.');
  const areas = sections.blocks?.find((block) => block.key === 'programme_areas');
  if (areas?.cards?.length !== 3) errors.push('Every corrected Home translation must contain three programme areas.');
  const model = sections.blocks?.find((block) => block.key === 'how_the_model_works');
  if (!model?.fields?.step_4_title || !model?.fields?.step_4_body) errors.push('Every corrected Home translation must contain four model steps.');
}
const productionRepair = existsSync(files[2]) ? readFileSync(files[2], 'utf8') : '';
if (!productionRepair.includes("when 'programme_areas'")) errors.push('Production repair must target programme areas.');
if (!productionRepair.includes("when 'why_nobel_itbs'")) errors.push('Production repair must target trust cards.');
if ((productionRepair.match(/\$json\$/g) ?? []).length !== 12) errors.push('Production repair must contain six approved JSON arrays.');
if (!productionRepair.includes("translation.language_code in ('en', 'ua', 'cz')")) errors.push('Production repair self-check must cover EN, UA, and CZ.');
if (errors.length) { console.error('CNT-003 verification failed:'); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log('CNT-003 verification passed.');
