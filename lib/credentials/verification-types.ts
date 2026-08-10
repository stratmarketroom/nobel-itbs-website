export type PublicCredentialDocument = {
  documentNumber: string;
  holderName: string;
  programmeTitle: string;
  credentialType: string;
  issueDate: string;
};

export type PublicCredentialVerification =
  | { result: 'valid'; publicStatus: 'Дійсний'; document: PublicCredentialDocument }
  | { result: 'revoked'; publicStatus: 'Відкликаний' }
  | { result: 'not_found'; message: 'За цим кодом/номером документ не знайдено.' };

export type PublicVerificationErrorCode =
  | 'invalid_request'
  | 'rate_limited'
  | 'temporary_error';
