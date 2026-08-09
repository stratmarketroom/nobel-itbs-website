export type CredentialFileAdminItem = {
  id: string;
  credentialId: string;
  fileTypeId: string;
  adminLabel: string | null;
  mimeType: 'application/pdf';
  sizeBytes: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CredentialFileTypeAdminItem = {
  id: string;
  code: string;
  defaultLabel: string;
};

export type PdfUploadInput = {
  bytes: Buffer;
  sizeBytes: number;
  fileTypeId: string | null;
  adminLabel: string | null;
  isPrimary: boolean;
  reason: string | null;
};

export type CredentialFilePatch = {
  fileTypeId?: string;
  adminLabel?: string | null;
  isPrimary?: boolean;
  reason?: string | null;
};
