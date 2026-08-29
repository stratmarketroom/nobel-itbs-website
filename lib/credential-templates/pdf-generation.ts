import fontkit, { type Font as FontkitFont } from '@pdf-lib/fontkit';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import type { TemplateFieldKey, TemplatePlacement } from './admin-types.ts';
import { TemplatePdfValidationError, validateTemplatePdf } from './pdf-validation.ts';
import {
  CredentialPdfGenerationError,
  type CredentialPdfGenerationValues,
  type CredentialPdfPackageInput,
  type CredentialPdfTemplateDocument,
  type GeneratedCredentialPdf,
} from './pdf-generation-types.ts';

const maximumPdfBytes = 20 * 1024 * 1024;
const maximumPlacementsPerDocument = 250;
const minimumQrPoints = 72;
const qrRasterPixels = 1024;
const supportedFontFamily = 'noto_sans';
const supportedWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
type SupportedWeight = (typeof supportedWeights)[number];

const fontFileByWeight: Record<SupportedWeight, string> = {
  100: 'NotoSans-Thin.ttf',
  200: 'NotoSans-ExtraLight.ttf',
  300: 'NotoSans-Light.ttf',
  400: 'NotoSans-Regular.ttf',
  500: 'NotoSans-Medium.ttf',
  600: 'NotoSans-SemiBold.ttf',
  700: 'NotoSans-Bold.ttf',
  800: 'NotoSans-ExtraBold.ttf',
  900: 'NotoSans-Black.ttf',
};

const monthNames = {
  en: {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  ua: {
    short: ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'вер.', 'жовт.', 'лист.', 'груд.'],
    long: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
  },
  cz: {
    short: ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'],
    long: ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'],
  },
} as const;

type FontResource = { bytes: Uint8Array; metrics: FontkitFont };
type RenderFont = { pdf: PDFFont; metrics: FontkitFont };

let fontResourcesCache: Promise<Map<SupportedWeight, FontResource>> | undefined;

function failure(
  code: ConstructorParameters<typeof CredentialPdfGenerationError>[0],
  message: string,
): CredentialPdfGenerationError {
  return new CredentialPdfGenerationError(code, message);
}

function reportUnexpectedValidationFailure(error: unknown): void {
  const diagnostic = error instanceof TemplatePdfValidationError ? error.cause : error;
  if (!diagnostic) return;

  const name = diagnostic instanceof Error ? diagnostic.name : 'UnknownError';
  const message = diagnostic instanceof Error ? diagnostic.message : 'Non-error validation failure';
  const safeName = name.replace(/[^A-Za-z0-9_.-]/gu, '').slice(0, 64) || 'UnknownError';
  const safeMessage = message
    .replace(/https?:\/\/\S+/giu, '[redacted-url]')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/giu, '[redacted-id]')
    .replace(/[\r\n\t\0-\x1f\x7f]+/gu, ' ')
    .slice(0, 240);

  console.error('credential_template_pdf_validation_failed', { name: safeName, message: safeMessage });
}

function loadFontResources(): Promise<Map<SupportedWeight, FontResource>> {
  fontResourcesCache ??= Promise.all(supportedWeights.map(async (weight) => {
    const path = join(process.cwd(), 'node_modules', 'notosans-fontface', 'fonts', fontFileByWeight[weight]);
    const bytes = new Uint8Array(await readFile(path));
    return [weight, { bytes, metrics: fontkit.create(bytes) }] as const;
  })).then((items) => new Map(items));
  return fontResourcesCache;
}

function isSupportedWeight(value: number | null): value is SupportedWeight {
  return supportedWeights.includes(value as SupportedWeight);
}

function normalizedRotation(page: PDFPage): 0 | 90 | 180 | 270 {
  const value = ((page.getRotation().angle % 360) + 360) % 360;
  if (value === 0 || value === 90 || value === 180 || value === 270) return value;
  throw failure('invalid_source_pdf', 'Template page rotation is unsupported.');
}

function displaySize(page: PDFPage): { width: number; height: number; rotation: 0 | 90 | 180 | 270 } {
  const rotation = normalizedRotation(page);
  const width = page.getWidth();
  const height = page.getHeight();
  return rotation === 90 || rotation === 270
    ? { width: height, height: width, rotation }
    : { width, height, rotation };
}

