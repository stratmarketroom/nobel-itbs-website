export type UpdateValidPublicDataInput = {
  publicHolderName: string;
  publicProgrammeTitle: string;
  publicCredentialType: string;
  reason: string;
};

export type UpdateValidPublicDataResult = {
  credentialId: string;
  status: 'valid';
  publicHolderName: string;
  publicProgrammeTitle: string;
  publicCredentialType: string;
  updatedAt: string;
};
