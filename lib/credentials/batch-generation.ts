import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateCredentialBatchItem } from '@/lib/credentials/generation';
import type {
  BatchChunkResult,
  BatchContextSummary,
  BatchDetail,
  BatchIssuingContextInput,
  BatchListItem,
  BatchPreview,
  BatchReferenceData,
  BatchReviewItem,
  CredentialGenerationBatchStatus,
  CredentialGenerationItemStatus,
} from '@/lib/credentials/batch-generation-types';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';

type BatchRow = {
  id: string; template_version_id: string; programme_id: string; programme_run_id: string | null;
  credential_type_id: string; language_code: 'en' | 'ua' | 'cz'; issue_date: string;
  completion_date: string | null; status: CredentialGenerationBatchStatus; processing_chunk_size: number;
  confirmed_at: string | null; started_at: string | null; finished_at: string | null; created_at: string;
};
type ItemRow = {
  id: string; batch_id: string; learner_id: string; position: number; credential_id: string | null;
  conflicting_credential_id: string | null; status: CredentialGenerationItemStatus; attempt_count: number;
  last_error_code: string | null; generated_at: string | null; reviewed_at: string | null;
};
type TemplateMeta = {
  packageId: string; versionId: string; versionNumber: number; displayName: string;
  programmeId: string; programmeRunId: string | null; credentialTypeId: string;
  languageCode: 'en' | 'ua' | 'cz'; documentCount: number; pageCount: number;
};
type Lookup = {
  learnerNames: Map<string, string>;
  programmeTitles: Map<string, string>;
  runLabels: Map<string, string>;
  typeLabels: Map<string, string>;
  templates: Map<string, TemplateMeta>;
};