function displayPointToPage(
  page: PDFPage,
  displayX: number,
  displayY: number,
): { x: number; y: number; rotate: ReturnType<typeof degrees> } {
  const rotation = normalizedRotation(page);
  if (rotation === 90) return { x: page.getWidth() - displayY, y: displayX, rotate: degrees(90) };
  if (rotation === 180) return { x: page.getWidth() - displayX, y: page.getHeight() - displayY, rotate: degrees(-180) };
  if (rotation === 270) return { x: displayY, y: page.getHeight() - displayX, rotate: degrees(-90) };
  return { x: displayX, y: displayY, rotate: degrees(0) };
}

function cleanText(value: string, fieldKey: TemplateFieldKey): string {
  const normalized = value.normalize('NFC').trim();
  if (!normalized) return '';
  if (normalized.length > 4_000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(normalized)) {
    throw failure('invalid_placement', `${fieldKey} contains unsupported text content.`);
  }
  return normalized;
}

function parseIsoDate(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw failure('invalid_date', 'Credential date must use YYYY-MM-DD.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw failure('invalid_date', 'Credential date is invalid.');
  }
  return { year, month, day };
}

function formatDate(value: string, format: string | null, locale: CredentialPdfPackageInput['locale']): string {
  const { year, month, day } = parseIsoDate(value);
  const pattern = format ?? 'DD.MM.YYYY';
  const remainder = pattern.replace(/YYYY|MMMM|MMM|YY|MM|DD|M|D/g, '');
  if (!pattern || pattern.length > 64 || /[^\s.,/\-]/u.test(remainder)) {
    throw failure('invalid_date', 'Template date format is unsupported.');
  }
  const names = monthNames[locale];
  const tokenValues: Record<string, string> = {
    YYYY: String(year),
    YY: String(year).slice(-2),
    MMMM: names.long[month - 1],
    MMM: names.short[month - 1],
    MM: String(month).padStart(2, '0'),
    M: String(month),
    DD: String(day).padStart(2, '0'),
    D: String(day),
  };
  return pattern.replace(/YYYY|MMMM|MMM|YY|MM|DD|M|D/g, (token) => tokenValues[token]);
}

function fieldValue(
  placement: TemplatePlacement,
  values: CredentialPdfGenerationValues,
  locale: CredentialPdfPackageInput['locale'],
): string {
  const direct: Partial<Record<TemplateFieldKey, string | null>> = {
    holder_name: values.holderName,
    programme_title: values.programmeTitle,
    credential_type: values.credentialType,
    document_number: values.documentNumber,
    issue_date: values.issueDate,
    completion_date: values.completionDate,
    programme_run_label: values.programmeRunLabel,
    verification_url: values.verificationUrl,
    static_text: placement.staticText,
  };
  const raw = direct[placement.fieldKey];
  if (!raw) {
    if (placement.isRequired) throw failure('missing_required_value', `Required ${placement.fieldKey} value is missing.`);
    return '';
  }
  if (placement.fieldKey === 'issue_date' || placement.fieldKey === 'completion_date') {
    return formatDate(raw, placement.dateFormat, locale);
  }
  return cleanText(raw, placement.fieldKey);
}

function validateVerificationUrl(value: string): string {
  if (value.length > 2_048) throw failure('invalid_qr', 'Verification URL is too long.');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw failure('invalid_qr', 'Verification URL must be an absolute HTTPS URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw failure('invalid_qr', 'Verification URL must be an absolute HTTPS URL without credentials or a fragment.');
  }
  return url.toString();
}

function validatePlacement(placement: TemplatePlacement, page: PDFPage): void {
  const size = displaySize(page);
  const geometry = [placement.xPoints, placement.yPoints, placement.widthPoints, placement.heightPoints];
  if (
    !geometry.every(Number.isFinite)
    || placement.xPoints < 0
    || placement.yPoints < 0
    || placement.widthPoints <= 0
    || placement.heightPoints <= 0
    || placement.xPoints + placement.widthPoints > size.width + 0.01
    || placement.yPoints + placement.heightPoints > size.height + 0.01
  ) {
    throw failure('invalid_placement', 'Template placement is outside its PDF page bounds.');
  }
  if (placement.fieldKey === 'verification_qr') {
    if (placement.fitMode !== 'fixed' || Math.min(placement.widthPoints, placement.heightPoints) < minimumQrPoints) {
      throw failure('invalid_qr', `Verification QR placement must be at least ${minimumQrPoints} points square.`);
    }
    return;
  }
  if (
    placement.fontFamily !== supportedFontFamily
    || !isSupportedWeight(placement.fontWeight)
    || !placement.fontSizePoints
    || !placement.minFontSizePoints
    || placement.minFontSizePoints > placement.fontSizePoints
    || placement.fitMode === 'fixed'
    || !/^#[0-9A-Fa-f]{6}$/u.test(placement.fontColor ?? '')
  ) {
    throw failure('unsupported_font', 'Template text placement uses unsupported font settings.');
  }
}

