export type CredentialEmailSendStatus = 'pending' | 'sent' | 'failed' | 'skipped_empty_recipient' | 'not_configured';

export type CredentialActivationDraft = {
  recipientEmail: string;
  subject: string;
  body: string;
  templateLanguage: 'en' | 'ua';
  hasPrimaryPdf: boolean;
  fileCount: number;
};

export type CredentialEmailSendItem = {
  id: string;
  recipientEmail: string | null;
  subject: string;
  body: string;
  status: CredentialEmailSendStatus;
  technicalError: string | null;
  sentBy: string;
  sentAt: string;
  files: Array<{
    fileId: string;
    fileTypeId: string;
    fileType: string;
    filename: string;
    sizeBytes: number;
    isPrimary: boolean;
  }>;
};

export type ActivateCredentialInput = {
  recipientEmail: string | null;
  subject: string;
  body: string;
};

export type ActivateCredentialResult = {
  credentialId: string;
  status: 'valid';
  activatedAt: string;
  emailSendId: string;
  delivery: {
    status: CredentialEmailSendStatus;
    technicalError: string | null;
    resultRecorded: boolean;
  };
};
