export type RevokeCredentialInput = {
  reason: string;
};

export type RevokeCredentialResult = {
  credentialId: string;
  status: 'revoked';
  revokedAt: string;
};
