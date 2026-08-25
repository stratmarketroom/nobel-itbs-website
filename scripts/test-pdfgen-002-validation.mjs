import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  TemplatePdfValidationError,
  validateTemplatePdf,
} from '../lib/credential-templates/pdf-validation.ts';

function createPdf(pageSizes) {
  const pageObjectNumbers = pageSizes.map((_size, index) => 3 + index * 2);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] /Count ${pageSizes.length} >>`,
  ];

  for (let index = 0; index < pageSizes.length; index += 1) {
    const [width, height] = pageSizes[index];
    const contentNumber = pageObjectNumbers[index] + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents ${contentNumber} 0 R >>`);
    objects.push('<< /Length 0 >>\nstream\n\nendstream');
  }

  const header = Buffer.from('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n', 'latin1');
  const chunks = [header];
  const offsets = [0];
  let byteLength = header.length;
  for (let index = 0; index < objects.length; index += 1) {
    const chunk = Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`, 'latin1');
    offsets.push(byteLength);
    chunks.push(chunk);
    byteLength += chunk.length;
  }

  const xrefOffset = byteLength;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    '0000000000 65535 f \n',
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join('');
  chunks.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(chunks);
}

async function expectRejected(bytes, label) {
  await assert.rejects(
    validateTemplatePdf(bytes),
    (error) => error instanceof TemplatePdfValidationError,
    label,
  );
}

const onePage = createPdf([[595, 842]]);
const validatedOnePage = await validateTemplatePdf(onePage);
assert.equal(validatedOnePage.pageCount, 1);
assert.deepEqual(validatedOnePage.pages, [{ pageNumber: 1, widthPoints: 595, heightPoints: 842 }]);
assert.equal(validatedOnePage.sourceSha256, createHash('sha256').update(onePage).digest('hex'));

const twoPages = createPdf([[612, 792], [842, 595]]);
const validatedTwoPages = await validateTemplatePdf(twoPages);
assert.equal(validatedTwoPages.pageCount, 2);
assert.deepEqual(validatedTwoPages.pages, [
  { pageNumber: 1, widthPoints: 612, heightPoints: 792 },
  { pageNumber: 2, widthPoints: 842, heightPoints: 595 },
]);

await expectRejected(Buffer.from('%PDF-1.7\nnot a real PDF'), 'malformed PDF should be rejected');
await expectRejected(Buffer.from('plain text'), 'non-PDF should be rejected');

for (const name of ['/Encrypt', '/JavaScript', '/J#53', '/EmbeddedFiles', '/Launch', '/URI', '/AcroForm']) {
  await expectRejected(Buffer.concat([onePage, Buffer.from(`\n% ${name}\n`)]), `${name} should be rejected`);
}

console.log('PDFGEN-002 strict PDF validation tests passed.');
