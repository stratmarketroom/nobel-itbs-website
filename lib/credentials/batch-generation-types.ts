export type CredentialGenerationBatchStatus =
  | 'draft'
  | 'confirmed'
  | 'processing'
  | 'review'
  | 'activating'
  | 'completed'
  | 'failed';

export type CredentialGenerationItemStatus =
  | 'queued'
  | 'processing'
  | 'generated'
  | 'retryable'
  | 'conflict'
  | 'reviewed'
  | 'activating'
  | 'activated'
  | 'failed';

export type CredentialBatchActivationRequestStatus = 'processing' | 'completed' | 'partial';

export type CredentialBatchActivationItemStatus =
  | 'queued'
  | 'processing'
  | 'activation_failed'
  | 'delivery_retryable'
  | 'activated_sent'
  | 'activated_not_sent';

export type BatchIssuingContextInput = {
  idempotencyKey: string;
  templateVersionId: string;
  programmeId: string;
  programmeRunId: string | null;
  credentialTypeId: string;
  languageCode: 'en' | 'ua' | 'cz';
  issueDate: string;
  completionDate: string | null;
  learnerIds: string[];
};

export type BatchPreviewLearner = {
  learnerId: string;
  learnerName: string;
  position: number;
  outcome: 'accepted' | 'conflict' | 'archived';
  conflictingCredentialId: string | null;
  conflictingDocumentNumber: string | null;
};

export type BatchPreview = {
  context: BatchContextSummary;
  selectedCount: number;
  acceptedCount: number;
  conflictCount: number;
  archivedCount: number;
  learners: BatchPreviewLearner[];
};

export type BatchContextSummary = {
  templateVersionId: string;
  templateDisplayName: string;
  templateVersionNumber: number;
  templateDocumentCount: number;
  templatePageCount: number;
  programmeId: string;
  programmeTitle: string;
  programmeRunId: string | null;
  programmeRunLabel: string | null;
  credentialTypeId: string;
  credentialType: string;
  languageCode: 'en' | 'ua' | 'cz';
  issueDate: string;
  completionDate: string | null;
};

export type BatchListItem = {
  id: string;
  status: CredentialGenerationBatchStatus;
  context: BatchContextSummary;
  totalCount: number;
  generatedCount: number;
  reviewedCount: number;
  conflictCount: number;
  retryableCount: number;
  pendingCount: number;
  activatedCount: number;
  createdAt: string;
  confirmedAt: string | null;
};

export type BatchReviewFile = {
  id: string;
  adminLabel: string;
  pageCount: number;
  isPrimary: boolean;
};

export type BatchReviewItem = {
  id: string;
  learnerId: string;
  learnerName: string;
  position: number;
  credentialId: string | null;
  conflictingCredentialId: string | null;
  documentNumber: string | null;
  status: CredentialGenerationItemStatus;
  attemptCount: number;
  lastErrorCode: string | null;
  generatedAt: string | null;
  reviewedAt: string | null;
  files: BatchReviewFile[];
  activationEligible: boolean;
  activation: null | {
    id: string;
    requestId: string;
    requestStatus: CredentialBatchActivationRequestStatus;
    status: CredentialBatchActivationItemStatus;
    attemptCount: number;
    lastErrorCode: string | null;
    emailSendId: string | null;
    deliveryStatus: CredentialEmailSendStatus | null;
  };
};

export type BatchDetail = BatchListItem & {
  processingChunkSize: number;
  startedAt: string | null;
  finishedAt: string | null;
  items: BatchReviewItem[];
  activationSentCount: number;
  activationNotSentCount: number;
  activationFailedCount: number;
  activationPendingCount: number;
};

export type BatchReferenceData = {
  learners: Array<{ id: string; name: string; archived: boolean }>;
  programmes: Array<{ id: string; title: string }>;
  programmeRuns: Array<{ id: string; programmeId: string; label: string }>;
  credentialTypes: Array<{ id: string; label: string }>;
  templates: Array<{
    templateVersionId: string;
    programmeId: string;
    programmeRunId: string | null;
    credentialTypeId: string;
    languageCode: 'en' | 'ua' | 'cz';
    displayName: string;
    versionNumber: number;
    documentCount: number;
    pageCount: number;
  }>;
};

export type BatchChunkResult = {
  processedCount: number;
  generatedCount: number;
  retryableCount: number;
  skippedCount: number;
  hasMore: boolean;
  batch: BatchDetail;
};

export type BatchActivationInput = {
  idempotencyKey: string;
  itemIds: string[];
};

export type BatchReviewInput = {
  itemIds: string[];
};

export type BatchReviewResult = {
  reviewedCount: number;
  failedCount: number;
  batch: BatchDetail;
};

export type BatchActivationChunkResult = {
  activationRequestId: string;
  processedCount: number;
  activatedSentCount: number;
  activatedNotSentCount: number;
  failedCount: number;
  retryableDeliveryCount: number;
  skippedCount: number;
  hasMore: boolean;
  batch: BatchDetail;
};
import type { CredentialEmailSendStatus } from '@/lib/credentials/activation-types';