function colour(value: string): ReturnType<typeof rgb> {
  return rgb(
    Number.parseInt(value.slice(1, 3), 16) / 255,
    Number.parseInt(value.slice(3, 5), 16) / 255,
    Number.parseInt(value.slice(5, 7), 16) / 255,
  );
}

function textWidth(font: RenderFont, value: string, size: number): number {
  try {
    return font.pdf.widthOfTextAtSize(value, size);
  } catch {
    throw failure('unsupported_font', 'Dynamic text contains a glyph unavailable in the approved embedded font.');
  }
}

function textVerticalBounds(font: RenderFont, value: string, size: number): { minY: number; maxY: number; height: number } {
  try {
    const run = font.metrics.layout(value);
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;
    run.glyphs.forEach((glyph, index) => {
      const offset = run.positions[index]?.yOffset ?? 0;
      minimum = Math.min(minimum, glyph.bbox.minY + offset);
      maximum = Math.max(maximum, glyph.bbox.maxY + offset);
    });
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || font.metrics.unitsPerEm <= 0) {
      throw new Error('Invalid font metrics.');
    }
    const scale = size / font.metrics.unitsPerEm;
    const minY = minimum * scale;
    const maxY = maximum * scale;
    return { minY, maxY, height: maxY - minY };
  } catch {
    throw failure('unsupported_font', 'Dynamic text contains a glyph unavailable in the approved embedded font.');
  }
}

function wrappedLines(font: RenderFont, value: string, size: number, maximumWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.split(/\r?\n/u)) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of paragraph.trim().split(/\s+/u)) {
      if (textWidth(font, word, size) > maximumWidth + 0.01) {
        throw failure('text_overflow', 'Dynamic text contains a word that cannot fit in its configured box.');
      }
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(font, candidate, size) <= maximumWidth + 0.01) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function singleLineLayout(font: RenderFont, value: string, placement: TemplatePlacement): { lines: string[]; size: number } {
  if (/\r|\n/u.test(value)) throw failure('text_overflow', 'Single-line dynamic text contains a line break.');
  const configuredSize = placement.fontSizePoints as number;
  const minimumSize = placement.minFontSizePoints as number;
  if (placement.fitMode === 'single_line') {
    if (
      textWidth(font, value, configuredSize) > placement.widthPoints + 0.01
      || textVerticalBounds(font, value, configuredSize).height > placement.heightPoints + 0.01
    ) {
      throw failure('text_overflow', 'Dynamic text does not fit its configured single-line box.');
    }
    return { lines: [value], size: configuredSize };
  }
  for (let size = configuredSize; size >= minimumSize - 0.001; size = Math.max(minimumSize, size - 0.25)) {
    if (
      textWidth(font, value, size) <= placement.widthPoints + 0.01
      && textVerticalBounds(font, value, size).height <= placement.heightPoints + 0.01
    ) {
      return { lines: [value], size };
    }
    if (size === minimumSize) break;
  }
  throw failure('text_overflow', 'Dynamic text cannot fit above the configured minimum font size.');
}

function textLayout(font: RenderFont, value: string, placement: TemplatePlacement): { lines: string[]; size: number } {
  if (placement.fitMode !== 'wrap') return singleLineLayout(font, value, placement);
  const size = placement.fontSizePoints as number;
  const lines = wrappedLines(font, value, size, placement.widthPoints);
  const lineHeight = size * 1.2;
  if (lines.length * lineHeight > placement.heightPoints + 0.01) {
    throw failure('text_overflow', 'Wrapped dynamic text exceeds its configured box height.');
  }
  return { lines, size };
}

