import fs from 'node:fs';

const componentPath = 'components/admin-content-pages.tsx';
const stylesPath = 'app/globals.css';
const apiPath = 'app/api/v1/admin/content-pages/[id]/route.ts';
const errors = [];
for (const file of [componentPath, stylesPath, apiPath]) if (!fs.existsSync(file)) errors.push(`Missing required file: ${file}`);

if (errors.length === 0) {
  const component = fs.readFileSync(componentPath, 'utf8');
  const styles = fs.readFileSync(stylesPath, 'utf8');
  const api = fs.readFileSync(apiPath, 'utf8');
  for (const snippet of [
    'ControlledSections', 'ControlledObject', 'ControlledValue', 'blankStructure', 'structuralKeys',
    "const stringListKeys = new Set(['items', 'paragraphs'])", "const structuredListKeys = new Set(['blocks', 'cards'])",
    "type JsonPath = Array<string | number>", "const [tab, setTab]", 'Page sections', 'H1 and SEO',
    'Publication', "contentLocales.map", 'Publish the English translation before publishing this page',
    'One item or paragraph per line', 'Fixed blocks and identifiers are preserved',
    'content-structured-empty', 'programme-save-feedback', 'Saved. Audit log updated.',
  ]) if (!component.includes(snippet)) errors.push(`Controlled content editor missing: ${snippet}`);
  for (const forbidden of ['JSON.parse(editor.sections)', 'JSON.stringify(translation?.sections', 'Controlled sections (JSON object)']) {
    if (component.includes(forbidden)) errors.push(`Raw JSON editing remains in the manager UI: ${forbidden}`);
  }
  for (const snippet of ['.content-controlled-sections', '.content-structure-group', '.content-controlled-grid', '.content-structure-identifier', '.content-structured-empty', '.programme-save-feedback']) {
    if (!styles.includes(snippet)) errors.push(`Controlled content styles missing: ${snippet}`);
  }
  if (!api.includes("typeof body.sections !== 'object'") || !api.includes('updateContentPageTranslation')) errors.push('Existing protected structured-content API contract is not preserved.');
}

if (errors.length) {
  console.error('Admin Content Fields verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Admin Content Fields verification passed.');
