import fs from 'node:fs';

const componentPath = 'components/admin-programme-operations.tsx';
const programmePath = 'components/admin-programmes.tsx';
const dataPath = 'lib/programmes/admin.ts';
const stylesPath = 'app/globals.css';
const errors = [];

for (const file of [componentPath, programmePath, dataPath, stylesPath]) {
  if (!fs.existsSync(file)) errors.push(`Missing required file: ${file}`);
}

if (errors.length === 0) {
  const component = fs.readFileSync(componentPath, 'utf8');
  const programme = fs.readFileSync(programmePath, 'utf8');
  const data = fs.readFileSync(dataPath, 'utf8');
  const styles = fs.readFileSync(stylesPath, 'utf8');

  for (const snippet of [
    "'/api/v1/admin/programme-runs'", "'/api/v1/admin/programme-pricing-options'",
    "method: 'DELETE'", 'Confirm remove', 'Learning start', 'Learning end',
    'A start date describes learning commencement', 'Pricing language',
    'translationStatus', '3 option limit', 'programme-url-hierarchy',
    'Pricing option URL', 'Active run URL', 'Question fallback',
  ]) {
    if (!component.includes(snippet)) errors.push(`Programme operations UI missing: ${snippet}`);
  }
  for (const snippet of ["'runs'", "'pricing'", 'AdminProgrammeOperations']) {
    if (!programme.includes(snippet)) errors.push(`Programme editor integration missing: ${snippet}`);
  }
  for (const snippet of ["count: 'exact'", '(count ?? 0) >= 3', 'up to three pricing options']) {
    if (!data.includes(snippet)) errors.push(`Server-side pricing limit missing: ${snippet}`);
  }
  for (const snippet of ['.programme-operation-layout', '.programme-url-hierarchy', '.programme-pricing-translation']) {
    if (!styles.includes(snippet)) errors.push(`Programme operations styles missing: ${snippet}`);
  }
}

if (errors.length) {
  console.error('Admin Programme Operations UI verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Admin Programme Operations UI verification passed.');
