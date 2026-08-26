export type CredentialGenerationTemplateOption = {
  templatePackageId: string;
  templateVersionId: string;
  displayName: string;
  variantCode: string;
  versionNumber: number;
  programmeRunId: string | null;
  documentCount: number;
  pageCount: number;
};

export type CurrentCredentialGenerationFile = {
  credentialFileId: string;
  templateDocumentId: string;
  adminLabel: string;
  outputFilename: string;
  pageCount: number;
  isPrimary: boolean;
};

export type CurrentCredentialGeneration = {
  templatePackageId: string;
  templateVersionId: string;
  templateDisplayName: string;
  variantCode: string;
  versionNumber: number;
  versionStatus: 'published' | 'retired';
  generationAttempt: number;
  generatedAt: string;
  files: CurrentCredentialGenerationFile[];
};

export type CredentialGenerationState = {
  eligible: boolean;
  blockedReason: string | null;
  options: CredentialGenerationTemplateOption[];
  current: CurrentCredentialGeneration | null;
};

export type GenerateCredentialResult = {
  templatePackageId: string;
  templateVersionId: string;
  generationAttempt: number;
  isRegeneration: boolean;
  fileCount: number;
  pageCount: number;
};