const batchSelect = `id, template_version_id, programme_id, programme_run_id, credential_type_id,
  language_code, issue_date, completion_date, status, processing_chunk_size,
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

async function loadLookup(db: SupabaseClient): Promise<Lookup> {
  const [learners, programmes, programmeTranslations, runs, types, typeTranslations, packages, versions, documents] = await Promise.all([
    db.from('learners').select('id, latin_first_name, latin_last_name, ukrainian_full_name'),
    db.from('programmes').select('id, slug'),
    db.from('programme_translations').select('programme_id, language_code, title').eq('language_code', 'en'),
    db.from('programme_runs').select('id, status, starts_at, ends_at'),
    db.from('credential_types').select('id, code'),
    db.from('credential_type_translations').select('credential_type_id, language_code, display_name').eq('language_code', 'en'),
    db.from('credential_template_packages').select('id, programme_id, programme_run_id, credential_type_id, language_code, display_name'),
    db.from('credential_template_versions').select('id, template_package_id, version_number, status').in('status', ['published', 'retired']),
    db.from('credential_template_documents').select('id, template_version_id, page_count'),
  ]);
  for (const result of [learners, programmes, programmeTranslations, runs, types, typeTranslations, packages, versions, documents]) {
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
    learnerNames: new Map((learners.data ?? []).map((row) => [row.id, `${row.latin_first_name} ${row.latin_last_name}`])),
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
  };
}

function listItem(batch: BatchRow, items: ItemRow[], lookup: Lookup): BatchListItem {
  return {
    id: batch.id,
    status: batch.status,
    context: contextSummary(batch, lookup),
    ...counts(items),
    createdAt: batch.created_at,
    confirmedAt: batch.confirmed_at,
  };
}

export async function getBatchReferenceData(context: AdminContext): Promise<BatchReferenceData> {
  const db = client(context);
  const [lookup, learners, publishedVersions] = await Promise.all([
    loadLookup(db),
    db.from('learners').select('id, latin_first_name, latin_last_name, archived_at').order('latin_last_name'),
    db.from('credential_template_versions').select('id').eq('status', 'published'),
  ]);
  if (learners.error || publishedVersions.error) {
    throw databaseError(learners.error ?? publishedVersions.error, 'Credential batch references could not be loaded.');
  }
  const publishedIds = new Set((publishedVersions.data ?? []).map((row) => row.id));
  const programmes = [...lookup.programmeTitles].map(([id, title]) => ({ id, title }));
  const programmeRuns = [...lookup.runLabels].map(([id, label]) => ({ id, label, programmeId: '' }));
  const runs = await db.from('programme_runs').select('id, programme_id');
  if (runs.error) throw databaseError(runs.error, 'Programme run references could not be loaded.');
  const runProgramme = new Map((runs.data ?? []).map((row) => [row.id, row.programme_id]));
  return {
    learners: (learners.data ?? []).map((row) => ({ id: row.id, name: `${row.latin_first_name} ${row.latin_last_name}`, archived: Boolean(row.archived_at) })),
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
    learner_id: string; learner_name: string; position: number; archived: boolean;
    conflicting_credential_id: string | null; conflicting_document_number: string | null;
  }>).map((row) => ({
    learnerId: row.learner_id,
    learnerName: row.learner_name,
    position: Number(row.position),
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
  const itemsResult = await db.from('credential_generation_batch_items').select(itemSelect).in('batch_id', batches.map((batch) => batch.id));
  if (itemsResult.error) throw databaseError(itemsResult.error, 'Credential generation batch counts could not be loaded.');
  const items = (itemsResult.data ?? []) as ItemRow[];
  return batches.map((batch) => listItem(batch, items.filter((item) => item.batch_id === batch.id), lookup));
}

export async function getCredentialGenerationBatch(context: AdminContext, batchId: string): Promise<BatchDetail> {
  const db = client(context);
  const [lookup, batchResult, itemsResult] = await Promise.all([
    loadLookup(db),
    db.from('credential_generation_batches').select(batchSelect).eq('id', batchId).maybeSingle(),
    db.from('credential_generation_batch_items').select(itemSelect).eq('batch_id', batchId).order('position'),
  ]);
  if (batchResult.error || itemsResult.error) throw databaseError(batchResult.error ?? itemsResult.error, 'Credential generation batch could not be loaded.');
  if (!batchResult.data) throw new ApiError('not_found', 404, 'Credential generation batch was not found.');
  const batch = batchResult.data as BatchRow;
  const items = (itemsResult.data ?? []) as ItemRow[];
  const credentialIds = items.map((item) => item.credential_id).filter((id): id is string => Boolean(id));
  const [credentialsResult, filesResult, provenanceResult, documentsResult] = await Promise.all([
    credentialIds.length ? db.from('credentials').select('id, document_number, status').in('id', credentialIds) : Promise.resolve({ data: [], error: null }),
    credentialIds.length ? db.from('credential_files').select('id, credential_id, admin_label, is_primary').in('credential_id', credentialIds) : Promise.resolve({ data: [], error: null }),
    db.from('credential_file_generations').select('credential_file_id, generation_batch_item_id, template_document_id').in('generation_batch_item_id', items.map((item) => item.id)),
    db.from('credential_template_documents').select('id, page_count').eq('template_version_id', batch.template_version_id),
  ]);
  for (const result of [credentialsResult, filesResult, provenanceResult, documentsResult]) {
    if (result.error) throw databaseError(result.error, 'Credential batch review data could not be loaded.');
  }
  const credentialById = new Map((credentialsResult.data ?? []).map((row) => [row.id, row]));
  const fileById = new Map((filesResult.data ?? []).map((row) => [row.id, row]));
  const documentPages = new Map((documentsResult.data ?? []).map((row) => [row.id, Number(row.page_count)]));
  const expectedDocumentCount = lookup.templates.get(batch.template_version_id)?.documentCount ?? 0;
  const reviewItems: BatchReviewItem[] = items.map((item) => {
    const credential = item.credential_id ? credentialById.get(item.credential_id) : null;
    const files = (provenanceResult.data ?? []).filter((row) => row.generation_batch_item_id === item.id).map((row) => {
      const file = fileById.get(row.credential_file_id);
      return file ? {
        id: file.id,
        adminLabel: file.admin_label,
        pageCount: documentPages.get(row.template_document_id) ?? 0,
        isPrimary: file.is_primary,
      } : null;
    }).filter((file): file is NonNullable<typeof file> => Boolean(file));
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
      files,
      activationEligible: item.status === 'reviewed' && credential?.status === 'pending'
        && files.length === expectedDocumentCount,
    };
  });
  const base = listItem(batch, items, lookup);
  return {
    ...base,
    processingChunkSize: Number(batch.processing_chunk_size),
    startedAt: batch.started_at,
    finishedAt: batch.finished_at,
    items: reviewItems,
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
