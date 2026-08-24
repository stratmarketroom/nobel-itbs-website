import type { CredentialEmailSendStatus } from '@/lib/credentials/activation-types';

export type CredentialResendDraft = {
  recipientEmail: string;
  subject: string;
  body: string;
  templateLanguage: 'en' | 'ua';
  hasFiles: boolean;
  fileCount: number;
};

export type ResendCredentialInput = {
  recipientEmail: string | null;
  subject: string;
  body: string;
};

export type ResendCredentialResult = {
  credentialId: string;
  status: 'valid';
  emailSendId: string;
  delivery: {
    status: CredentialEmailSendStatus;
    technicalError: string | null;
    resultRecorded: boolean;
  };
};
