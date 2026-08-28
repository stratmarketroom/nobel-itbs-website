import { existsSync, readFileSync } from 'node:fs';

const paths = {
  ui: 'components/admin-credential-batches.tsx',
  parent: 'components/admin-credentials.tsx',
  input: 'lib/credentials/batch-generation-input.ts',
  server: 'lib/credentials/batch-generation.ts',
  files: 'lib/credentials/files.ts',
  bulkRoute: 'app/api/v1/admin/credential-generation-batches/[id]/review/route.ts',
  thumbnailRoute: 'app/api/v1/admin/credentials/[id]/files/[fileId]/pages/[pageNumber]/route.ts',
  report: 'docs/qa/PDFGEN_006_REVIEW_UX_001_2026-08-28.md',
};

const errors = [];
for (const path of Object.values(paths)) if (!existsSync(path)) errors.push(`Missing ${path}`);
const source = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';

const ui = source(paths.ui);
for (const part of [
  'const reviewPageSize = 25',
  'slice((page - 1) * reviewPageSize, page * reviewPageSize)',
  'CredentialReviewThumbnail',
  'openedReviewFiles',
  'Select opened packages',
  'Mark selected reviewed',
  'Open every PDF in a package',
  'Activation remains a separate explicit action',
  'loading="lazy"',
  'requestBlob',
]) if (!ui.includes(part)) errors.push(`Review workspace missing ${part}`);
if (!ui.includes('item.files.every((file) => openedReviewFiles.has(file.id))')) {
  errors.push('Review selection must require every package file to be opened.');
}
if (!ui.includes('window.confirm(`Mark ${itemIds.length} selected package')) {
  errors.push('Bulk review must require explicit confirmation.');
}

const parent = source(paths.parent);
for (const part of ['const requestBlob = useCallback', 'Authorization: `Bearer ${await token()}`', 'requestBlob={requestBlob}']) {
  if (!parent.includes(part)) errors.push(`Authenticated thumbnail request bridge missing ${part}`);
}

const input = source(paths.input);
for (const part of ['batchReviewPayload', 'body.itemIds.length > 25', 'new Set(itemIds).size !== itemIds.length']) {
  if (!input.includes(part)) errors.push(`Review payload validation missing ${part}`);
}

const server = source(paths.server);
for (const part of [
  'reviewCredentialGenerationBatchItems',
  ".eq('batch_id', batchId)",
  ".in('id', itemIds)",
  "item.status !== 'generated'",
  "db.rpc('review_credential_generation_batch_item'",
  'failedCount: itemIds.length - reviewedCount',
]) if (!server.includes(part)) errors.push(`Bulk review server workflow missing ${part}`);

const bulkRoute = source(paths.bulkRoute);
for (const part of ['getAdminContext(request)', 'batchReviewPayload', 'reviewCredentialGenerationBatchItems', "assertUuid(id, 'batch ID')"]) {
  if (!bulkRoute.includes(part)) errors.push(`Bulk review route missing ${part}`);
}

const files = source(paths.files);
for (const part of ['downloadCredentialFileForPreview', 'const db = requestClient(context)', 'await fileRow(db, credentialId, fileId)', '.storage.from(bucket).download']) {
  if (!files.includes(part)) errors.push(`Private thumbnail storage workflow missing ${part}`);
}

const thumbnailRoute = source(paths.thumbnailRoute);
for (const part of [
  'getAdminContext(request)',
  'downloadCredentialFileForPreview',
  'renderPdfPage',
  "'Content-Type': 'image/png'",
  "'Cache-Control': 'private, no-store, max-age=0'",
  "'X-Content-Type-Options': 'nosniff'",
  '520',
]) if (!thumbnailRoute.includes(part)) errors.push(`Private thumbnail route missing ${part}`);
if (/signedUrl|storage_path|raw_token|verification_token/iu.test(thumbnailRoute)) {
  errors.push('Thumbnail response must not expose signed URLs, private paths, or token material.');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pdfgen-006:review-ux'] !== 'node scripts/verify-pdfgen-006-review-ux-001.mjs') {
  errors.push('Missing review UX verifier package script.');
}

if (errors.length) {
  console.error('PDFGEN-006-REVIEW-UX-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('PDFGEN-006-REVIEW-UX-001 static verification passed.');
