import { createHash } from 'node:crypto';
import type { CredentialTemplatePageMetadata } from './types.ts';

const forbiddenPdfNames = new Set([
  'AA',
  'AcroForm',
  'Collection',
  'EmbeddedFiles',
  'Encrypt',
  'Filespec',
  'GoToR',
  'ImportData',
  'JavaScript',
  'JS',
  'Launch',
  'Movie',
  'OpenAction',
  'Rendition',
  'RichMedia',
  'Sound',
  'SubmitForm',
  'URI',
  'XFA',
  '3D',
]);

export class TemplatePdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplatePdfValidationError';
  }
}

export type ValidatedTemplatePdf = {
  sourceSha256: string;
  pageCount: number;
  pages: CredentialTemplatePageMetadata[];
};

function decodePdfName(value: string): string {
  return value.replace(/#([0-9a-f]{2})/gi, (_match, hex: string) => (
    String.fromCharCode(Number.parseInt(hex, 16))
  ));
}

function pdfSyntaxOutsideStreamsAndStrings(source: string): string {
  let result = '';
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (character === '%') {
      while (index < source.length && source[index] !== '\n' && source[index] !== '\r') index += 1;
      result += '\n';
      continue;
    }

    if (character === '(') {
      let depth = 1;
      index += 1;
      while (index < source.length && depth > 0) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === '(') depth += 1;
        if (source[index] === ')') depth -= 1;
        index += 1;
      }
      result += ' ';
      continue;
    }

    if (source.startsWith('<<', index) || source.startsWith('>>', index)) {
      result += source.slice(index, index + 2);
      index += 2;
      continue;
    }

    if (character === '<') {
      index = source.indexOf('>', index + 1);
      if (index === -1) break;
      index += 1;
      result += ' ';
      continue;
    }

    if (
      source.startsWith('stream', index)
      && /[\s\r\n]/.test(source[index - 1] ?? ' ')
      && /[\r\n]/.test(source[index + 6] ?? '')
    ) {
      const endStream = source.indexOf('endstream', index + 6);
      if (endStream === -1) break;
      index = endStream + 'endstream'.length;
      result += ' ';
      continue;
    }

    result += character;
    index += 1;
  }

  return result;
}

function assertNoForbiddenPdfNames(bytes: Buffer): void {
  const source = pdfSyntaxOutsideStreamsAndStrings(bytes.toString('latin1'));
  const names = source.matchAll(/\/([A-Za-z0-9#]+)/g);

  for (const match of names) {
    const name = decodePdfName(match[1] ?? '');
    if (forbiddenPdfNames.has(name)) {
      throw new TemplatePdfValidationError(`PDF contains unsupported active or external content (${name}).`);
    }
  }
}

function hasEntries(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && Object.keys(value).length > 0);
}

function outlineHasExternalTarget(items: unknown): boolean {
  if (!Array.isArray(items)) return false;

  return items.some((item) => {
    if (!item || typeof item !== 'object') return false;
    const node = item as { url?: unknown; unsafeUrl?: unknown; items?: unknown };
    return Boolean(node.url || node.unsafeUrl || outlineHasExternalTarget(node.items));
  });
}

function roundedPoints(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export async function validateTemplatePdf(bytes: Buffer): Promise<ValidatedTemplatePdf> {
  if (!bytes.subarray(0, Math.min(bytes.length, 1024)).includes(Buffer.from('%PDF-', 'ascii'))) {
    throw new TemplatePdfValidationError('The uploaded file is not a valid PDF.');
  }

  assertNoForbiddenPdfNames(bytes);

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    enableXfa: false,
    isImageDecoderSupported: false,
    isOffscreenCanvasSupported: false,
    maxImageSize: 25_000_000,
    stopAtErrors: true,
    useSystemFonts: false,
    useWasm: false,
    useWorkerFetch: false,
    verbosity: 0,
  });

  let passwordRequested = false;
  loadingTask.onPassword = () => {
    passwordRequested = true;
    void loadingTask.destroy();
  };

  try {
    const document = await loadingTask.promise;

    if (passwordRequested || document.isPureXfa) {
      throw new TemplatePdfValidationError('Encrypted or XFA PDFs are not accepted.');
    }

    const [attachments, documentActions, openAction, outline, fields, calculationOrder] = await Promise.all([
      document.getAttachments(),
      document.getJSActions(),
      document.getOpenAction(),
      document.getOutline(),
      document.getFieldObjects(),
      document.getCalculationOrderIds(),
    ]);

    if (
      (attachments && attachments.size > 0)
      || hasEntries(documentActions)
      || openAction
      || outlineHasExternalTarget(outline)
      || hasEntries(fields)
      || (calculationOrder && calculationOrder.length > 0)
    ) {
      throw new TemplatePdfValidationError('PDF contains unsupported forms, actions, attachments, or external content.');
    }

    if (!Number.isSafeInteger(document.numPages) || document.numPages < 1) {
      throw new TemplatePdfValidationError('PDF must contain at least one readable page.');
    }

    const pages: CredentialTemplatePageMetadata[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const [annotations, pageActions] = await Promise.all([
        page.getAnnotations({ intent: 'display' }),
        page.getJSActions(),
        page.getOperatorList({ intent: 'display' }),
      ]);

      if (annotations.length > 0 || hasEntries(pageActions)) {
        throw new TemplatePdfValidationError('PDF page contains unsupported annotations or actions.');
      }

      const viewport = page.getViewport({ scale: 1 });
      if (
        !Number.isFinite(viewport.width)
        || !Number.isFinite(viewport.height)
        || viewport.width <= 0
        || viewport.height <= 0
      ) {
        throw new TemplatePdfValidationError('PDF page dimensions are invalid.');
      }

      pages.push({
        pageNumber,
        widthPoints: roundedPoints(viewport.width),
        heightPoints: roundedPoints(viewport.height),
      });
      page.cleanup();
    }

    return {
      sourceSha256: createHash('sha256').update(bytes).digest('hex'),
      pageCount: document.numPages,
      pages,
    };
  } catch (error) {
    if (error instanceof TemplatePdfValidationError) throw error;
    if (passwordRequested || error instanceof pdfjs.PasswordException) {
      throw new TemplatePdfValidationError('Encrypted PDFs are not accepted.');
    }
    throw new TemplatePdfValidationError('PDF is malformed or uses unsupported content.');
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
}