function drawTextPlacement(page: PDFPage, placement: TemplatePlacement, font: RenderFont, value: string): void {
  const layout = textLayout(font, value, placement);
  const { height: displayHeight } = displaySize(page);
  const lineHeight = layout.size * 1.2;
  const bounds = placement.fitMode === 'wrap' ? null : textVerticalBounds(font, value, layout.size);
  const totalHeight = placement.fitMode === 'wrap'
    ? layout.lines.length * lineHeight
    : (bounds as { height: number }).height;
  const ascent = font.pdf.heightAtSize(layout.size, { descender: false });
  const boxBottom = displayHeight - placement.yPoints - placement.heightPoints;
  const blockBottom = placement.fitMode === 'wrap'
    ? boxBottom + placement.heightPoints - totalHeight
    : boxBottom + (placement.heightPoints - totalHeight) / 2;
  const firstBaseline = placement.fitMode === 'wrap'
    ? blockBottom + totalHeight - ascent
    : blockBottom - (bounds as { minY: number }).minY;

  layout.lines.forEach((line, index) => {
    const width = textWidth(font, line, layout.size);
    const displayX = placement.textAlignment === 'center'
      ? placement.xPoints + (placement.widthPoints - width) / 2
      : placement.textAlignment === 'right'
        ? placement.xPoints + placement.widthPoints - width
        : placement.xPoints;
    const displayY = firstBaseline - index * lineHeight;
    const point = displayPointToPage(page, displayX, displayY);
    page.drawText(line, {
      x: point.x,
      y: point.y,
      size: layout.size,
      font: font.pdf,
      color: colour(placement.fontColor as string),
      rotate: point.rotate,
    });
  });
}

async function qrPng(value: string): Promise<Buffer> {
  try {
    return await QRCode.toBuffer(value, {
      type: 'png',
      errorCorrectionLevel: 'Q',
      margin: 4,
      width: qrRasterPixels,
      color: { dark: '#000000FF', light: '#FFFFFFFF' },
    });
  } catch {
    throw failure('invalid_qr', 'Verification QR could not be generated safely.');
  }
}

async function renderDocument(
  template: CredentialPdfTemplateDocument,
  values: CredentialPdfGenerationValues,
  locale: CredentialPdfPackageInput['locale'],
  fontResources: Map<SupportedWeight, FontResource>,
): Promise<GeneratedCredentialPdf> {
  const source = Buffer.from(template.sourcePdf);
  if (source.length < 1 || source.length > maximumPdfBytes) {
    throw failure('invalid_source_pdf', 'Template source PDF must be between 1 byte and 20 MB.');
  }
  if (template.placements.length > maximumPlacementsPerDocument) {
    throw failure('invalid_placement', 'Template document has too many field placements.');
  }

  let sourceMetadata;
  try {
    sourceMetadata = await validateTemplatePdf(source);
  } catch (error) {
    reportUnexpectedValidationFailure(error);
    throw failure('invalid_source_pdf', 'Template source PDF is malformed or unsafe.');
  }

  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(source, { ignoreEncryption: false, throwOnInvalidObject: true, updateMetadata: false });
  } catch {
    throw failure('invalid_source_pdf', 'Template source PDF could not be loaded.');
  }
  if (pdf.isEncrypted || pdf.getPageCount() !== sourceMetadata.pageCount) {
    throw failure('invalid_source_pdf', 'Template source PDF page structure is invalid.');
  }
  pdf.registerFontkit(fontkit);
  pdf.setCreator('Nobel ITBS Credential Generation');
  pdf.setProducer('Nobel ITBS Credential Generation');

  const fonts = new Map<SupportedWeight, RenderFont>();
  const getFont = async (weight: SupportedWeight): Promise<RenderFont> => {
    const existing = fonts.get(weight);
    if (existing) return existing;
    const resource = fontResources.get(weight);
    if (!resource) throw failure('unsupported_font', 'Approved embedded font is unavailable.');
    const embedded = { pdf: await pdf.embedFont(resource.bytes, { subset: true }), metrics: resource.metrics };
    fonts.set(weight, embedded);
    return embedded;
  };

  const verifiedUrl = validateVerificationUrl(values.verificationUrl);
  const renderValues = { ...values, verificationUrl: verifiedUrl };
  let embeddedQr: Awaited<ReturnType<PDFDocument['embedPng']>> | undefined;
  const placements = [...template.placements].sort((a, b) => (
    a.pageNumber - b.pageNumber || a.occurrenceOrder - b.occurrenceOrder || a.fieldKey.localeCompare(b.fieldKey)
  ));
  for (const placement of placements) {
    const page = pdf.getPages()[placement.pageNumber - 1];
    if (!page) throw failure('invalid_placement', 'Template placement references a missing PDF page.');
    validatePlacement(placement, page);
    if (placement.fieldKey === 'verification_qr') {
      embeddedQr ??= await pdf.embedPng(await qrPng(verifiedUrl));
      const square = Math.min(placement.widthPoints, placement.heightPoints);
      const displayX = placement.xPoints + (placement.widthPoints - square) / 2;
      const displayY = displaySize(page).height - placement.yPoints - placement.heightPoints
        + (placement.heightPoints - square) / 2;
      const point = displayPointToPage(page, displayX, displayY);
      page.drawImage(embeddedQr, { x: point.x, y: point.y, width: square, height: square, rotate: point.rotate });
      continue;
    }
    const value = fieldValue(placement, renderValues, locale);
    if (!value) continue;
    drawTextPlacement(page, placement, await getFont(placement.fontWeight as SupportedWeight), value);
  }

  const bytes = Buffer.from(await pdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 }));
  if (bytes.length > maximumPdfBytes) throw failure('unsafe_output', 'Generated PDF exceeds the private credential file size limit.');
  let outputMetadata;
  try {
    outputMetadata = await validateTemplatePdf(bytes);
  } catch {
    throw failure('unsafe_output', 'Generated PDF failed the safe output validation.');
  }
  if (outputMetadata.pageCount !== sourceMetadata.pageCount) {
    throw failure('unsafe_output', 'Generated PDF page count changed unexpectedly.');
  }
  if (outputMetadata.pages.some((page, index) => (
    Math.abs(page.widthPoints - sourceMetadata.pages[index].widthPoints) > 0.01
    || Math.abs(page.heightPoints - sourceMetadata.pages[index].heightPoints) > 0.01
  ))) {
    throw failure('unsafe_output', 'Generated PDF page dimensions or orientation changed unexpectedly.');
  }
  return {
    templateDocumentId: template.templateDocumentId,
    fileTypeId: template.fileTypeId,
    adminLabel: template.adminLabel,
    outputFilename: template.outputFilename,
    sortOrder: template.sortOrder,
    isPrimary: template.isPrimary,
    pageCount: outputMetadata.pageCount,
    sizeBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes,
  };
}

