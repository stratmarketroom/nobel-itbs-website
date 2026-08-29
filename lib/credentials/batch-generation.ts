import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateCredentialBatchItem } from '@/lib/credentials/generation';
import {
  activateCredential,
  deliverCredentialEmailSend,
  getCredentialActivationDraft,
} from '@/lib/credentials/activation';
import type {
  BatchActivationChunkResult,
  BatchActivationInput,
  BatchChunkResult,
  BatchContextSummary,
  BatchDetail,
  BatchIssuingContextInput,
  BatchListItem,
  BatchPreview,
  BatchReferenceData,
  BatchReviewItem,
  BatchReviewResult,
  CredentialGenerationBatchStatus,
  CredentialGenerationItemStatus,
} from '@/lib/credentials/batch-generation-types';
import type { CredentialEmailSendStatus } from '@/lib/credentials/activation-types';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import { collectPaginatedRows } from '@/lib/credentials/pagination';
import { collectChunkedRows } from '@/lib/credentials/chunking';

type BatchRow = {
  id: string; template_version_id: string; programme_id: string; programme_run_id: string | null;
  credential_type_id: string; language_code: 'en' | 'ua' | 'cz'; issue_date: string;
  completion_date: string | null; status: CredentialGenerationBatchStatus; processing_chunk_size: number;
  activation_blocked: boolean; activation_block_reason: 'synthetic_qa' | null;
  confirmed_at: string | null; started_at: string | null; finished_at: string | null; created_at: string;
};
type ItemRow = {
  id: string; batch_id: string; learner_id: string; position: number; credential_id: string | null;
  conflicting_credential_id: string | null; status: CredentialGenerationItemStatus; attempt_count: number;
  last_error_code: string | null; generated_at: string | null; reviewed_at: string | null;
};
type ActivationRequestRow = {
  id: string; status: 'processing' | 'completed' | 'partial';
};
type ActivationItemRow = {
  id: string; activation_request_id: string; batch_item_id: string; position: number;
  status: 'queued' | 'processing' | 'activation_failed' | 'delivery_retryable' | 'activated_sent' | 'activated_not_sent';
  attempt_count: number; last_error_code: string | null; email_send_id: string | null;
};
type ActivationClaimRow = {
  activation_request_id: string; batch_item_id: string; credential_id: string; email_send_id: string | null;
};
type CredentialSummaryRow = {
  id: string; document_number: string; status: 'pending' | 'valid' | 'revoked' | 'voided';
};
type CredentialFileRow = {
  id: string; credential_id: string; admin_label: string; is_primary: boolean;
};
type GenerationProvenanceRow = {
  credential_file_id: string; generation_batch_item_id: string; template_document_id: string;
};
type TemplateDocumentPageRow = { id: string; page_count: number };
type EmailSendStatusRow = { id: string; status: CredentialEmailSendStatus };
type TemplateMeta = {
  packageId: string; versionId: string; versionNumber: number; displayName: string;
  programmeId: string; programmeRunId: string | null; credentialTypeId: string;
  languageCode: 'en' | 'ua' | 'cz'; documentCount: number; pageCount: number;
};
type LearnerReferenceRow = {
  id: string;
  latin_first_name: string;
  latin_last_name: string;
  ukrainian_full_name: string;
  archived_at: string | null;
};
type Lookup = {
  learnerNames: Map<string, string>;
  programmeTitles: Map<string, string>;
  runLabels: Map<string, string>;
  typeLabels: Map<string, string>;
  templates: Map<string, TemplateMeta>;
};

const learnerPageSize = 1000;

const batchSelect = `id, template_version_id, programme_id, programme_run_id, credential_type_id,
  language_code, issue_date, completion_date, status, processing_chunk_size,
  activation_blocked, activation_block_reason,
  confirmed_at, started_at, finished_at, created_at`;
const itemSelect = `id, batch_id, learner_id, position, credential_id, conflicting_credential_id,
  status, attempt_count, last_error_code, generated_at, reviewed_at`;

