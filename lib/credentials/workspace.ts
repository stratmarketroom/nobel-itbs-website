import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { listCredentialFiles } from '@/lib/credentials/files';
import { getCredentialActivationDraft } from '@/lib/credentials/activation';
import type { CredentialEmailSendItem } from '@/lib/credentials/activation-types';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import type {
  CredentialAdminDetail,
  CredentialAdminListItem,
  CredentialHistoryItem,
  CredentialNoteItem,
  CredentialReferenceData,
  CredentialSetAdminItem,
  DocumentNumberAdminItem,
} from '@/lib/credentials/workspace-types';

type Lookup = {
  learners: Map<string, string>;
  programmes: Map<string, string>;
  runs: Map<string, string>;
  types: Map<string, string>;
};

type CredentialRow = {
  id: string; credential_set_id: string; learner_id: string; programme_id: string; programme_run_id: string | null;
  credential_type_id: string; language_code: 'en' | 'ua' | 'cz'; status: CredentialAdminListItem['status'];
  issue_date: string; document_number: string; public_holder_name: string; public_programme_title: string;
  public_credential_type: string; activated_at: string | null; revoked_at: string | null; revocation_reason: string | null;
  voided_at: string | null; void_reason: string | null; created_at: string; updated_at: string;
};

const credentialSelect = `id, credential_set_id, learner_id, programme_id, programme_run_id, credential_type_id,
  language_code, status, issue_date, document_number, public_holder_name, public_programme_title,
  public_credential_type, activated_at, revoked_at, revocation_reason, voided_at, void_reason, created_at, updated_at`;

function client(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Credential workspace operation is not permitted.');
  if (error?.code === '22023' || error?.code === '22P02' || error?.code === '23503' || error?.code === '23514') {
    return new ApiError('bad_request', 400, fallback);
  }
  return new ApiError('server_error', 500, fallback);
}

async function lookups(db: SupabaseClient): Promise<Lookup> {
  const [learners, programmes, translations, runs, types, typeTranslations] = await Promise.all([
    db.from('learners').select('id, latin_first_name, latin_last_name'),
    db.from('programmes').select('id, slug'),
    db.from('programme_translations').select('programme_id, title').eq('language_code', 'en'),
    db.from('programme_runs').select('id, status, starts_at, ends_at'),
    db.from('credential_types').select('id, code'),
    db.from('credential_type_translations').select('credential_type_id, display_name').eq('language_code', 'en'),
  ]);
  for (const result of [learners, programmes, translations, runs, types, typeTranslations]) {
    if (result.error) throw databaseError(result.error, 'Credential reference data could not be loaded.');
  }
  const programmeTitles = new Map((translations.data ?? []).map((row) => [row.programme_id, row.title]));
  const typeLabels = new Map((typeTranslations.data ?? []).map((row) => [row.credential_type_id, row.display_name]));
  return {
    learners: new Map((learners.data ?? []).map((row) => [row.id, `${row.latin_first_name} ${row.latin_last_name}`])),
    programmes: new Map((programmes.data ?? []).map((row) => [row.id, programmeTitles.get(row.id) ?? row.slug])),
    runs: new Map((runs.data ?? []).map((row) => [row.id, runLabel(row.status, row.starts_at, row.ends_at)])),
    types: new Map((types.data ?? []).map((row) => [row.id, typeLabels.get(row.id) ?? row.code])),
  };
}

function runLabel(status: string, startsAt: string | null, endsAt: string | null): string {
  const dates = [startsAt, endsAt].filter(Boolean).join(' — ');
  return dates ? `${status} · ${dates}` : status;
}