function validatePackage(input: CredentialPdfPackageInput): CredentialPdfTemplateDocument[] {
  if (!['en', 'ua', 'cz'].includes(input.locale) || !Array.isArray(input.documents) || input.documents.length < 1) {
    throw failure('invalid_package', 'Credential PDF package input is invalid.');
  }
  if (input.documents.filter((document) => document.isPrimary).length !== 1) {
    throw failure('invalid_package', 'Credential PDF package must contain exactly one primary document.');
  }
  const ids = new Set<string>();
  const filenames = new Set<string>();
  const sortOrders = new Set<number>();
  for (const document of input.documents) {
    const filename = document.outputFilename.trim();
    if (
      !document.templateDocumentId
      || !document.fileTypeId
      || !document.adminLabel.trim()
      || document.adminLabel.trim().length > 255
      || !Number.isSafeInteger(document.sortOrder)
      || document.sortOrder < 0
      || !filename
      || filename.length > 255
      || !filename.toLowerCase().endsWith('.pdf')
      || /[\r\n/\\]/u.test(filename)
    ) {
      throw failure('invalid_package', 'Credential PDF template document metadata is invalid.');
    }
    if (ids.has(document.templateDocumentId) || filenames.has(filename.toLocaleLowerCase('en-US')) || sortOrders.has(document.sortOrder)) {
      throw failure('invalid_package', 'Credential PDF package contains duplicate document metadata.');
    }
    ids.add(document.templateDocumentId);
    filenames.add(filename.toLocaleLowerCase('en-US'));
    sortOrders.add(document.sortOrder);
  }
  return [...input.documents].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function generateCredentialPdfPackage(
  input: CredentialPdfPackageInput,
): Promise<GeneratedCredentialPdf[]> {
  const documents = validatePackage(input);
  const fontResources = await loadFontResources();
  const outputs: GeneratedCredentialPdf[] = [];
  for (const document of documents) {
    outputs.push(await renderDocument(document, input.values, input.locale, fontResources));
  }
  return outputs;
}
