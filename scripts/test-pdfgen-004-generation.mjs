import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  generateCredentialPdfPackage,
} from '../lib/credential-templates/pdf-generation.ts';
import {
  CredentialPdfGenerationError,
} from '../lib/credential-templates/pdf-generation-types.ts';

const verificationUrl = 'https://nobel-itbs.eu/verify/pdfgen-004-fictional-qr-token';
const longHolderName = 'Oleksandra Mariia Šťastná-Kovalenko de la Cruz';
const longProgrammeTitle = 'Advanced International Leadership, Neuroplasticity and Responsible Innovation Programme';

function placement(overrides) {
  return {
    pageNumber: 1,
    fieldKey: 'holder_name',
    occurrenceOrder: 0,
    xPoints: 60,
    yPoints: 100,
    widthPoints: 720,
    heightPoints: 44,
    fontFamily: 'noto_sans',
    fontSizePoints: 26,
    minFontSizePoints: 12,
    fontWeight: 600,
    fontColor: '#14375A',
    textAlignment: 'center',
    fitMode: 'shrink_to_fit',
    dateFormat: null,
    staticText: null,
    isRequired: true,
    ...overrides,
  };
}

async function sourcePdf(pageSizes, rotations = []) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pageSizes.forEach(([width, height], index) => {
    const page = pdf.addPage([width, height]);
    if (rotations[index]) page.setRotation(degrees(rotations[index]));
    page.drawRectangle({ x: 22, y: 22, width: width - 44, height: height - 44, borderWidth: 1, borderColor: rgb(0.18, 0.34, 0.52) });
    page.drawText(`PRIVATE TEMPLATE PAGE ${index + 1}`, { x: 42, y: height - 54, size: 13, font, color: rgb(0.25, 0.25, 0.25) });
  });
  return new Uint8Array(await pdf.save());
}

async function extractedText(bytes) {
  const loading = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, useWasm: false, verbosity: 0 });
  try {
    const pdf = await loading.promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '));
    }
    return pages.join(' ');
  } finally {
    await loading.destroy();
  }
}

async function rasterPage(bytes, pageNumber, scale = 4.2) {
  const loading = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, useWasm: false, verbosity: 0 });
  try {
    const pdf = await loading.promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    await loading.destroy();
  }
}

function expectGenerationError(code) {
  return (error) => error instanceof CredentialPdfGenerationError && error.code === code;
}

const primarySource = await sourcePdf([[842, 595]]);
const supplementSource = await sourcePdf([[595, 842], [842, 595]], [0, 90]);

