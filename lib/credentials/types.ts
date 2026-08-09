export type PendingCredentialAdminItem = {
  id: string;
  credentialSetId: string;
  documentNumber: string;
  status: 'pending';
  languageCode: 'en' | 'ua' | 'cz';
  issueDate: string;
  publicHolderName: string;
  publicProgrammeTitle: string;
  publicCredentialType: string;
  createdAt: string;
  verificationUrl: string;
};

export type CreatePendingCredentialInput = {
  learnerId: string;
  programmeId: string;
  programmeRunId: string | null;
  completionDate: string | null;
  credentialTypeId: string;
  languageCode: 'en' | 'ua' | 'cz';
  issueDate: string;
  publicHolderName: string;
  publicProgrammeTitle: string;
  publicCredentialType: string;
  manualDocumentNumber: string | null;
  manualReason: string | null;
};
