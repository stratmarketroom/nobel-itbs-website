import type { TemplatePlacement } from './admin-types.ts';

export type CredentialPdfLocale = 'en' | 'ua' | 'cz';

export type CredentialPdfGenerationValues = {
  holderName: string;
  programmeTitle: string;
  credentialType: string;
  documentNumber: string;
  issueDate: string;
  completionDate: string | null;
  programmeRunLabel: string | null;
  verificationUrl: string;
};

export type CredentialPdfTemplateDocument = {
  templateDocumentId: string;
  fileTypeId: string;
  adminLabel: string;
  outputFilename: string;
  sortOrder: number;
  isPrimary: boolean;
  sourcePdf: Uint8Array;
  placements: TemplatePlacement[];
};

export type CredentialPdfPackageInput = {
  locale: CredentialPdfLocale;
  values: CredentialPdfGenerationValues;
  documents: CredentialPdfTemplateDocument[];
};

export type GeneratedCredentialPdf = {
  templateDocumentId: string;
  fileTypeId: string;
  adminLabel: string;
  outputFilename: string;
  sortOrder: number;
  isPrimary: boolean;
  pageCount: number;
  sizeBytes: number;
  sha256: string;
  bytes: Buffer;
};

export type CredentialPdfGenerationErrorCode =
  | 'invalid_package'
  | 'invalid_source_pdf'
  | 'invalid_placement'
  | 'missing_required_value'
  | 'unsupported_font'
  | 'text_overflow'
  | 'invalid_date'
  | 'invalid_qr'
  | 'unsafe_output';

export class CredentialPdfGenerationError extends Error {
  public readonly code: CredentialPdfGenerationErrorCode;

  constructor(
    code: CredentialPdfGenerationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CredentialPdfGenerationError';
    this.code = code;
  }
}