const input = {
  locale: 'ua',
  values: {
    holderName: 'Олена Коваленко',
    programmeTitle: 'Řízení změn та інновацій',
    credentialType: 'Professional Development Certificate',
    documentNumber: 'NITBS-C-2026-000123',
    issueDate: '2026-08-25',
    completionDate: '2026-08-20',
    programmeRunLabel: 'Осінь 2026 / Podzim 2026',
    verificationUrl,
  },
  documents: [
    {
      templateDocumentId: 'template-primary',
      fileTypeId: 'main-certificate',
      adminLabel: 'Certificate',
      outputFilename: 'certificate.pdf',
      sortOrder: 0,
      isPrimary: true,
      sourcePdf: primarySource,
      placements: [
        placement({ fieldKey: 'holder_name', yPoints: 108 }),
        placement({ fieldKey: 'programme_title', yPoints: 172, fontSizePoints: 22, minFontSizePoints: 11, fontWeight: 500 }),
        placement({ fieldKey: 'document_number', xPoints: 60, yPoints: 270, widthPoints: 340, heightPoints: 30, fontSizePoints: 13, minFontSizePoints: 9, fontWeight: 400, textAlignment: 'left' }),
        placement({ fieldKey: 'issue_date', xPoints: 60, yPoints: 312, widthPoints: 340, heightPoints: 30, fontSizePoints: 13, minFontSizePoints: 9, fontWeight: 400, textAlignment: 'left', dateFormat: 'D MMMM YYYY' }),
        placement({ fieldKey: 'verification_url', xPoints: 410, yPoints: 410, widthPoints: 250, heightPoints: 44, fontSizePoints: 9, minFontSizePoints: 7, fontWeight: 400, textAlignment: 'center', fitMode: 'wrap' }),
        placement({ fieldKey: 'verification_qr', xPoints: 690, yPoints: 390, widthPoints: 96, heightPoints: 96, fontFamily: null, fontSizePoints: null, minFontSizePoints: null, fontWeight: null, fontColor: null, textAlignment: 'left', fitMode: 'fixed' }),
      ],
    },
    {
      templateDocumentId: 'template-supplement',
      fileTypeId: 'supplement',
      adminLabel: 'Supplement',
      outputFilename: 'supplement.pdf',
      sortOrder: 1,
      isPrimary: false,
      sourcePdf: supplementSource,
      placements: [
        placement({ fieldKey: 'static_text', xPoints: 55, yPoints: 94, widthPoints: 485, heightPoints: 74, fontSizePoints: 14, minFontSizePoints: 10, fontWeight: 400, textAlignment: 'left', fitMode: 'wrap', staticText: 'Додаток до сертифіката / Dodatek k certifikátu' }),
        placement({ fieldKey: 'completion_date', xPoints: 55, yPoints: 190, widthPoints: 300, heightPoints: 30, fontSizePoints: 12, minFontSizePoints: 9, fontWeight: 400, textAlignment: 'left', dateFormat: 'DD.MM.YYYY' }),
        placement({ pageNumber: 2, fieldKey: 'holder_name', xPoints: 60, yPoints: 110, widthPoints: 475, heightPoints: 42, fontSizePoints: 20, minFontSizePoints: 11, fontWeight: 700 }),
        placement({ pageNumber: 2, fieldKey: 'programme_run_label', xPoints: 60, yPoints: 170, widthPoints: 475, heightPoints: 60, fontSizePoints: 14, minFontSizePoints: 9, fontWeight: 400, fitMode: 'wrap' }),
        placement({ pageNumber: 2, fieldKey: 'verification_qr', xPoints: 430, yPoints: 650, widthPoints: 90, heightPoints: 90, fontFamily: null, fontSizePoints: null, minFontSizePoints: null, fontWeight: null, fontColor: null, textAlignment: 'left', fitMode: 'fixed' }),
      ],
    },
  ],
};

const exactSingleLineBox = await generateCredentialPdfPackage({
  ...input,
  locale: 'en',
  values: {
    ...input.values,
    documentNumber: 'NITBS-C-2026-000001',
  },
  documents: [{
    ...input.documents[0],
    placements: [placement({
      fieldKey: 'document_number',
      widthPoints: 190,
      heightPoints: 14,
      fontSizePoints: 14,
      minFontSizePoints: 10,
      fontWeight: 400,
      textAlignment: 'left',
      fitMode: 'single_line',
    })],
  }],
});
assert.equal(exactSingleLineBox[0].pageCount, 1);

const outputs = await generateCredentialPdfPackage(input);
assert.equal(outputs.length, 2);
assert.deepEqual(outputs.map((item) => item.outputFilename), ['certificate.pdf', 'supplement.pdf']);
assert.deepEqual(outputs.map((item) => item.pageCount), [1, 2]);
assert.equal(outputs.filter((item) => item.isPrimary).length, 1);
for (const output of outputs) {
  assert.match(output.sha256, /^[0-9a-f]{64}$/);
  assert.equal(output.sizeBytes, output.bytes.length);
}

const primaryText = await extractedText(outputs[0].bytes);
const supplementText = await extractedText(outputs[1].bytes);
assert.match(primaryText, /Олена Коваленко/u);
assert.match(primaryText, /Řízení změn та інновацій/u);
assert.match(primaryText, /25 серпня 2026/u);
assert.match(supplementText, /Додаток до сертифіката/u);
assert.match(supplementText, /Dodatek k certifikátu/u);
assert.match(supplementText, /Осінь 2026/u);

const raster = await rasterPage(outputs[0].bytes, 1);
const decoded = jsQR(raster.data, raster.width, raster.height, { inversionAttempts: 'dontInvert' });
assert.equal(decoded?.data, verificationUrl);
const rotatedRaster = await rasterPage(outputs[1].bytes, 2);
const rotatedDecoded = jsQR(rotatedRaster.data, rotatedRaster.width, rotatedRaster.height, { inversionAttempts: 'dontInvert' });
assert.equal(rotatedDecoded?.data, verificationUrl);

