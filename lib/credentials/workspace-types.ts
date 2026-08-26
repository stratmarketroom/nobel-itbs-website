import type { CredentialFileAdminItem, CredentialFileTypeAdminItem } from '@/lib/credentials/file-types';
import type { CredentialActivationDraft, CredentialEmailSendItem } from '@/lib/credentials/activation-types';
import type { CredentialResendDraft } from '@/lib/credentials/resend-types';
import type { CredentialGenerationState } from '@/lib/credentials/generation-types';

export type CredentialStatus = 'pending' | 'valid' | 'revoked' | 'voided';

export type CredentialAdminListItem = {
  id: string;
  credentialSetId: string;
  learnerId: string;
  learnerName: string;
  programmeId: string;
  programmeTitle: string;
  programmeRunId: string | null;
  credentialTypeId: string;
  credentialType: string;
  languageCode: 'en' | 'ua' | 'cz';
  status: CredentialStatus;
  issueDate: string;
  documentNumber: string;
  publicHolderName: string;
  publicProgrammeTitle: string;
  publicCredentialType: string;
  activatedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CredentialHistoryItem = {
  id: string;
  eventType: string;
  actorId: string | null;
  reason: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: string;
};

export type CredentialNoteItem = {
  id: string;
  authorId: string;
  body: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
};

export type CredentialAdminDetail = CredentialAdminListItem & {
  files: CredentialFileAdminItem[];
  fileTypes: CredentialFileTypeAdminItem[];
  history: CredentialHistoryItem[];
  notes: CredentialNoteItem[];
  emailSends: CredentialEmailSendItem[];
  activationDraft: CredentialActivationDraft | null;
  resendDraft: CredentialResendDraft | null;
  generation: CredentialGenerationState;
};

export type CredentialReferenceData = {
  learners: Array<{ id: string; name: string; archived: boolean }>;
  programmes: Array<{ id: string; title: string }>;
  programmeRuns: Array<{ id: string; programmeId: string; label: string }>;
  credentialTypes: Array<{ id: string; code: string; label: string; documentLetter: string }>;
  canUseManualNumber: boolean;
};

export type CredentialSetAdminItem = {
  id: string;
  learnerName: string;
  programmeTitle: string;
  programmeRunLabel: string | null;
  completionDate: string | null;
  credentialCount: number;
  createdAt: string;
};

export type DocumentNumberAdminItem = {
  id: string;
  documentNumber: string;
  sequenceValue: number;
  credentialId: string | null;
  credentialType: string;
  status: 'reserved' | 'issued' | 'voided';
  isManual: boolean;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
};
