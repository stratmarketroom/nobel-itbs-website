import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateCredentialPdfPackage } from '@/lib/credential-templates/pdf-generation';
import {
  CredentialPdfGenerationError,
  type GeneratedCredentialPdf,
} from '@/lib/credential-templates/pdf-generation-types';
import type { TemplatePlacement } from '@/lib/credential-templates/admin-types';
import { createCredentialTokenRpcMaterial, decryptCredentialVerificationUrl } from '@/lib/credentials/token';
import type {
  CredentialGenerationState,
  CredentialGenerationTemplateOption,
  CurrentCredentialGeneration,
  GenerateCredentialResult,
} from '@/lib/credentials/generation-types';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseAdminClient,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';

const templateBucket = 'credential-templates';
const credentialBucket = 'private-credentials';

type CredentialRow = {
  id: string;
  credential_set_id: string;
  programme_id: string;
  programme_run_id: string | null;
  credential_type_id: string;
  language_code: 'en' | 'ua' | 'cz';
  status: 'pending' | 'valid' | 'revoked' | 'voided';
  issue_date: string;
  document_number: string;
  verification_token_encrypted: string;
  token_encryption_key_version: number;
  public_holder_name: string;
  public_programme_title: string;
  public_credential_type: string;
};

type PackageRow = {
  id: string;
  programme_id: string;
  programme_run_id: string | null;
  credential_type_id: string;
  language_code: string;
  variant_code: string;
  display_name: string;
};

type VersionRow = {
  id: string;
  template_package_id: string;
  version_number: number;
  status: 'published' | 'retired';
};

type DocumentRow = {
  id: string;
  template_version_id: string;
  file_type_id: string;
  admin_label: string;
  output_filename_pattern: string;
  sort_order: number;
  is_primary: boolean;
  page_count: number;
  source_sha256?: string;
};

type PlacementRow = {
  id: string;
  template_document_id: string;
  page_number: number;
  field_key: TemplatePlacement['fieldKey'];
  occurrence_order: number;
  x_points: number | string;
  y_points: number | string;
  width_points: number | string;
  height_points: number | string;
  font_family: string | null;
  font_size_points: number | string | null;
  min_font_size_points: number | string | null;
  font_weight: number | null;
  font_color: string | null;
  text_alignment: TemplatePlacement['textAlignment'];
  fit_mode: TemplatePlacement['fitMode'];
  date_format: string | null;
  static_text: string | null;
  is_required: boolean;
};

type ProvenanceRow = {
  credential_file_id: string;
  template_version_id: string;
  template_document_id: string;
  generation_attempt: number;
  generated_at: string;
};

type CurrentFileRow = { id: string };

type PersistedOutput = {
  fileId: string;
  path: string;
  previousBytes: ArrayBuffer | null;
};

class AmbiguousGenerationCompletionError extends Error {}

function requestClient(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function databaseError(error: { code?: string; message?: string } | null, fallback: string): ApiError {
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Credential generation is not permitted.');
  if (error?.code === 'P0002') return new ApiError('not_found', 404, fallback);
  if (error?.code === '55P03' || error?.code === '40001' || error?.code === '23505') {
    return new ApiError('conflict', 409, error.message || 'Credential generation state changed. Retry from the current record.');
  }
  if (['22023', '22P02', '23503', '23514'].includes(error?.code ?? '')) {
    return new ApiError('bad_request', 400, error?.message || fallback);
  }
  return new ApiError('server_error', 500, fallback);
}

function placement(row: PlacementRow): TemplatePlacement {
  return {
    id: row.id,
    pageNumber: Number(row.page_number),
    fieldKey: row.field_key,
    occurrenceOrder: Number(row.occurrence_order),
    xPoints: Number(row.x_points),
    yPoints: Number(row.y_points),
    widthPoints: Number(row.width_points),
    heightPoints: Number(row.height_points),
    fontFamily: row.font_family,
    fontSizePoints: row.font_size_points === null ? null : Number(row.font_size_points),
    minFontSizePoints: row.min_font_size_points === null ? null : Number(row.min_font_size_points),
    fontWeight: row.font_weight,
    fontColor: row.font_color,
    textAlignment: row.text_alignment,
    fitMode: row.fit_mode,
    dateFormat: row.date_format,
    staticText: row.static_text,
    isRequired: row.is_required,
  };
}

function exactPublicOrigin(requestOrigin: string): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim() || requestOrigin;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('unsafe origin');
    }
    return url.origin;
  } catch {
    throw new ApiError('server_error', 500, 'An absolute HTTPS PUBLIC_SITE_URL is required for credential QR generation.');
  }
}