const localeCases = [
  {
    locale: 'en',
    holderName: longHolderName,
    programmeTitle: longProgrammeTitle,
    expectedDate: /25 August 2026/u,
  },
  {
    locale: 'ua',
    holderName: 'Олександра-Марія Коваленко-Щаслива',
    programmeTitle: 'Міжнародне лідерство, нейропластичність та відповідальні інновації',
    expectedDate: /25 серпня 2026/u,
  },
  {
    locale: 'cz',
    holderName: 'Žaneta Šťastná-Řehořová Kovalenko',
    programmeTitle: 'Řízení mezinárodních změn, neuroplasticita a odpovědné inovace',
    expectedDate: /25 srpna 2026/u,
  },
];

for (const localeCase of localeCases) {
  const localized = await generateCredentialPdfPackage({
    ...input,
    locale: localeCase.locale,
    values: {
      ...input.values,
      holderName: localeCase.holderName,
      programmeTitle: localeCase.programmeTitle,
    },
    documents: [{
      ...input.documents[0],
      placements: [
        placement({ fieldKey: 'holder_name', yPoints: 108, fontSizePoints: 24, minFontSizePoints: 10 }),
        placement({
          fieldKey: 'programme_title', yPoints: 172, heightPoints: 72,
          fontSizePoints: 18, minFontSizePoints: 10, fontWeight: 500, fitMode: 'wrap',
        }),
        placement({
          fieldKey: 'issue_date', xPoints: 60, yPoints: 312, widthPoints: 340,
          heightPoints: 30, fontSizePoints: 13, minFontSizePoints: 9,
          fontWeight: 400, textAlignment: 'left', dateFormat: 'D MMMM YYYY',
        }),
        placement({
          fieldKey: 'verification_qr', xPoints: 690, yPoints: 390,
          widthPoints: 96, heightPoints: 96, fontFamily: null, fontSizePoints: null,
          minFontSizePoints: null, fontWeight: null, fontColor: null,
          textAlignment: 'left', fitMode: 'fixed',
        }),
      ],
    }],
  });
  const localizedText = await extractedText(localized[0].bytes);
  const normalizedLocalizedText = localizedText.replace(/\s+/gu, ' ').trim();
  assert.ok(normalizedLocalizedText.includes(localeCase.holderName));
  assert.ok(normalizedLocalizedText.includes(localeCase.programmeTitle));
  assert.match(localizedText, localeCase.expectedDate);
  const localizedQr = await rasterPage(localized[0].bytes, 1);
  assert.equal(jsQR(localizedQr.data, localizedQr.width, localizedQr.height, { inversionAttempts: 'dontInvert' })?.data, verificationUrl);
}

await assert.rejects(
  () => generateCredentialPdfPackage({ ...input, documents: input.documents.map((item) => ({ ...item, isPrimary: false })) }),
  expectGenerationError('invalid_package'),
);
await assert.rejects(
  () => generateCredentialPdfPackage({
    ...input,
    values: { ...input.values, completionDate: null },
    documents: [input.documents[1], { ...input.documents[0], sortOrder: 2 }],
  }),
  expectGenerationError('missing_required_value'),
);
await assert.rejects(
  () => generateCredentialPdfPackage({
    ...input,
    documents: [{
      ...input.documents[0],
      placements: [placement({ fieldKey: 'holder_name', widthPoints: 30, heightPoints: 10, fontSizePoints: 20, minFontSizePoints: 18 })],
    }],
  }),
  expectGenerationError('text_overflow'),
);
await assert.rejects(
  () => generateCredentialPdfPackage({
    ...input,
    values: { ...input.values, programmeTitle: 'X'.repeat(600) },
    documents: [{
      ...input.documents[0],
      placements: [placement({
        fieldKey: 'programme_title', widthPoints: 300, heightPoints: 60,
        fontSizePoints: 16, minFontSizePoints: 10, fitMode: 'wrap',
      })],
    }],
  }),
  expectGenerationError('text_overflow'),
);
await assert.rejects(
  () => generateCredentialPdfPackage({
    ...input,
    documents: [{
      ...input.documents[0],
      placements: [placement({ fieldKey: 'verification_qr', widthPoints: 50, heightPoints: 50, fontFamily: null, fontSizePoints: null, minFontSizePoints: null, fontWeight: null, fontColor: null, fitMode: 'fixed' })],
    }],
  }),
  expectGenerationError('invalid_qr'),
);
await assert.rejects(
  () => generateCredentialPdfPackage({
    ...input,
    documents: [{ ...input.documents[0], sourcePdf: new Uint8Array(Buffer.from('%PDF-1.7\nmalformed', 'ascii')) }],
  }),
  expectGenerationError('invalid_source_pdf'),
);

console.log('PDFGEN-004 generation tests passed.');
