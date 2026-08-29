import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = process.argv[2];

if (!outputDirectory || !path.isAbsolute(outputDirectory)) {
  throw new Error('Provide an absolute output directory.');
}

const header = 'Latin first name,Latin last name,Ukrainian full name,Internal note';
const chunks = [
  { fileName: 'pdfgen-008-a-200.csv', cohort: 'A', start: 1, end: 200 },
  { fileName: 'pdfgen-008-b-001-500.csv', cohort: 'B', start: 1, end: 500 },
  { fileName: 'pdfgen-008-b-501-540.csv', cohort: 'B', start: 501, end: 540 },
  { fileName: 'pdfgen-008-c-001-500.csv', cohort: 'C', start: 1, end: 500 },
  { fileName: 'pdfgen-008-c-501-1000.csv', cohort: 'C', start: 501, end: 1000 },
];

await mkdir(outputDirectory, { recursive: true });

const manifest = [];
for (const chunk of chunks) {
  const rows = [header];
  for (let index = chunk.start; index <= chunk.end; index += 1) {
    const serial = String(index).padStart(4, '0');
    rows.push([
      'Pdfgen',
      `E2e${chunk.cohort}${serial}`,
      `Тест PDFGEN ${chunk.cohort} ${serial}`,
      `PDFGEN-008 synthetic Development-only cohort ${chunk.cohort}`,
    ].join(','));
  }

  const filePath = path.join(outputDirectory, chunk.fileName);
  await writeFile(filePath, `${rows.join('\n')}\n`, { encoding: 'utf8', flag: 'wx' });
  manifest.push({
    cohort: chunk.cohort,
    count: chunk.end - chunk.start + 1,
    filePath,
  });
}

console.log(JSON.stringify({
  total: manifest.reduce((sum, item) => sum + item.count, 0),
  files: manifest,
}, null, 2));