function toCredential(row: CredentialRow, lookup: Lookup): CredentialAdminListItem {
  return {
    id: row.id,
    credentialSetId: row.credential_set_id,
    learnerId: row.learner_id,
    learnerName: lookup.learners.get(row.learner_id) ?? row.public_holder_name,
    programmeId: row.programme_id,
    programmeTitle: lookup.programmes.get(row.programme_id) ?? row.public_programme_title,
    programmeRunId: row.programme_run_id,
    credentialTypeId: row.credential_type_id,
    credentialType: lookup.types.get(row.credential_type_id) ?? row.public_credential_type,
    languageCode: row.language_code,
    status: row.status,
    issueDate: row.issue_date,
    documentNumber: row.document_number,
    publicHolderName: row.public_holder_name,
    publicProgrammeTitle: row.public_programme_title,
    publicCredentialType: row.public_credential_type,
    activatedAt: row.activated_at,
    revokedAt: row.revoked_at,
    revocationReason: row.revocation_reason,
    voidedAt: row.voided_at,
    voidReason: row.void_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCredentials(context: AdminContext): Promise<CredentialAdminListItem[]> {
  const db = client(context);
  const [lookup, result] = await Promise.all([
    lookups(db),
    db.from('credentials').select(credentialSelect).order('updated_at', { ascending: false }).limit(500),
  ]);
  if (result.error) throw databaseError(result.error, 'Credentials could not be loaded.');
  return ((result.data ?? []) as CredentialRow[]).map((row) => toCredential(row, lookup));
}

export async function getCredentialDetail(context: AdminContext, credentialId: string, requestOrigin: string): Promise<CredentialAdminDetail> {
  const db = client(context);
  const [lookup, credentialResult, filesResult, historyResult, notesResult, sendsResult, activationDraft] = await Promise.all([
    lookups(db),
    db.from('credentials').select(credentialSelect).eq('id', credentialId).maybeSingle(),
    listCredentialFiles(context, credentialId),
    db.from('credential_history').select('id, event_type, actor_id, reason, before_data, after_data, created_at').eq('credential_id', credentialId).order('created_at', { ascending: false }).limit(250),
    db.from('credential_notes').select('id, author_id, body, deleted_at, created_at, updated_at').eq('credential_id', credentialId).order('created_at', { ascending: false }).limit(250),
    db.from('credential_email_sends').select('id, recipient_email, subject, body, status, technical_error, sent_by, sent_at, files').eq('credential_id', credentialId).order('sent_at', { ascending: false }).limit(100),
    getCredentialActivationDraft(context, credentialId, requestOrigin),
  ]);
  if (credentialResult.error) throw databaseError(credentialResult.error, 'Credential could not be loaded.');
  if (!credentialResult.data) throw new ApiError('not_found', 404, 'Credential was not found.');
  if (historyResult.error) throw databaseError(historyResult.error, 'Credential history could not be loaded.');
  if (notesResult.error) throw databaseError(notesResult.error, 'Credential notes could not be loaded.');
  if (sendsResult.error) throw databaseError(sendsResult.error, 'Credential delivery history could not be loaded.');
  const canAdminDelete = context.roles.includes('owner') || context.roles.includes('super_admin');
  return {
    ...toCredential(credentialResult.data as CredentialRow, lookup),
    ...filesResult,
    history: (historyResult.data ?? []).map((row): CredentialHistoryItem => ({
      id: row.id, eventType: row.event_type, actorId: row.actor_id, reason: row.reason,
      beforeData: row.before_data, afterData: row.after_data, createdAt: row.created_at,
    })),
    notes: (notesResult.data ?? []).map((row): CredentialNoteItem => ({
      id: row.id, authorId: row.author_id, body: row.body, deletedAt: row.deleted_at,
      createdAt: row.created_at, updatedAt: row.updated_at,
      canEdit: row.author_id === context.user.id && row.deleted_at === null,
      canDelete: (row.author_id === context.user.id || canAdminDelete) && row.deleted_at === null,
    })),
    emailSends: (sendsResult.data ?? []).map((row): CredentialEmailSendItem => ({
      id: row.id,
      recipientEmail: row.recipient_email,
      subject: row.subject,
      body: row.body,
      status: row.status,
      technicalError: row.technical_error,
      sentBy: row.sent_by,
      sentAt: row.sent_at,
      files: Array.isArray(row.files) ? row.files.map((file) => {
        const item = file as Record<string, unknown>;
        return {
          fileId: String(item.file_id ?? ''),
          fileTypeId: String(item.file_type_id ?? ''),
          fileType: String(item.file_type ?? ''),
          filename: String(item.filename ?? ''),
          sizeBytes: Number(item.size_bytes ?? 0),
          isPrimary: item.is_primary === true,
        };
      }) : [],
    })),
    activationDraft,
  };
}

export async function getCredentialReferences(context: AdminContext): Promise<CredentialReferenceData> {
  const db = client(context);
  const [learners, programmes, translations, runs, types, typeTranslations] = await Promise.all([
    db.from('learners').select('id, latin_first_name, latin_last_name, archived_at').order('latin_last_name'),
    db.from('programmes').select('id, slug').eq('publication_status', 'published').order('slug'),
    db.from('programme_translations').select('programme_id, title').eq('language_code', 'en').eq('translation_status', 'published'),
    db.from('programme_runs').select('id, programme_id, status, starts_at, ends_at').order('starts_at'),
    db.from('credential_types').select('id, code, document_letter').eq('is_active', true).order('code'),
    db.from('credential_type_translations').select('credential_type_id, display_name').eq('language_code', 'en'),
  ]);
  for (const result of [learners, programmes, translations, runs, types, typeTranslations]) {
    if (result.error) throw databaseError(result.error, 'Credential reference data could not be loaded.');
  }
  const title = new Map((translations.data ?? []).map((row) => [row.programme_id, row.title]));
  const typeLabel = new Map((typeTranslations.data ?? []).map((row) => [row.credential_type_id, row.display_name]));
  return {
    learners: (learners.data ?? []).map((row) => ({ id: row.id, name: `${row.latin_first_name} ${row.latin_last_name}`, archived: Boolean(row.archived_at) })),
    programmes: (programmes.data ?? []).map((row) => ({ id: row.id, title: title.get(row.id) ?? row.slug })),
    programmeRuns: (runs.data ?? []).map((row) => ({ id: row.id, programmeId: row.programme_id, label: runLabel(row.status, row.starts_at, row.ends_at) })),
    credentialTypes: (types.data ?? []).map((row) => ({ id: row.id, code: row.code, label: typeLabel.get(row.id) ?? row.code, documentLetter: row.document_letter })),
    canUseManualNumber: context.roles.includes('owner') || context.roles.includes('super_admin'),
  };
}

export async function listCredentialSets(context: AdminContext): Promise<CredentialSetAdminItem[]> {
  const db = client(context);
  const [lookup, sets, credentials] = await Promise.all([
    lookups(db),
    db.from('credential_sets').select('id, learner_id, programme_id, programme_run_id, completion_date, created_at').order('created_at', { ascending: false }).limit(500),
    db.from('credentials').select('credential_set_id'),
  ]);
  if (sets.error || credentials.error) throw databaseError(sets.error ?? credentials.error, 'Credential sets could not be loaded.');
  const counts = new Map<string, number>();
  for (const row of credentials.data ?? []) counts.set(row.credential_set_id, (counts.get(row.credential_set_id) ?? 0) + 1);
  return (sets.data ?? []).map((row) => ({
    id: row.id, learnerName: lookup.learners.get(row.learner_id) ?? 'Unknown learner',
    programmeTitle: lookup.programmes.get(row.programme_id) ?? 'Unknown programme',
    programmeRunLabel: row.programme_run_id ? lookup.runs.get(row.programme_run_id) ?? null : null,
    completionDate: row.completion_date, credentialCount: counts.get(row.id) ?? 0, createdAt: row.created_at,
  }));
}

export async function listDocumentNumbers(context: AdminContext): Promise<DocumentNumberAdminItem[]> {
  const db = client(context);
  const [lookup, result] = await Promise.all([
    lookups(db),
    db.from('document_number_log').select('id, document_number, sequence_value, credential_id, credential_type_id, status, is_manual, void_reason, created_at, updated_at').order('sequence_value', { ascending: false }).limit(1000),
  ]);
  if (result.error) throw databaseError(result.error, 'Document number log could not be loaded.');
  return (result.data ?? []).map((row) => ({
    id: row.id, documentNumber: row.document_number, sequenceValue: Number(row.sequence_value),
    credentialId: row.credential_id, credentialType: lookup.types.get(row.credential_type_id) ?? 'Unknown type',
    status: row.status, isManual: row.is_manual, voidReason: row.void_reason,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));
}

function noteFromRow(context: AdminContext, row: Record<string, unknown>): CredentialNoteItem {
  const authorId = String(row.author_id);
  const deletedAt = typeof row.deleted_at === 'string' ? row.deleted_at : null;
  return {
    id: String(row.id), authorId, body: String(row.body), deletedAt,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
    canEdit: authorId === context.user.id && deletedAt === null,
    canDelete: (authorId === context.user.id || context.roles.includes('owner') || context.roles.includes('super_admin')) && deletedAt === null,
  };
}

export async function addCredentialNote(context: AdminContext, credentialId: string, body: string): Promise<CredentialNoteItem> {
  const db = client(context);
  const { data, error } = await db.rpc('add_credential_note', { p_credential_id: credentialId, p_body: body });
  if (error || !data) throw databaseError(error, 'Credential note could not be added.');
  return noteFromRow(context, data as Record<string, unknown>);
}

async function ensureCredentialNote(db: SupabaseClient, credentialId: string, noteId: string): Promise<void> {
  const { data, error } = await db.from('credential_notes').select('id').eq('id', noteId).eq('credential_id', credentialId).maybeSingle();
  if (error) throw databaseError(error, 'Credential note could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Credential note was not found.');
}

export async function updateCredentialNote(context: AdminContext, credentialId: string, noteId: string, body: string): Promise<CredentialNoteItem> {
  const db = client(context);
  await ensureCredentialNote(db, credentialId, noteId);
  const { data, error } = await db.rpc('update_credential_note', { p_note_id: noteId, p_body: body });
  if (error || !data) throw databaseError(error, 'Credential note could not be updated.');
  return noteFromRow(context, data as Record<string, unknown>);
}

export async function deleteCredentialNote(context: AdminContext, credentialId: string, noteId: string): Promise<CredentialNoteItem> {
  const db = client(context);
  await ensureCredentialNote(db, credentialId, noteId);
  const { data, error } = await db.rpc('delete_credential_note', { p_note_id: noteId });
  if (error || !data) throw databaseError(error, 'Credential note could not be deleted.');
  return noteFromRow(context, data as Record<string, unknown>);
}