function client(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function databaseError(error: { code?: string; message?: string } | null, fallback: string): ApiError {
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Credential batch operation is not permitted.');
  if (error?.code === 'P0002') return new ApiError('not_found', 404, fallback);
  if (error?.code === '55P03' || error?.code === '40001' || error?.code === '23505') {
    return new ApiError('conflict', 409, error.message || 'Batch state changed. Reload and try again.');
  }
  if (['22023', '22P02', '23503', '23514'].includes(error?.code ?? '')) {
    return new ApiError('bad_request', 400, error?.message || fallback);
  }
  return new ApiError('server_error', 500, fallback);
}

function runLabel(status: string, startsAt: string | null, endsAt: string | null): string {
  const dates = [startsAt, endsAt].filter(Boolean).join(' — ');
  return dates ? `${status} · ${dates}` : status;
}

async function loadLearners(db: SupabaseClient): Promise<LearnerReferenceRow[]> {
  return collectPaginatedRows(async (from, to) => {
    const result = await db
      .from('learners')
      .select('id, latin_first_name, latin_last_name, ukrainian_full_name, archived_at')
      .order('latin_last_name')
      .order('id')
      .range(from, to);
    if (result.error) {
      throw databaseError(result.error, 'Credential batch learner references could not be loaded.');
    }
    return (result.data ?? []) as LearnerReferenceRow[];
  }, learnerPageSize);
}

async function loadLookup(db: SupabaseClient, suppliedLearners?: LearnerReferenceRow[]): Promise<Lookup> {
  const [learners, programmes, programmeTranslations, runs, types, typeTranslations, packages, versions, documents] = await Promise.all([
    suppliedLearners ?? loadLearners(db),
    db.from('programmes').select('id, slug'),
    db.from('programme_translations').select('programme_id, language_code, title').eq('language_code', 'en'),
    db.from('programme_runs').select('id, status, starts_at, ends_at'),
    db.from('credential_types').select('id, code'),
    db.from('credential_type_translations').select('credential_type_id, language_code, display_name').eq('language_code', 'en'),
    db.from('credential_template_packages').select('id, programme_id, programme_run_id, credential_type_id, language_code, display_name'),
    db.from('credential_template_versions').select('id, template_package_id, version_number, status').in('status', ['published', 'retired']),
    db.from('credential_template_documents').select('id, template_version_id, page_count'),
  ]);
  for (const result of [programmes, programmeTranslations, runs, types, typeTranslations, packages, versions, documents]) {
    if (result.error) throw databaseError(result.error, 'Credential batch reference data could not be loaded.');
  }
  const programmeTitles = new Map((programmeTranslations.data ?? []).map((row) => [row.programme_id, row.title]));
  const typeLabels = new Map((typeTranslations.data ?? []).map((row) => [row.credential_type_id, row.display_name]));
  const packageById = new Map((packages.data ?? []).map((row) => [row.id, row]));
  const documentsByVersion = new Map<string, Array<{ page_count: number }>>();
  for (const document of documents.data ?? []) {
    const current = documentsByVersion.get(document.template_version_id) ?? [];
    current.push(document);
    documentsByVersion.set(document.template_version_id, current);
  }
  const templateMap = new Map<string, TemplateMeta>();
  for (const version of versions.data ?? []) {
    const templatePackage = packageById.get(version.template_package_id);
    if (!templatePackage) continue;
    const templateDocuments = documentsByVersion.get(version.id) ?? [];
    templateMap.set(version.id, {
      packageId: templatePackage.id,
      versionId: version.id,
      versionNumber: Number(version.version_number),
      displayName: templatePackage.display_name,
      programmeId: templatePackage.programme_id,
      programmeRunId: templatePackage.programme_run_id,
      credentialTypeId: templatePackage.credential_type_id,
      languageCode: templatePackage.language_code as TemplateMeta['languageCode'],
      documentCount: templateDocuments.length,
      pageCount: templateDocuments.reduce((sum, document) => sum + Number(document.page_count), 0),
    });
  }
  return {
    learnerNames: new Map(learners.map((row) => [row.id, `${row.latin_first_name} ${row.latin_last_name}`])),
    programmeTitles: new Map((programmes.data ?? []).map((row) => [row.id, programmeTitles.get(row.id) ?? row.slug])),
    runLabels: new Map((runs.data ?? []).map((row) => [row.id, runLabel(row.status, row.starts_at, row.ends_at)])),
    typeLabels: new Map((types.data ?? []).map((row) => [row.id, typeLabels.get(row.id) ?? row.code])),
    templates: templateMap,
  };
}

function contextSummary(batch: Pick<BatchRow, 'template_version_id' | 'programme_id' | 'programme_run_id' | 'credential_type_id' | 'language_code' | 'issue_date' | 'completion_date'>, lookup: Lookup): BatchContextSummary {
  const template = lookup.templates.get(batch.template_version_id);
  if (!template) throw new ApiError('server_error', 500, 'Batch template provenance could not be loaded.');
  return {
    templateVersionId: template.versionId,
    templateDisplayName: template.displayName,
    templateVersionNumber: template.versionNumber,
    templateDocumentCount: template.documentCount,
    templatePageCount: template.pageCount,
    programmeId: batch.programme_id,
    programmeTitle: lookup.programmeTitles.get(batch.programme_id) ?? 'Unknown programme',
    programmeRunId: batch.programme_run_id,
    programmeRunLabel: batch.programme_run_id ? lookup.runLabels.get(batch.programme_run_id) ?? null : null,
    credentialTypeId: batch.credential_type_id,
    credentialType: lookup.typeLabels.get(batch.credential_type_id) ?? 'Unknown document type',
    languageCode: batch.language_code,
    issueDate: batch.issue_date,
    completionDate: batch.completion_date,
  };
}

function counts(items: ItemRow[]) {
  return {
    totalCount: items.length,
    generatedCount: items.filter((item) => ['generated', 'reviewed', 'activating', 'activated'].includes(item.status)).length,
    reviewedCount: items.filter((item) => ['reviewed', 'activating', 'activated'].includes(item.status)).length,
    conflictCount: items.filter((item) => item.status === 'conflict').length,
    retryableCount: items.filter((item) => ['retryable', 'failed'].includes(item.status)).length,
    pendingCount: items.filter((item) => ['queued', 'processing'].includes(item.status)).length,
    activatedCount: items.filter((item) => item.status === 'activated').length,
  };
}

function listItem(batch: BatchRow, items: ItemRow[], lookup: Lookup): BatchListItem {
  return {
    id: batch.id,
    status: batch.status,
    activationBlocked: batch.activation_blocked,
    activationBlockReason: batch.activation_block_reason,
    context: contextSummary(batch, lookup),
    ...counts(items),
    createdAt: batch.created_at,
    confirmedAt: batch.confirmed_at,
  };
}

export async function getBatchReferenceData(context: AdminContext): Promise<BatchReferenceData> {
  const db = client(context);
  const learners = await loadLearners(db);
  const [lookup, publishedVersions] = await Promise.all([
    loadLookup(db, learners),
    db.from('credential_template_versions').select('id').eq('status', 'published'),
  ]);
  if (publishedVersions.error) {
    throw databaseError(publishedVersions.error, 'Credential batch references could not be loaded.');
  }
  const publishedIds = new Set((publishedVersions.data ?? []).map((row) => row.id));
  const programmes = [...lookup.programmeTitles].map(([id, title]) => ({ id, title }));
  const programmeRuns = [...lookup.runLabels].map(([id, label]) => ({ id, label, programmeId: '' }));
  const runs = await db.from('programme_runs').select('id, programme_id');
  if (runs.error) throw databaseError(runs.error, 'Programme run references could not be loaded.');
  const runProgramme = new Map((runs.data ?? []).map((row) => [row.id, row.programme_id]));
  return {
    learners: learners.map((row) => ({ id: row.id, name: `${row.latin_first_name} ${row.latin_last_name}`, archived: Boolean(row.archived_at) })),
    programmes,
    programmeRuns: programmeRuns.map((run) => ({ ...run, programmeId: runProgramme.get(run.id) ?? '' })),
    credentialTypes: [...lookup.typeLabels].map(([id, label]) => ({ id, label })),
    templates: [...lookup.templates.values()].filter((template) => publishedIds.has(template.versionId)).map((template) => ({
      templateVersionId: template.versionId,
      programmeId: template.programmeId,
      programmeRunId: template.programmeRunId,
      credentialTypeId: template.credentialTypeId,
      languageCode: template.languageCode,
      displayName: template.displayName,
      versionNumber: template.versionNumber,
      documentCount: template.documentCount,
      pageCount: template.pageCount,
    })),
  };
}

export async function previewCredentialGenerationBatch(context: AdminContext, input: BatchIssuingContextInput): Promise<BatchPreview> {
  const db = client(context);
  const [lookup, result] = await Promise.all([
    loadLookup(db),
    db.rpc('preview_credential_generation_batch', {
      p_template_version_id: input.templateVersionId,
      p_programme_id: input.programmeId,
      p_programme_run_id: input.programmeRunId,
      p_credential_type_id: input.credentialTypeId,
      p_language_code: input.languageCode,
      p_completion_date: input.completionDate,
      p_learner_ids: input.learnerIds,
    }),
  ]);
  if (result.error) throw databaseError(result.error, 'Batch preview could not be prepared.');
  const batchContext = contextSummary({
    template_version_id: input.templateVersionId, programme_id: input.programmeId,
    programme_run_id: input.programmeRunId, credential_type_id: input.credentialTypeId,
    language_code: input.languageCode, issue_date: input.issueDate, completion_date: input.completionDate,
  }, lookup);
  const learners = ((result.data ?? []) as Array<{
    learner_id: string; learner_name: string; cohort_position: number; archived: boolean;
    conflicting_credential_id: string | null; conflicting_document_number: string | null;
  }>).map((row) => ({
    learnerId: row.learner_id,
    learnerName: row.learner_name,
    position: Number(row.cohort_position),
    outcome: row.archived ? 'archived' as const : row.conflicting_credential_id ? 'conflict' as const : 'accepted' as const,
    conflictingCredentialId: row.conflicting_credential_id,
    conflictingDocumentNumber: row.conflicting_document_number,
  }));
  return {
    context: batchContext,
    selectedCount: learners.length,
    acceptedCount: learners.filter((item) => item.outcome === 'accepted').length,
    conflictCount: learners.filter((item) => item.outcome === 'conflict').length,
    archivedCount: learners.filter((item) => item.outcome === 'archived').length,
    learners,
  };
}

export async function confirmCredentialGenerationBatch(context: AdminContext, input: BatchIssuingContextInput): Promise<BatchDetail> {
  const db = client(context);
  const result = await db.rpc('confirm_credential_generation_batch', {
    p_idempotency_key: input.idempotencyKey,
    p_template_version_id: input.templateVersionId,
    p_programme_id: input.programmeId,
    p_programme_run_id: input.programmeRunId,
    p_credential_type_id: input.credentialTypeId,
    p_language_code: input.languageCode,
    p_issue_date: input.issueDate,
    p_completion_date: input.completionDate,
    p_learner_ids: input.learnerIds,
  });
  if (result.error || typeof result.data !== 'string') {
    throw databaseError(result.error, 'Credential generation batch could not be confirmed.');
  }
  return getCredentialGenerationBatch(context, result.data);
}

export async function listCredentialGenerationBatches(context: AdminContext): Promise<BatchListItem[]> {
  const db = client(context);
  const [lookup, batchesResult] = await Promise.all([
    loadLookup(db),
    db.from('credential_generation_batches').select(batchSelect).order('created_at', { ascending: false }).limit(25),
  ]);
  if (batchesResult.error) throw databaseError(batchesResult.error, 'Credential generation batches could not be loaded.');
  const batches = (batchesResult.data ?? []) as BatchRow[];
  if (!batches.length) return [];
  const items = await collectPaginatedRows(async (from, to) => {
    const result = await db.from('credential_generation_batch_items')
      .select(itemSelect)
      .in('batch_id', batches.map((batch) => batch.id))
      .order('id')
      .range(from, to);
    if (result.error) throw databaseError(result.error, 'Credential generation batch counts could not be loaded.');
    return (result.data ?? []) as ItemRow[];
  });
  return batches.map((batch) => listItem(batch, items.filter((item) => item.batch_id === batch.id), lookup));
}

export async function getCredentialGenerationBatch(context: AdminContext, batchId: string): Promise<BatchDetail> {
  const db = client(context);
  const [lookup, batchResult, items] = await Promise.all([
    loadLookup(db),
    db.from('credential_generation_batches').select(batchSelect).eq('id', batchId).maybeSingle(),
    collectPaginatedRows(async (from, to) => {
      const result = await db.from('credential_generation_batch_items')
        .select(itemSelect)
        .eq('batch_id', batchId)
        .order('position')
        .range(from, to);
      if (result.error) throw databaseError(result.error, 'Credential generation batch could not be loaded.');
      return (result.data ?? []) as ItemRow[];
    }),
  ]);
  if (batchResult.error) throw databaseError(batchResult.error, 'Credential generation batch could not be loaded.');
  if (!batchResult.data) throw new ApiError('not_found', 404, 'Credential generation batch was not found.');
  const batch = batchResult.data as BatchRow;
  const credentialIds = items.map((item) => item.credential_id).filter((id): id is string => Boolean(id));
  const itemIds = items.map((item) => item.id);
  const [credentials, files, provenance, documentsResult] = await Promise.all([
    collectChunkedRows(credentialIds, async (ids) => {
      const result = await db.from('credentials').select('id, document_number, status').in('id', [...ids]);
      if (result.error) throw databaseError(result.error, 'Credential batch review data could not be loaded.');
      return (result.data ?? []) as CredentialSummaryRow[];
    }),
    collectChunkedRows(credentialIds, async (ids) => {
      const result = await db.from('credential_files').select('id, credential_id, admin_label, is_primary').in('credential_id', [...ids]);
      if (result.error) throw databaseError(result.error, 'Credential batch review data could not be loaded.');
      return (result.data ?? []) as CredentialFileRow[];
    }),
    collectChunkedRows(itemIds, async (ids) => {
      const result = await db.from('credential_file_generations')
        .select('credential_file_id, generation_batch_item_id, template_document_id')
        .in('generation_batch_item_id', [...ids]);
      if (result.error) throw databaseError(result.error, 'Credential batch review data could not be loaded.');
      return (result.data ?? []) as GenerationProvenanceRow[];
    }),
    db.from('credential_template_documents').select('id, page_count').eq('template_version_id', batch.template_version_id),
  ]);
  if (documentsResult.error) throw databaseError(documentsResult.error, 'Credential batch review data could not be loaded.');
  const documents = (documentsResult.data ?? []) as TemplateDocumentPageRow[];
  const activationItems = await collectChunkedRows(itemIds, async (ids) => {
    const result = await db.from('credential_generation_batch_activation_items')
      .select('id, activation_request_id, batch_item_id, position, status, attempt_count, last_error_code, email_send_id')
      .in('batch_item_id', [...ids]);
    if (result.error) throw databaseError(result.error, 'Batch activation outcomes could not be loaded.');
    return (result.data ?? []) as ActivationItemRow[];
  });
  const activationRequestIds = [...new Set(activationItems.map((item) => item.activation_request_id))];
  const emailSendIds = activationItems.map((item) => item.email_send_id).filter((id): id is string => Boolean(id));
  const [activationRequests, emailSends] = await Promise.all([
    collectChunkedRows(activationRequestIds, async (ids) => {
      const result = await db.from('credential_generation_batch_activation_requests').select('id, status').in('id', [...ids]);
      if (result.error) throw databaseError(result.error, 'Batch delivery outcomes could not be loaded.');
      return (result.data ?? []) as ActivationRequestRow[];
    }),
    collectChunkedRows(emailSendIds, async (ids) => {
      const result = await db.from('credential_email_sends').select('id, status').in('id', [...ids]);
      if (result.error) throw databaseError(result.error, 'Batch delivery outcomes could not be loaded.');
      return (result.data ?? []) as EmailSendStatusRow[];
    }),
  ]);
  const credentialById = new Map(credentials.map((row) => [row.id, row]));
  const fileById = new Map(files.map((row) => [row.id, row]));
  const provenanceByBatchItem = new Map<string, GenerationProvenanceRow[]>();
  for (const row of provenance) {
    const current = provenanceByBatchItem.get(row.generation_batch_item_id) ?? [];
    current.push(row);
    provenanceByBatchItem.set(row.generation_batch_item_id, current);
  }
  const documentPages = new Map(documents.map((row) => [row.id, Number(row.page_count)]));
  const expectedDocumentCount = lookup.templates.get(batch.template_version_id)?.documentCount ?? 0;
  const activationRequestById = new Map(activationRequests.map((row) => [row.id, row]));
  const emailSendById = new Map(emailSends.map((row) => [row.id, row]));
  const activationByBatchItem = new Map(activationItems.map((row) => [row.batch_item_id, row]));
  const reviewItems: BatchReviewItem[] = items.map((item) => {
    const credential = item.credential_id ? credentialById.get(item.credential_id) : null;
    const itemFiles = (provenanceByBatchItem.get(item.id) ?? []).map((row) => {
      const file = fileById.get(row.credential_file_id);
      return file ? {
        id: file.id,
        adminLabel: file.admin_label,
        pageCount: documentPages.get(row.template_document_id) ?? 0,
        isPrimary: file.is_primary,
      } : null;
    }).filter((file): file is NonNullable<typeof file> => Boolean(file));
    const activationItem = activationByBatchItem.get(item.id);
    const activationRequest = activationItem ? activationRequestById.get(activationItem.activation_request_id) : null;
    const emailSend = activationItem?.email_send_id ? emailSendById.get(activationItem.email_send_id) : null;
    return {
      id: item.id,
      learnerId: item.learner_id,
      learnerName: lookup.learnerNames.get(item.learner_id) ?? 'Unknown learner',
      position: Number(item.position),
      credentialId: item.credential_id,
      conflictingCredentialId: item.conflicting_credential_id,
      documentNumber: credential?.document_number ?? null,
      status: item.status,
      attemptCount: Number(item.attempt_count),
      lastErrorCode: item.last_error_code,
      generatedAt: item.generated_at,
      reviewedAt: item.reviewed_at,
      files: itemFiles,
      activationEligible: !batch.activation_blocked && !activationItem
        && item.status === 'reviewed' && credential?.status === 'pending'
        && itemFiles.length === expectedDocumentCount,
      activation: activationItem && activationRequest ? {
        id: activationItem.id,
        requestId: activationItem.activation_request_id,
        requestStatus: activationRequest.status,
        status: activationItem.status,
        attemptCount: Number(activationItem.attempt_count),
        lastErrorCode: activationItem.last_error_code,
        emailSendId: activationItem.email_send_id,
        deliveryStatus: emailSend?.status ?? null,
      } : null,
    };
  });
  const base = listItem(batch, items, lookup);
  return {
    ...base,
    processingChunkSize: Number(batch.processing_chunk_size),
    startedAt: batch.started_at,
    finishedAt: batch.finished_at,
    items: reviewItems,
    activationSentCount: reviewItems.filter((item) => item.activation?.status === 'activated_sent').length,
    activationNotSentCount: reviewItems.filter((item) => item.activation?.status === 'activated_not_sent').length,
    activationFailedCount: reviewItems.filter((item) => item.activation?.status === 'activation_failed').length,
    activationPendingCount: reviewItems.filter((item) => ['queued', 'processing', 'delivery_retryable'].includes(item.activation?.status ?? '')).length,
  };
}

export async function processCredentialGenerationBatchChunk(
  context: AdminContext,
  batchId: string,
  requestOrigin: string,
): Promise<BatchChunkResult> {
  const db = client(context);
  const batchResult = await db.from('credential_generation_batches')
    .select('id, processing_chunk_size').eq('id', batchId).maybeSingle();
  if (batchResult.error) throw databaseError(batchResult.error, 'Credential generation batch could not be loaded.');
  if (!batchResult.data) throw new ApiError('not_found', 404, 'Credential generation batch was not found.');
  const chunkSize = Math.max(1, Math.min(250, Number(batchResult.data.processing_chunk_size)));
  const candidates = await db.from('credential_generation_batch_items')
    .select('id').eq('batch_id', batchId).eq('status', 'queued').order('position').limit(chunkSize);
  if (candidates.error) throw databaseError(candidates.error, 'Queued batch items could not be loaded.');
  let generatedCount = 0;
  let retryableCount = 0;
  let skippedCount = 0;
  for (const candidate of candidates.data ?? []) {
    try {
      const result = await generateCredentialBatchItem(context, candidate.id, requestOrigin);
      if (result.outcome === 'generated') generatedCount += 1;
      else skippedCount += 1;
    } catch (error) {
      if (error instanceof ApiError && error.code === 'conflict') skippedCount += 1;
      else retryableCount += 1;
    }
  }
  const batch = await getCredentialGenerationBatch(context, batchId);
  return {
    processedCount: (candidates.data ?? []).length,
    generatedCount,
    retryableCount,
    skippedCount,
    hasMore: batch.items.some((item) => item.status === 'queued'),
    batch,
  };
}

export async function retryCredentialGenerationBatchItem(
  context: AdminContext,
  batchId: string,
  itemId: string,
  requestOrigin: string,
): Promise<BatchDetail> {
  const db = client(context);
  const belongs = await db.from('credential_generation_batch_items').select('id').eq('id', itemId).eq('batch_id', batchId).maybeSingle();
  if (belongs.error) throw databaseError(belongs.error, 'Batch item could not be loaded.');
  if (!belongs.data) throw new ApiError('not_found', 404, 'Batch item was not found.');
  const queued = await db.rpc('queue_credential_generation_batch_item', { p_batch_item_id: itemId });
  if (queued.error) throw databaseError(queued.error, 'Batch item could not be queued for retry.');
  await generateCredentialBatchItem(context, itemId, requestOrigin);
  return getCredentialGenerationBatch(context, batchId);
}

export async function reviewCredentialGenerationBatchItem(
  context: AdminContext,
  batchId: string,
  itemId: string,
): Promise<BatchDetail> {
  const db = client(context);
  const belongs = await db.from('credential_generation_batch_items').select('id').eq('id', itemId).eq('batch_id', batchId).maybeSingle();
  if (belongs.error) throw databaseError(belongs.error, 'Batch item could not be loaded.');
  if (!belongs.data) throw new ApiError('not_found', 404, 'Batch item was not found.');
  const reviewed = await db.rpc('review_credential_generation_batch_item', { p_batch_item_id: itemId });
  if (reviewed.error) throw databaseError(reviewed.error, 'Batch item could not be marked reviewed.');
  return getCredentialGenerationBatch(context, batchId);
}

export async function reviewCredentialGenerationBatchItems(
  context: AdminContext,
  batchId: string,
  itemIds: string[],
): Promise<BatchReviewResult> {
  const db = client(context);
  const belongs = await db.from('credential_generation_batch_items')
    .select('id, status')
    .eq('batch_id', batchId)
    .in('id', itemIds);
  if (belongs.error) throw databaseError(belongs.error, 'Batch review selection could not be loaded.');
  if ((belongs.data ?? []).length !== itemIds.length) {
    throw new ApiError('not_found', 404, 'One or more selected batch items were not found.');
  }
  if ((belongs.data ?? []).some((item) => item.status !== 'generated')) {
    throw new ApiError('conflict', 409, 'Every selected package must still be generated and awaiting review.');
  }

  const outcomes = await Promise.all(itemIds.map(async (itemId) => {
    const reviewed = await db.rpc('review_credential_generation_batch_item', { p_batch_item_id: itemId });
    return !reviewed.error;
  }));
  const reviewedCount = outcomes.filter(Boolean).length;
  return {
    reviewedCount,
    failedCount: itemIds.length - reviewedCount,
    batch: await getCredentialGenerationBatch(context, batchId),
  };
}

function activationErrorCode(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'conflict') return 'activation_state_conflict';
    if (error.code === 'bad_request') return 'activation_validation_failed';
    if (error.code === 'forbidden') return 'activation_forbidden';
  }
  return 'activation_failed_safely';
}

