import fs from 'node:fs';

const files = {
  component: 'components/admin-programme-taxonomy.tsx',
  areaPage: 'app/admin/programme-areas/page.tsx',
  typePage: 'app/admin/programme-types/page.tsx',
  shell: 'components/admin-shell.tsx',
  styles: 'app/globals.css',
  areaApi: 'app/api/v1/admin/programme-areas/[id]/route.ts',
  typeApi: 'app/api/v1/admin/programme-types/[id]/route.ts',
};

const errors = [];
for (const path of Object.values(files)) {
  if (!fs.existsSync(path)) errors.push(`Missing required file: ${path}`);
}

if (errors.length === 0) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, fs.readFileSync(path, 'utf8')]));

  for (const snippet of [
    "type TaxonomyKind = 'area' | 'type'", "const locales: Locale[] = ['en', 'ua', 'cz']",
    "'/api/v1/admin/programme-areas'", "'/api/v1/admin/programme-types'",
    'Page copy', 'Landing sections', 'SEO', 'Translation status',
    'Changing a published slug creates a permanent redirect',
    'Publish the English translation before publishing',
    'Archive records that should no longer appear publicly',
    'primary_cta_label', 'supporting_copy', 'closing_cta', 'empty_cta_label',
  ]) {
    if (!source.component.includes(snippet)) errors.push(`Taxonomy manager missing: ${snippet}`);
  }

  if (source.component.includes('JSON.stringify(translationEditor.sections, null, 2)')) {
    errors.push('Taxonomy manager must expose controlled section fields, not a raw JSON editor.');
  }

  for (const [key, kind] of [['areaPage', 'area'], ['typePage', 'type']]) {
    if (!source[key].includes(`<AdminProgrammeTaxonomy kind="${kind}" />`)) errors.push(`${key} is not wired to the shared manager.`);
  }

  for (const route of ['/admin/programme-areas', '/admin/programme-types']) {
    if (!source.shell.includes(route)) errors.push(`Admin navigation missing: ${route}`);
  }
  for (const role of ["'owner'", "'super_admin'", "'content_manager'"]) {
    if (!source.shell.includes(role)) errors.push(`Admin taxonomy route role missing: ${role}`);
  }
  if (!source.styles.includes('.taxonomy-sections-editor')) errors.push('Taxonomy section editor styles are missing.');
  if (!source.areaApi.includes('saveProgrammeAreaTranslation')) errors.push('Area translation API is not connected.');
  if (!source.typeApi.includes('saveProgrammeTypeTranslation')) errors.push('Type translation API is not connected.');
}

if (errors.length) {
  console.error('Admin Programme Taxonomy UI verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Admin Programme Taxonomy UI verification passed.');
