import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'lib/credential-templates/pdf-generation.ts',
  'lib/credential-templates/pdf-generation-types.ts',
  'scripts/test-pdfgen-004-generation.mjs',
];
const errors = [];
for (const path of requiredPaths) {
  if (!existsSync(path)) errors.push(`Missing ${path}`);
}

const engine = existsSync(requiredPaths[0]) ? readFileSync(requiredPaths[0], 'utf8') : '';
for (const part of [
  "from 'node:fs/promises'",
  "from 'pdf-lib'",
  "from 'qrcode'",
  "from '@pdf-lib/fontkit'",
  'notosans-fontface',
  'validateTemplatePdf',
  'generateCredentialPdfPackage',
  'minimumQrPoints',
  "errorCorrectionLevel: 'Q'",
  'text_overflow',
  'missing_required_value',
  'maximumPdfBytes',
]) {
  if (!engine.includes(part)) errors.push(`PDF generation engine missing ${part}`);
}
if (/console\.(?:log|error|warn)|service[_-]?role|verificationToken|encryptedToken|lookupHash/u.test(engine)) {
  errors.push('PDF generation engine must not log or access protected token/service-role material.');
}

const nextConfig = readFileSync('next.config.mjs', 'utf8');
for (const part of ['outputFileTracingIncludes', 'NotoSans-Regular.ttf', 'NotoSans-Bold.ttf']) {
  if (!nextConfig.includes(part)) errors.push(`Next server trace missing ${part}`);
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
for (const dependency of ['@pdf-lib/fontkit', 'notosans-fontface', 'pdf-lib', 'qrcode']) {
  if (!packageJson.dependencies?.[dependency]) errors.push(`Missing runtime dependency ${dependency}`);
}
if (packageJson.scripts?.['test:pdfgen-004:generation'] !== 'node scripts/test-pdfgen-004-generation.mjs') {
  errors.push('Missing PDFGEN-004 generation test script.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('PDFGEN-004 static verification passed.');
