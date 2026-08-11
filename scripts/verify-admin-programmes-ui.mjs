import fs from 'node:fs';

const files = {
  page: 'app/admin/programmes/page.tsx',
  component: 'components/admin-programmes.tsx',
  shell: 'components/admin-shell.tsx',
  styles: 'app/globals.css',
};
const errors = [];

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) errors.push(`Missing required file: ${file}`);
}

if (errors.length === 0) {
  const page = fs.readFileSync(files.page, 'utf8');
  const component = fs.readFileSync(files.component, 'utf8');
  const shell = fs.readFileSync(files.shell, 'utf8');
  const styles = fs.readFileSync(files.styles, 'utf8');

  for (const snippet of ['AdminProgrammes', "robots: { index: false, follow: false }"]) {
    if (!page.includes(snippet)) errors.push(`Programme admin page missing: ${snippet}`);
  }
  for (const snippet of [
    "'/api/v1/admin/programmes'", "'/api/v1/admin/programme-areas'", "'/api/v1/admin/programme-types'",
    "method: creating ? 'POST' : 'PATCH'", 'translationStatus', 'catalogueSortOrder',
    'instructionLanguageCodes', 'applicationProvider', 'Sales sections', 'SectionValue',
    'New programme', 'Save programme', "locales: Locale[] = ['en', 'ua', 'cz']",
  ]) {
    if (!component.includes(snippet)) errors.push(`Programme admin component missing: ${snippet}`);
  }
  if (/Controlled sections \(JSON|JSON object\)/i.test(component)) {
    errors.push('Programme manager must expose controlled fields instead of a raw JSON editor.');
  }
  if (!shell.includes("href: '/admin/programmes'") || !shell.includes("roles: ['owner', 'super_admin', 'content_manager']")) {
    errors.push('Programme navigation must be limited to content-management roles.');
  }
  for (const snippet of ['.programme-admin-layout', '.programme-editor-tabs', '.programme-locale-bar', '@media (max-width: 720px)']) {
    if (!styles.includes(snippet)) errors.push(`Programme admin responsive styles missing: ${snippet}`);
  }
}

if (errors.length) {
  console.error('Admin Programmes UI verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Admin Programmes UI verification passed.');