async function firstActivationSend(db: SupabaseClient, credentialId: string) {
  const result = await db.from('credential_email_sends')
    .select('id, recipient_email, subject, body, status')
    .eq('credential_id', credentialId)
    .order('sent_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (result.error) throw databaseError(result.error, 'Credential activation delivery record could not be loaded.');
  return result.data;
}

async function completeBatchActivationTracking(
  db: SupabaseClient,
  activationItemId: string,
  leaseToken: string,
  emailSendId: string,
) {
  const result = await db.rpc('complete_credential_generation_batch_activation_item', {
    p_activation_request_item_id: activationItemId,
    p_lease_token: leaseToken,
    p_email_send_id: emailSendId,
  });
  if (result.error) throw databaseError(result.error, 'Batch activation outcome could not be recorded.');
  return result.data as 'delivery_retryable' | 'activated_sent' | 'activated_not_sent';
}

async function bindBatchActivationSend(
  db: SupabaseClient,
  activationItemId: string,
  leaseToken: string,
  emailSendId: string,
) {
  const result = await db.rpc('bind_credential_generation_batch_activation_email_send', {
    p_activation_request_item_id: activationItemId,
    p_lease_token: leaseToken,
    p_email_send_id: emailSendId,
  });
  if (result.error) throw databaseError(result.error, 'Batch activation delivery record could not be linked.');
}

async function processBatchActivationItem(
  context: AdminContext,
  db: SupabaseClient,
  activationItemId: string,
  requestOrigin: string,
) {
  const leaseToken = crypto.randomUUID();
  const claimed = await db.rpc('claim_credential_generation_batch_activation_item', {
    p_activation_request_item_id: activationItemId,
    p_lease_token: leaseToken,
  });
  const claim = ((claimed.data ?? []) as ActivationClaimRow[])[0];
  if (claimed.error || !claim?.credential_id) {
    throw databaseError(claimed.error, 'Batch activation item could not be claimed.');
  }

  try {
    const credentialResult = await db.from('credentials').select('id, status').eq('id', claim.credential_id).maybeSingle();
    if (credentialResult.error || !credentialResult.data) {
      throw databaseError(credentialResult.error, 'Batch credential could not be loaded for activation.');
    }

    let emailSendId = claim.email_send_id;
    if (credentialResult.data.status === 'pending') {
      const draft = await getCredentialActivationDraft(context, claim.credential_id, requestOrigin);
      if (!draft?.hasPrimaryPdf) throw new ApiError('conflict', 409, 'Reviewed package no longer has a primary PDF.');
      const activation = await activateCredential(context, claim.credential_id, {
        recipientEmail: draft.recipientEmail || null,
        subject: draft.subject,
        body: draft.body,
      }, { itemId: activationItemId, leaseToken });
      emailSendId = activation.emailSendId;
    } else if (credentialResult.data.status === 'valid') {
      const send = emailSendId
        ? await db.from('credential_email_sends').select('id, recipient_email, subject, body, status').eq('id', emailSendId).maybeSingle()
        : { data: await firstActivationSend(db, claim.credential_id), error: null };
      if (send.error || !send.data) throw databaseError(send.error, 'Valid batch credential has no activation delivery record.');
      emailSendId = send.data.id;
      if (!claim.email_send_id) {
        await bindBatchActivationSend(db, activationItemId, leaseToken, send.data.id);
      }
      if (send.data.status === 'pending' && send.data.recipient_email) {
        await deliverCredentialEmailSend(
          context,
          claim.credential_id,
          send.data.id,
          send.data.recipient_email,
          send.data.subject,
          send.data.body,
          { itemId: activationItemId, leaseToken },
        );
      }
    } else {
      throw new ApiError('conflict', 409, 'Only a pending or already-valid selected credential can resume batch activation.');
    }

    if (!emailSendId) throw new ApiError('server_error', 500, 'Activation delivery record is missing.');
    return await completeBatchActivationTracking(db, activationItemId, leaseToken, emailSendId);
  } catch (error) {
    const credential = await db.from('credentials').select('status').eq('id', claim.credential_id).maybeSingle();
    if (!credential.error && credential.data?.status === 'valid') {
      const send = claim.email_send_id
        ? { id: claim.email_send_id }
        : await firstActivationSend(db, claim.credential_id);
      if (send?.id) {
        if (!claim.email_send_id) await bindBatchActivationSend(db, activationItemId, leaseToken, send.id);
        return await completeBatchActivationTracking(db, activationItemId, leaseToken, send.id);
      }
    }
    const failed = await db.rpc('fail_credential_generation_batch_activation_item', {
      p_activation_request_item_id: activationItemId,
      p_lease_token: leaseToken,
      p_error_code: activationErrorCode(error),
    });
    if (failed.error) throw databaseError(failed.error, 'Batch activation failure could not be recorded safely.');
    return 'activation_failed' as const;
  }
}

async function processBatchActivationRequestChunk(
  context: AdminContext,
  batchId: string,
  activationRequestId: string,
  requestOrigin: string,
): Promise<BatchActivationChunkResult> {
  const db = client(context);
  const requestResult = await db.from('credential_generation_batch_activation_requests')
    .select('id, batch_id').eq('id', activationRequestId).eq('batch_id', batchId).maybeSingle();
  if (requestResult.error) throw databaseError(requestResult.error, 'Batch activation request could not be loaded.');
  if (!requestResult.data) throw new ApiError('not_found', 404, 'Batch activation request was not found.');
  const batchResult = await db.from('credential_generation_batches')
    .select('processing_chunk_size').eq('id', batchId).maybeSingle();
  if (batchResult.error || !batchResult.data) throw databaseError(batchResult.error, 'Generation batch could not be loaded.');
  const chunkSize = Math.max(1, Math.min(250, Number(batchResult.data.processing_chunk_size)));
  const queued = await db.from('credential_generation_batch_activation_items')
    .select('id, position').eq('activation_request_id', activationRequestId).eq('status', 'queued')
    .order('position').limit(chunkSize);
  if (queued.error) throw databaseError(queued.error, 'Queued batch activations could not be loaded.');
  const expired = (queued.data ?? []).length < chunkSize
    ? await db.from('credential_generation_batch_activation_items')
      .select('id, position').eq('activation_request_id', activationRequestId).eq('status', 'processing')
      .lte('lease_expires_at', new Date().toISOString()).order('position')
      .limit(chunkSize - (queued.data ?? []).length)
    : { data: [], error: null };
  if (expired.error) throw databaseError(expired.error, 'Expired batch activation leases could not be loaded.');
  const candidates = [...(queued.data ?? []), ...(expired.data ?? [])]
    .sort((left, right) => Number(left.position) - Number(right.position))
    .slice(0, chunkSize);

  let activatedSentCount = 0;
  let activatedNotSentCount = 0;
  let failedCount = 0;
  let retryableDeliveryCount = 0;
  let skippedCount = 0;
  for (const candidate of candidates) {
    try {
      const outcome = await processBatchActivationItem(context, db, candidate.id, requestOrigin);
      if (outcome === 'activated_sent') activatedSentCount += 1;
      else if (outcome === 'activated_not_sent') activatedNotSentCount += 1;
      else if (outcome === 'delivery_retryable') retryableDeliveryCount += 1;
      else failedCount += 1;
    } catch (error) {
      if (error instanceof ApiError && error.code === 'conflict') skippedCount += 1;
      else failedCount += 1;
    }
  }

  const [remainingQueued, remainingExpired] = await Promise.all([
    db.from('credential_generation_batch_activation_items').select('id', { count: 'exact', head: true })
      .eq('activation_request_id', activationRequestId).eq('status', 'queued'),
    db.from('credential_generation_batch_activation_items').select('id', { count: 'exact', head: true })
      .eq('activation_request_id', activationRequestId).eq('status', 'processing')
      .lte('lease_expires_at', new Date().toISOString()),
  ]);
  if (remainingQueued.error || remainingExpired.error) {
    throw databaseError(remainingQueued.error ?? remainingExpired.error, 'Remaining batch activations could not be counted.');
  }
  return {
    activationRequestId,
    processedCount: candidates.length,
    activatedSentCount,
    activatedNotSentCount,
    failedCount,
    retryableDeliveryCount,
    skippedCount,
    hasMore: (remainingQueued.count ?? 0) + (remainingExpired.count ?? 0) > 0,
    batch: await getCredentialGenerationBatch(context, batchId),
  };
}

export async function resumeCredentialGenerationBatchActivationRequest(
  context: AdminContext,
  batchId: string,
  activationRequestId: string,
  requestOrigin: string,
): Promise<BatchActivationChunkResult> {
  return processBatchActivationRequestChunk(context, batchId, activationRequestId, requestOrigin);
}

export async function activateCredentialGenerationBatchChunk(
  context: AdminContext,
  batchId: string,
  input: BatchActivationInput,
  requestOrigin: string,
): Promise<BatchActivationChunkResult> {
  const db = client(context);
  const prepared = await db.rpc('prepare_credential_generation_batch_activation', {
    p_batch_id: batchId,
    p_idempotency_key: input.idempotencyKey,
    p_batch_item_ids: input.itemIds,
  });
  if (prepared.error || typeof prepared.data !== 'string') {
    throw databaseError(prepared.error, 'Reviewed batch items could not be prepared for activation.');
  }
  return processBatchActivationRequestChunk(context, batchId, prepared.data, requestOrigin);
}

export async function retryCredentialGenerationBatchActivationItem(
  context: AdminContext,
  batchId: string,
  activationItemId: string,
  requestOrigin: string,
): Promise<BatchActivationChunkResult> {
  const db = client(context);
  const item = await db.from('credential_generation_batch_activation_items')
    .select('id, activation_request_id').eq('id', activationItemId).maybeSingle();
  if (item.error) throw databaseError(item.error, 'Batch activation item could not be loaded.');
  if (!item.data) throw new ApiError('not_found', 404, 'Batch activation item was not found.');
  const request = await db.from('credential_generation_batch_activation_requests')
    .select('id').eq('id', item.data.activation_request_id).eq('batch_id', batchId).maybeSingle();
  if (request.error || !request.data) throw databaseError(request.error, 'Batch activation request does not match this batch.');
  const queued = await db.rpc('requeue_credential_generation_batch_activation_item', {
    p_activation_request_item_id: activationItemId,
  });
  if (queued.error) throw databaseError(queued.error, 'Batch activation or delivery retry could not be queued.');
  return processBatchActivationRequestChunk(context, batchId, item.data.activation_request_id, requestOrigin);
}