function templatePath(versionId: string, documentId: string): string {
  return `${versionId}/${documentId}.pdf`;
}

function credentialPath(credentialId: string, fileId: string): string {
  return `${credentialId}/${fileId}.pdf`;
}

function runLabel(status: string, startsAt: string | null, endsAt: string | null): string {
  const dates = [startsAt, endsAt].filter(Boolean).join(' - ');
  return dates ? `${status} - ${dates}` : status;
}

function latestProvenance(rows: ProvenanceRow[]): ProvenanceRow[] {
  const latest = new Map<string, ProvenanceRow>();
  for (const row of rows) {
    const current = latest.get(row.credential_file_id);
    if (!current || row.generation_attempt > current.generation_attempt) latest.set(row.credential_file_id, row);
  }
  return [...latest.values()];
}

export async function getCredentialGenerationState(
  context: AdminContext,
  credentialId: string,
): Promise<CredentialGenerationState> {
  const db = requestClient(context);
  const credentialResult = await db
    .from('credentials')
    .select('id, programme_id, programme_run_id, credential_type_id, language_code, status')
    .eq('id', credentialId)
    .maybeSingle();
  if (credentialResult.error) throw databaseError(credentialResult.error, 'Credential generation context could not be loaded.');
  if (!credentialResult.data) throw new ApiError('not_found', 404, 'Credential was not found.');
  const credential = credentialResult.data as Pick<CredentialRow, 'id' | 'programme_id' | 'programme_run_id' | 'credential_type_id' | 'language_code' | 'status'>;

  const [filesResult, packagesResult] = await Promise.all([
    db.from('credential_files').select('id').eq('credential_id', credentialId),
    db.from('credential_template_packages')
      .select('id, programme_id, programme_run_id, credential_type_id, language_code, variant_code, display_name')
      .eq('programme_id', credential.programme_id)
      .eq('credential_type_id', credential.credential_type_id)
      .eq('language_code', credential.language_code),
  ]);
  if (filesResult.error || packagesResult.error) {
    throw databaseError(filesResult.error ?? packagesResult.error, 'Credential generation templates could not be loaded.');
  }
  const currentFiles = (filesResult.data ?? []) as CurrentFileRow[];
  const packages = ((packagesResult.data ?? []) as PackageRow[]).filter((item) => (
    item.programme_run_id === null || item.programme_run_id === credential.programme_run_id
  ));
  const packageIds = packages.map((item) => item.id);
  const provenanceResult = currentFiles.length
    ? await db.from('credential_file_generations')
      .select('credential_file_id, template_version_id, template_document_id, generation_attempt, generated_at')
      .in('credential_file_id', currentFiles.map((item) => item.id))
    : { data: [], error: null };
  if (provenanceResult.error) throw databaseError(provenanceResult.error, 'Credential generation provenance could not be loaded.');
  const provenance = latestProvenance((provenanceResult.data ?? []) as ProvenanceRow[]);
  const provenanceVersionIds = [...new Set(provenance.map((item) => item.template_version_id))];
  const provenanceAttempts = [...new Set(provenance.map((item) => Number(item.generation_attempt)))];

  const versionsResult = packageIds.length
    ? await db.from('credential_template_versions')
      .select('id, template_package_id, version_number, status')
      .in('template_package_id', packageIds)
      .in('status', ['published', 'retired'])
      .order('version_number', { ascending: false })
    : { data: [], error: null };
  if (versionsResult.error) throw databaseError(versionsResult.error, 'Credential template versions could not be loaded.');
  const versions = (versionsResult.data ?? []) as VersionRow[];
  const versionIds = versions.map((item) => item.id);
  const documentsResult = versionIds.length
    ? await db.from('credential_template_documents')
      .select('id, template_version_id, file_type_id, admin_label, output_filename_pattern, sort_order, is_primary, page_count')
      .in('template_version_id', versionIds)
      .order('sort_order')
    : { data: [], error: null };
  if (documentsResult.error) throw databaseError(documentsResult.error, 'Credential template documents could not be loaded.');
  const documents = (documentsResult.data ?? []) as DocumentRow[];

  const options: CredentialGenerationTemplateOption[] = versions
    .filter((version) => version.status === 'published')
    .map((version) => {
      const templatePackage = packages.find((item) => item.id === version.template_package_id)!;
      const versionDocuments = documents.filter((item) => item.template_version_id === version.id);
      return {
        templatePackageId: templatePackage.id,
        templateVersionId: version.id,
        displayName: templatePackage.display_name,
        variantCode: templatePackage.variant_code,
        versionNumber: version.version_number,
        programmeRunId: templatePackage.programme_run_id,
        documentCount: versionDocuments.length,
        pageCount: versionDocuments.reduce((sum, item) => sum + Number(item.page_count), 0),
      };
    });

  let current: CurrentCredentialGeneration | null = null;
  if (
    currentFiles.length > 0
    && provenance.length === currentFiles.length
    && provenanceVersionIds.length === 1
    && provenanceAttempts.length === 1
  ) {
    const version = versions.find((item) => item.id === provenanceVersionIds[0]);
    const templatePackage = version ? packages.find((item) => item.id === version.template_package_id) : null;
    if (version && templatePackage) {
      const attempt = Math.max(...provenance.map((item) => Number(item.generation_attempt)));
      current = {
        templatePackageId: templatePackage.id,
        templateVersionId: version.id,
        templateDisplayName: templatePackage.display_name,
        variantCode: templatePackage.variant_code,
        versionNumber: Number(version.version_number),
        versionStatus: version.status,
        generationAttempt: attempt,
        generatedAt: provenance.reduce((latest, item) => item.generated_at > latest ? item.generated_at : latest, provenance[0].generated_at),
        files: [...provenance]
          .sort((a, b) => {
            const left = documents.find((candidate) => candidate.id === a.template_document_id)?.sort_order ?? 0;
            const right = documents.find((candidate) => candidate.id === b.template_document_id)?.sort_order ?? 0;
            return Number(left) - Number(right);
          })
          .map((item) => {
            const document = documents.find((candidate) => candidate.id === item.template_document_id);
            return document ? {
              credentialFileId: item.credential_file_id,
              templateDocumentId: document.id,
              adminLabel: document.admin_label,
              outputFilename: document.output_filename_pattern,
              pageCount: Number(document.page_count),
              isPrimary: document.is_primary,
            } : null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null),
      };
    }
  }

  let blockedReason: string | null = null;
  if (credential.status !== 'pending') blockedReason = 'Automatic generation and regeneration are available only while the credential is pending.';
  else if (currentFiles.length > 0 && !current) blockedReason = 'This credential has manually managed or mixed-provenance PDFs. Remove them before first template generation.';
  else if (!current && options.length === 0) blockedReason = 'No matching published Template Package is available for this programme, run, document type, and language.';

  return {
    eligible: blockedReason === null,
    blockedReason,
    options: current ? options.filter((item) => item.templateVersionId === current.templateVersionId) : options,
    current,
  };
}

async function loadGenerationPlan(
  credentialId: string,
  templateVersionId: string,
  requestOrigin: string,
  isRegeneration: boolean,
) {
  const admin = getSupabaseAdminClient();
  const [credentialResult, versionResult, documentsResult] = await Promise.all([
    admin.from('credentials')
      .select('id, credential_set_id, programme_id, programme_run_id, credential_type_id, language_code, status, issue_date, document_number, verification_token_encrypted, token_encryption_key_version, public_holder_name, public_programme_title, public_credential_type')
      .eq('id', credentialId)
      .maybeSingle(),
    admin.from('credential_template_versions')
      .select('id, template_package_id, version_number, status')
      .eq('id', templateVersionId)
      .maybeSingle(),
    admin.from('credential_template_documents')
      .select('id, template_version_id, file_type_id, admin_label, output_filename_pattern, sort_order, is_primary, page_count, source_sha256')
      .eq('template_version_id', templateVersionId)
      .order('sort_order'),
  ]);
  for (const result of [credentialResult, versionResult, documentsResult]) {
    if (result.error) throw new ApiError('server_error', 500, 'Authorized credential generation data could not be loaded.');
  }
  if (!credentialResult.data || !versionResult.data) throw new ApiError('not_found', 404, 'Credential generation context was not found.');
  const credential = credentialResult.data as CredentialRow;
  const version = versionResult.data as VersionRow;
  const documents = (documentsResult.data ?? []) as DocumentRow[];
  const placementsResult = documents.length
    ? await admin.from('credential_template_field_placements')
      .select('id, template_document_id, page_number, field_key, occurrence_order, x_points, y_points, width_points, height_points, font_family, font_size_points, min_font_size_points, font_weight, font_color, text_alignment, fit_mode, date_format, static_text, is_required')
      .in('template_document_id', documents.map((document) => document.id))
      .order('occurrence_order')
    : { data: [], error: null };
  if (placementsResult.error) {
    throw new ApiError('server_error', 500, 'Authorized credential generation data could not be loaded.');
  }
  const placements = (placementsResult.data ?? []) as PlacementRow[];

  const [setResult, packageResult, runResult, filesResult] = await Promise.all([
    admin.from('credential_sets').select('completion_date').eq('id', credential.credential_set_id).maybeSingle(),
    admin.from('credential_template_packages')
      .select('id, programme_id, programme_run_id, credential_type_id, language_code, variant_code, display_name')
      .eq('id', version.template_package_id)
      .maybeSingle(),
    credential.programme_run_id
      ? admin.from('programme_runs').select('status, starts_at, ends_at').eq('id', credential.programme_run_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.from('credential_files').select('id').eq('credential_id', credentialId),
  ]);
  for (const result of [setResult, packageResult, runResult, filesResult]) {
    if (result.error) throw new ApiError('server_error', 500, 'Credential generation context could not be completed.');
  }
  if (!packageResult.data) throw new ApiError('not_found', 404, 'Credential Template Package was not found.');
  const currentFiles = (filesResult.data ?? []) as CurrentFileRow[];

  let fileIdByDocument = new Map<string, string>();
  if (isRegeneration) {
    const provenanceResult = await admin.from('credential_file_generations')
      .select('credential_file_id, template_version_id, template_document_id, generation_attempt, generated_at')
      .in('credential_file_id', currentFiles.map((item) => item.id));
    if (provenanceResult.error) throw new ApiError('server_error', 500, 'Current generation provenance could not be loaded.');
    fileIdByDocument = new Map(latestProvenance((provenanceResult.data ?? []) as ProvenanceRow[])
      .map((item) => [item.template_document_id, item.credential_file_id]));
  }

  const templateStorage = admin.storage.from(templateBucket);
  const preparedDocuments = await Promise.all(documents.map(async (document) => {
    const source = await templateStorage.download(templatePath(templateVersionId, document.id));
    if (source.error || !source.data) throw new ApiError('server_error', 500, 'A private immutable template source could not be loaded.');
    const fileId = isRegeneration ? fileIdByDocument.get(document.id) : randomUUID();
    if (!fileId) throw new ApiError('conflict', 409, 'Current generated file provenance is incomplete. Reload the credential before retrying.');
    return {
      fileId,
      inputSha256: document.source_sha256 as string,
      templateDocumentId: document.id,
      fileTypeId: document.file_type_id,
      adminLabel: document.admin_label,
      outputFilename: document.output_filename_pattern,
      sortOrder: Number(document.sort_order),
      isPrimary: document.is_primary,
      sourcePdf: new Uint8Array(await source.data.arrayBuffer()),
      placements: placements.filter((item) => item.template_document_id === document.id).map(placement),
    };
  }));

  const verificationPath = decryptCredentialVerificationUrl(
    credential.verification_token_encrypted,
    credential.token_encryption_key_version,
  );
  const run = runResult.data as { status: string; starts_at: string | null; ends_at: string | null } | null;
  return {
    templatePackageId: packageResult.data.id as string,
    credential,
    preparedDocuments,
    renderInput: {
      locale: credential.language_code,
      values: {
        holderName: credential.public_holder_name,
        programmeTitle: credential.public_programme_title,
        credentialType: credential.public_credential_type,
        documentNumber: credential.document_number,
        issueDate: credential.issue_date,
        completionDate: setResult.data?.completion_date ?? null,
        programmeRunLabel: run ? runLabel(run.status, run.starts_at, run.ends_at) : null,
        verificationUrl: new URL(verificationPath, exactPublicOrigin(requestOrigin)).toString(),
      },
      documents: preparedDocuments.map((document) => ({
        templateDocumentId: document.templateDocumentId,
        fileTypeId: document.fileTypeId,
        adminLabel: document.adminLabel,
        outputFilename: document.outputFilename,
        sortOrder: document.sortOrder,
        isPrimary: document.isPrimary,
        sourcePdf: document.sourcePdf,
        placements: document.placements,
      })),
    },
  };
}

function safeFailureCode(error: unknown): string {
  if (error instanceof CredentialPdfGenerationError) return error.code;
  if (error instanceof ApiError) {
    if (error.code === 'conflict') return 'generation_conflict';
    if (error.code === 'server_error') return 'server_failure';
    return 'invalid_generation_request';
  }
  return 'generation_failure';
}

async function rollbackObjects(outputs: PersistedOutput[], isRegeneration: boolean): Promise<void> {
  const storage = getSupabaseAdminClient().storage.from(credentialBucket);
  if (!isRegeneration) {
    if (outputs.length) {
      const removal = await storage.remove(outputs.map((item) => item.path));
      if (removal.error) throw new Error('private generated object cleanup failed');
    }
    return;
  }
  for (const output of outputs) {
    if (!output.previousBytes) continue;
    const restore = await storage.upload(output.path, output.previousBytes, { contentType: 'application/pdf', upsert: true });
    if (restore.error) throw new Error('previous private generated object restore failed');
  }
}

function generationErrorForBrowser(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof CredentialPdfGenerationError) return new ApiError('bad_request', 400, error.message);
  return new ApiError('server_error', 500, 'Credential PDF package could not be generated safely.');
}

export async function generateSingleCredential(
  context: AdminContext,
  credentialId: string,
  templateVersionId: string,
  requestOrigin: string,
): Promise<GenerateCredentialResult> {
  const db = requestClient(context);
  const lockToken = randomUUID();
  const begin = await db.rpc('begin_single_credential_generation', {
    p_credential_id: credentialId,
    p_template_version_id: templateVersionId,
    p_lock_token: lockToken,
  });
  const lease = (begin.data as Array<{ generation_attempt: number; is_regeneration: boolean }> | null)?.[0];
  if (begin.error || !lease) throw databaseError(begin.error, 'Credential generation could not start.');

  const persistedObjects: PersistedOutput[] = [];
  let completionAmbiguous = false;
  try {
    const plan = await loadGenerationPlan(credentialId, templateVersionId, requestOrigin, lease.is_regeneration);
    const generated = await generateCredentialPdfPackage(plan.renderInput);
    const generatedByDocument = new Map(generated.map((item) => [item.templateDocumentId, item]));

    const refresh = await db.rpc('refresh_single_credential_generation', {
      p_credential_id: credentialId,
      p_lock_token: lockToken,
    });
    if (refresh.error) throw databaseError(refresh.error, 'Credential generation lease expired before private file persistence.');

    const storage = getSupabaseAdminClient().storage.from(credentialBucket);
    for (const prepared of plan.preparedDocuments) {
      const output = generatedByDocument.get(prepared.templateDocumentId);
      if (!output) throw new ApiError('server_error', 500, 'Generated package output is incomplete.');
      const path = credentialPath(credentialId, prepared.fileId);
      let previousBytes: ArrayBuffer | null = null;
      if (lease.is_regeneration) {
        const previous = await storage.download(path);
        if (previous.error || !previous.data) throw new ApiError('server_error', 500, 'Current private PDF could not be loaded for safe regeneration.');
        previousBytes = await previous.data.arrayBuffer();
      }
      const upload = await storage.upload(path, output.bytes, {
        contentType: 'application/pdf',
        upsert: lease.is_regeneration,
      });
      if (upload.error) throw new ApiError('server_error', 500, 'Generated private PDF could not be stored.');
      persistedObjects.push({ fileId: prepared.fileId, path, previousBytes });
      const persistenceRefresh = await db.rpc('refresh_single_credential_generation', {
        p_credential_id: credentialId,
        p_lock_token: lockToken,
      });
      if (persistenceRefresh.error) {
        throw databaseError(persistenceRefresh.error, 'Credential generation lease expired during private package persistence.');
      }
    }

    const outputManifest = plan.preparedDocuments.map((prepared) => {
      const output = generatedByDocument.get(prepared.templateDocumentId) as GeneratedCredentialPdf;
      return {
        file_id: prepared.fileId,
        template_document_id: prepared.templateDocumentId,
        file_type_id: output.fileTypeId,
        admin_label: output.adminLabel,
        size_bytes: output.sizeBytes,
        page_count: output.pageCount,
        is_primary: output.isPrimary,
        input_sha256: prepared.inputSha256,
        output_sha256: output.sha256,
      };
    });
    const completion = await db.rpc('complete_single_credential_generation', {
      p_credential_id: credentialId,
      p_lock_token: lockToken,
      p_outputs: outputManifest,
    });
    let value = completion.data as Record<string, unknown> | null;
    if (completion.error || !value) {
      const probe = await db.from('credential_file_generations')
        .select('credential_file_id')
        .eq('template_version_id', templateVersionId)
        .eq('generation_attempt', lease.generation_attempt)
        .in('credential_file_id', persistedObjects.map((item) => item.fileId));
      if (!probe.error && (probe.data?.length ?? 0) === persistedObjects.length) {
        value = {
          template_package_id: plan.templatePackageId,
          template_version_id: templateVersionId,
          generation_attempt: lease.generation_attempt,
          is_regeneration: lease.is_regeneration,
          file_count: generated.length,
          page_count: generated.reduce((sum, item) => sum + item.pageCount, 0),
        };
      } else if (probe.error) {
        completionAmbiguous = true;
        throw new AmbiguousGenerationCompletionError();
      } else {
        throw databaseError(completion.error, 'Generated PDF metadata and provenance could not be persisted.');
      }
    }

    return {
      templatePackageId: String(value.template_package_id ?? ''),
      templateVersionId: String(value.template_version_id),
      generationAttempt: Number(value.generation_attempt),
      isRegeneration: value.is_regeneration === true,
      fileCount: Number(value.file_count),
      pageCount: Number(value.page_count),
    };
  } catch (error) {
    let rollbackFailed = false;
    let failureRecordFailed = false;
    if (!completionAmbiguous) {
      try {
        await rollbackObjects(persistedObjects, lease.is_regeneration);
      } catch {
        rollbackFailed = true;
      }
      try {
        const failure = await db.rpc('fail_single_credential_generation', {
          p_credential_id: credentialId,
          p_lock_token: lockToken,
          p_error_code: safeFailureCode(error),
        });
        failureRecordFailed = Boolean(failure.error);
      } catch {
        failureRecordFailed = true;
      }
    }
    if (rollbackFailed) {
      throw new ApiError('server_error', 500, 'Generation failed and the previous private PDF package could not be restored safely. Stop and inspect the credential before retrying.');
    }
    if (failureRecordFailed) {
      throw new ApiError('server_error', 500, 'Generation failed and its private audit outcome could not be confirmed. Reload and inspect the credential before retrying.');
    }
    if (error instanceof AmbiguousGenerationCompletionError) {
      throw new ApiError('server_error', 500, 'Generation completion could not be confirmed safely. Reload the credential before retrying.');
    }
    throw generationErrorForBrowser(error);
  }
}

export type GenerateCredentialBatchItemResult = {
  outcome: 'generated' | 'conflict';
  credentialId: string | null;
  generationAttempt: number;
  fileCount: number;
  pageCount: number;
};

export async function generateCredentialBatchItem(
  context: AdminContext,
  batchItemId: string,
  requestOrigin: string,
): Promise<GenerateCredentialBatchItemResult> {
  const db = requestClient(context);
  const leaseToken = randomUUID();
  const begin = await db.rpc('begin_credential_generation_batch_item', {
    p_batch_item_id: batchItemId,
    p_lease_token: leaseToken,
  });
  const lease = (begin.data as Array<{
    credential_id: string | null;
    template_version_id: string;
    generation_attempt: number;
  }> | null)?.[0];
  if (begin.error || !lease) throw databaseError(begin.error, 'Batch item generation could not start.');

  let credentialId = lease.credential_id;
  const persistedObjects: PersistedOutput[] = [];
  let completionAmbiguous = false;
  try {
    if (!credentialId) {
      const token = createCredentialTokenRpcMaterial();
      const prepared = await db.rpc('prepare_credential_generation_batch_item', {
        p_batch_item_id: batchItemId,
        p_lease_token: leaseToken,
        p_verification_token_lookup_hash: token.lookup_hash,
        p_verification_token_encrypted: token.encrypted_token,
        p_token_encryption_key_version: token.key_version,
      });
      if (prepared.error) throw databaseError(prepared.error, 'Batch credential could not be prepared.');
      credentialId = typeof prepared.data === 'string' ? prepared.data : null;
      if (!credentialId) {
        return {
          outcome: 'conflict', credentialId: null,
          generationAttempt: Number(lease.generation_attempt), fileCount: 0, pageCount: 0,
        };
      }
    }

    const plan = await loadGenerationPlan(credentialId, lease.template_version_id, requestOrigin, false);
    const generated = await generateCredentialPdfPackage(plan.renderInput);
    const generatedByDocument = new Map(generated.map((item) => [item.templateDocumentId, item]));
    const refresh = await db.rpc('refresh_credential_generation_batch_item', {
      p_batch_item_id: batchItemId,
      p_lease_token: leaseToken,
    });
    if (refresh.error) throw databaseError(refresh.error, 'Batch item lease expired before private file persistence.');

    const storage = getSupabaseAdminClient().storage.from(credentialBucket);
    for (const prepared of plan.preparedDocuments) {
      const output = generatedByDocument.get(prepared.templateDocumentId);
      if (!output) throw new ApiError('server_error', 500, 'Generated batch package output is incomplete.');
      const path = credentialPath(credentialId, prepared.fileId);
      const upload = await storage.upload(path, output.bytes, { contentType: 'application/pdf', upsert: false });
      if (upload.error) throw new ApiError('server_error', 500, 'Generated batch PDF could not be stored privately.');
      persistedObjects.push({ fileId: prepared.fileId, path, previousBytes: null });
      const persistenceRefresh = await db.rpc('refresh_credential_generation_batch_item', {
        p_batch_item_id: batchItemId,
        p_lease_token: leaseToken,
      });
      if (persistenceRefresh.error) {
        throw databaseError(persistenceRefresh.error, 'Batch item lease expired during private package persistence.');
      }
    }

    const outputManifest = plan.preparedDocuments.map((prepared) => {
      const output = generatedByDocument.get(prepared.templateDocumentId) as GeneratedCredentialPdf;
      return {
        file_id: prepared.fileId,
        template_document_id: prepared.templateDocumentId,
        file_type_id: output.fileTypeId,
        admin_label: output.adminLabel,
        size_bytes: output.sizeBytes,
        page_count: output.pageCount,
        is_primary: output.isPrimary,
        input_sha256: prepared.inputSha256,
        output_sha256: output.sha256,
      };
    });
    const completion = await db.rpc('complete_credential_generation_batch_item', {
      p_batch_item_id: batchItemId,
      p_lease_token: leaseToken,
      p_outputs: outputManifest,
    });
    let value = completion.data as Record<string, unknown> | null;
    if (completion.error || !value) {
      const probe = await db.from('credential_file_generations')
        .select('credential_file_id')
        .eq('generation_batch_item_id', batchItemId)
        .eq('generation_attempt', lease.generation_attempt)
        .in('credential_file_id', persistedObjects.map((item) => item.fileId));
      if (!probe.error && (probe.data?.length ?? 0) === persistedObjects.length) {
        value = {
          credential_id: credentialId,
          generation_attempt: lease.generation_attempt,
          file_count: generated.length,
          page_count: generated.reduce((sum, item) => sum + item.pageCount, 0),
        };
      } else if (probe.error) {
        completionAmbiguous = true;
        throw new AmbiguousGenerationCompletionError();
      } else {
        throw databaseError(completion.error, 'Generated batch PDF metadata and provenance could not be persisted.');
      }
    }
    return {
      outcome: 'generated',
      credentialId,
      generationAttempt: Number(value.generation_attempt),
      fileCount: Number(value.file_count),
      pageCount: Number(value.page_count),
    };
  } catch (error) {
    let rollbackFailed = false;
    let failureRecordFailed = false;
    if (!completionAmbiguous) {
      try { await rollbackObjects(persistedObjects, false); }
      catch { rollbackFailed = true; }
      try {
        const failure = await db.rpc('fail_credential_generation_batch_item', {
          p_batch_item_id: batchItemId,
          p_lease_token: leaseToken,
          p_error_code: safeFailureCode(error),
        });
        failureRecordFailed = Boolean(failure.error);
      } catch { failureRecordFailed = true; }
    }
    if (rollbackFailed) {
      throw new ApiError('server_error', 500, 'Batch generation failed and its private PDF objects could not be cleaned up safely. Stop and inspect this item.');
    }
    if (failureRecordFailed) {
      throw new ApiError('server_error', 500, 'Batch generation failed and its retryable outcome could not be confirmed. Reload and inspect this item.');
    }
    if (error instanceof AmbiguousGenerationCompletionError) {
      throw new ApiError('server_error', 500, 'Batch item completion could not be confirmed safely. Reload the batch before retrying.');
    }
    throw generationErrorForBrowser(error);
  }
}
