export type CredentialTemplatePageMetadata = {
  pageNumber: number;
  widthPoints: number;
  heightPoints: number;
};

export type CredentialTemplateDocumentAdminItem = {
  id: string;
  templateVersionId: string;
  fileTypeId: string;
  adminLabel: string;
  outputFilenamePattern: string;
  sortOrder: number;
  isPrimary: boolean;
  mimeType: 'application/pdf';
  sizeBytes: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CredentialTemplatePdfUploadInput = {
  bytes: Buffer;
  sizeBytes: number;
  sourceSha256: string;
  pages: CredentialTemplatePageMetadata[];
  fileTypeId: string;
  adminLabel: string;
  outputFilenamePattern: string;
  sortOrder: number;
  isPrimary: boolean;
};
