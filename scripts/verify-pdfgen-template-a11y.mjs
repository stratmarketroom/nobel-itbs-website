import { existsSync, readFileSync } from 'node:fs';

const componentPath = 'components/admin-credential-templates.tsx';
const pagePath = 'app/admin/credential-templates/page.tsx';
const cssPath = 'app/admin.css';
const errors = [];

for (const path of [componentPath, pagePath, cssPath]) {
  if (!existsSync(path)) errors.push(`Missing ${path}`);
}

const component = existsSync(componentPath) ? readFileSync(componentPath, 'utf8') : '';
const page = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : '';
const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';

for (const part of [
  "import { canonicalOrigin } from '@/lib/seo/urls'",
  '`${canonicalOrigin}/verify/sample-token-not-for-production`',
  '<main',
  'aria-labelledby="template-workspace-title"',
  'role="tablist"',
  'role="tab"',
  'aria-selected={active}',
  'aria-controls="template-version-panel"',
  'aria-controls="template-document-panel"',
  "event.key === 'ArrowRight'",
  "event.key === 'Home'",
  'movePlacementWithKeyboard',
  'aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"',
  'htmlFor={`${id}-programme`}',
  'htmlFor={`${id}-file`}',
  'htmlFor={`${id}-static-text`}',
  'X position (pt)',
  'Private non-production sample',
  "role={notice.kind === 'error' ? 'alert' : 'status'}",
]) {
  if (!component.includes(part)) errors.push(`Template editor missing ${part}`);
}

if ((component.match(/<main\b/g) ?? []).length !== 1) {
  errors.push('Template editor must expose exactly one main landmark.');
}
if (component.includes('<section className="template-workspace"')) {
  errors.push('Template workspace must not use a section as its page landmark.');
}
if (component.includes('verify.nobel-itbs.com')) {
  errors.push('Template samples must not use the retired verification host.');
}
if (component.includes('/verify/${sampleValues.document_number}')) {
  errors.push('Verification URL samples must use token routing, not document numbers.');
}

for (const part of [
  "title:'Template packages | Nobel ITBS Admin'",
  'robots:{index:false,follow:false}',
]) {
  if (!page.includes(part)) errors.push(`Admin page metadata missing ${part}`);
}
if (/alternates\s*:|canonical\s*:/.test(page)) {
  errors.push('Protected admin pages must not emit public canonical metadata.');
}

for (const part of [
  '/* PDFGEN-TEMPLATE-A11Y: protected template package workspace */',
  '.template-workspace :is(button, input, select, textarea):focus-visible',
  '.template-tabs button[aria-selected="true"]',
  '.document-tabs > button[role="tab"][aria-selected="true"]',
  '.placement-box:focus-visible',
  '@media (max-width: 680px)',
  '@media (prefers-reduced-motion: reduce)',
]) {
  if (!css.includes(part)) errors.push(`Template editor CSS missing ${part}`);
}

if (errors.length) {
  console.error('PDFGEN-TEMPLATE-A11Y verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('PDFGEN-TEMPLATE-A11Y verification passed.');
