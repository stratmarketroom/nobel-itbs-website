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
  credentials: [];
};

export type LearnerConflictReference = {
  id: string;
  displayName: string;
};
