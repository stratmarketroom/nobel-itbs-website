export type LearnerEmail = {
  id: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LearnerPhone = {
  id: string;
  phone: string;
  hasTelegram: boolean;
  telegramUsername: string | null;
  hasViber: boolean;
  hasWhatsapp: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LearnerCredentialSummary = {
  id: string;
  documentNumber: string;
  status: 'pending' | 'valid' | 'revoked' | 'voided';
  issueDate: string;
  programmeTitle: string;
  credentialType: string;
  createdAt: string;
};

export type LearnerAdminItem = {
  id: string;
  latinFirstName: string;
  latinLastName: string;
  ukrainianFullName: string;
  internalNote: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  emails: LearnerEmail[];
  phones: LearnerPhone[];
  credentials: LearnerCredentialSummary[];
};

export type LearnerConflictReference = {
  id: string;
  displayName: string;
};
