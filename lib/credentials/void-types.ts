export type VoidPendingCredentialInput = {
  reason: string;
};

export type VoidPendingCredentialResult = {
  credentialId: string;
  status: 'voided';
  voidedAt: string;
  documentNumberStatus: 'voided';
};
