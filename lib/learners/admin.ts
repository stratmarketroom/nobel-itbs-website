import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageLearners,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import type { LearnerAdminItem, LearnerConflictReference } from '@/lib/learners/types';
import { collectPaginatedRows } from '@/lib/credentials/pagination';

type LearnerRow = {
  id: string;
  latin_first_name: string;
  latin_last_name: string;
  ukrainian_full_name: string;
  internal_note: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  learner_emails: Array<{ id: string; email: string; is_primary: boolean; created_at: string; updated_at: string }> | null;
  learner_phones: Array<{
    id: string;
    phone: string;
    has_telegram: boolean;
    telegram_username: string | null;
    has_viber: boolean;
    has_whatsapp: boolean;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
  }> | null;
  credentials: Array<{
    id: string;
    document_number: string;
    status: 'pending' | 'valid' | 'revoked' | 'voided';
    issue_date: string;
    public_programme_title: string;
    public_credential_type: string;
    created_at: string;
  }> | null;
};

export type LearnerListFilters = {
  query?: string;
  archived?: 'active' | 'archived' | 'all';
  limit?: number;
  offset?: number;
};
export type LearnerContactKind = 'email' | 'phone';

const learnerSelect = `id, latin_first_name, latin_last_name, ukrainian_full_name, internal_note, archived_at, created_at, updated_at,
  learner_emails (id, email, is_primary, created_at, updated_at),
  learner_phones (id, phone, has_telegram, telegram_username, has_viber, has_whatsapp, is_primary, created_at, updated_at),
  credentials (id, document_number, status, issue_date, public_programme_title, public_credential_type, created_at)`;

function client(context: AdminContext): SupabaseClient {
  assertCanManageLearners(context);
  return getSupabaseRequestClient(context.accessToken);
}

function toItem(row: LearnerRow): LearnerAdminItem {
  return {
    id: row.id,
    latinFirstName: row.latin_first_name,
    latinLastName: row.latin_last_name,
    ukrainianFullName: row.ukrainian_full_name,
    internalNote: row.internal_note,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    emails: (row.learner_emails ?? []).map((email) => ({
      id: email.id,
      email: email.email,
      isPrimary: email.is_primary,
      createdAt: email.created_at,
      updatedAt: email.updated_at,
    })).sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary) || left.email.localeCompare(right.email)),
    phones: (row.learner_phones ?? []).map((phone) => ({
      id: phone.id,
      phone: phone.phone,
      hasTelegram: phone.has_telegram,
      telegramUsername: phone.telegram_username,
      hasViber: phone.has_viber,
      hasWhatsapp: phone.has_whatsapp,
      isPrimary: phone.is_primary,
      createdAt: phone.created_at,
      updatedAt: phone.updated_at,
    })).sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary) || left.phone.localeCompare(right.phone)),
    credentials: (row.credentials ?? []).map((credential) => ({
      id: credential.id,
      documentNumber: credential.document_number,
      status: credential.status,
      issueDate: credential.issue_date,
      programmeTitle: credential.public_programme_title,
      credentialType: credential.public_credential_type,
      createdAt: credential.created_at,
    })).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  };
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '23514' || error?.code === '22P02') return new ApiError('bad_request', 400, fallback);
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Learner operation is not permitted.');
  return new ApiError('server_error', 500, fallback);
}

async function conflictReference(db: SupabaseClient, kind: LearnerContactKind, value: string): Promise<LearnerConflictReference | null> {
  const table = kind === 'email' ? 'learner_emails' : 'learner_phones';
  const column = kind === 'email' ? 'email' : 'phone';
  const { data: contact } = await db.from(table).select('learner_id').eq(column, value).maybeSingle();
  if (!contact?.learner_id) return null;
  const { data: learner } = await db.from('learners').select('id, latin_first_name, latin_last_name').eq('id', contact.learner_id).maybeSingle();
  return learner ? { id: learner.id, displayName: `${learner.latin_first_name} ${learner.latin_last_name}` } : null;
}

async function contactError(db: SupabaseClient, kind: LearnerContactKind, value: string, error: { code?: string } | null): Promise<ApiError> {
  if (error?.code === '23505') {
    const learner = await conflictReference(db, kind, value);
    return new ApiError(
      'conflict',
      409,
      `This ${kind} is already assigned to another learner.`,
      learner ? { learner } : undefined,
    );
  }
  return databaseError(error, `Learner ${kind} could not be saved.`);
}

export async function listLearners(context: AdminContext, filters: LearnerListFilters): Promise<{ learners: LearnerAdminItem[]; total: number }> {
  const db = client(context);
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const offset = Math.max(filters.offset ?? 0, 0);
  const needle = filters.query?.trim().toLocaleLowerCase() ?? '';

  if (!needle) {
    let query = db.from('learners').select(learnerSelect, { count: 'exact' });
    if (filters.archived === 'archived') query = query.not('archived_at', 'is', null);
    else if (filters.archived !== 'all') query = query.is('archived_at', null);
    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw databaseError(error, 'Learners could not be loaded.');
    const rows = (data ?? []) as unknown as LearnerRow[];
    return { learners: rows.map(toItem), total: count ?? rows.length };
  }

  type SearchRow = Pick<LearnerRow, 'id' | 'latin_first_name' | 'latin_last_name' | 'ukrainian_full_name' | 'learner_emails' | 'learner_phones'>;
  const matches = await collectPaginatedRows<SearchRow>(async (from, to) => {
    let query = db.from('learners').select(`id, latin_first_name, latin_last_name, ukrainian_full_name,
      learner_emails (email), learner_phones (phone)`);
    if (filters.archived === 'archived') query = query.not('archived_at', 'is', null);
    else if (filters.archived !== 'all') query = query.is('archived_at', null);
    const result = await query.order('updated_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
    if (result.error) throw databaseError(result.error, 'Learners could not be searched.');
    return (result.data ?? []) as unknown as SearchRow[];
  });
  const matchingIds = matches.filter((row) => [
    row.latin_first_name,
    row.latin_last_name,
    row.ukrainian_full_name,
    ...(row.learner_emails ?? []).map(({ email }) => email),
    ...(row.learner_phones ?? []).map(({ phone }) => phone),
  ].some((value) => value.toLocaleLowerCase().includes(needle))).map(({ id }) => id);
  const pageIds = matchingIds.slice(offset, offset + limit);
  if (pageIds.length === 0) return { learners: [], total: matchingIds.length };

  const { data, error } = await db.from('learners').select(learnerSelect).in('id', pageIds);
  if (error) throw databaseError(error, 'Learners could not be loaded.');
  const items = new Map(((data ?? []) as unknown as LearnerRow[]).map((row) => [row.id, toItem(row)]));
  return { learners: pageIds.flatMap((id) => items.get(id) ? [items.get(id)!] : []), total: matchingIds.length };
}

export async function getLearner(context: AdminContext, id: string): Promise<LearnerAdminItem> {
  const { data, error } = await client(context).from('learners').select(learnerSelect).eq('id', id).maybeSingle();
  if (error) throw databaseError(error, 'Learner could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Learner was not found.');
  return toItem(data as unknown as LearnerRow);
}

export async function createLearner(context: AdminContext, input: Record<string, unknown>): Promise<LearnerAdminItem> {
  const { data, error } = await client(context).from('learners').insert(input).select('id').single();
  if (error || !data) throw databaseError(error, 'Learner could not be created.');
  return getLearner(context, data.id);
}

export async function updateLearner(context: AdminContext, id: string, input: Record<string, unknown>): Promise<LearnerAdminItem> {
  const { data, error } = await client(context).from('learners').update(input).eq('id', id).select('id').maybeSingle();
  if (error) throw databaseError(error, 'Learner could not be updated.');
  if (!data) throw new ApiError('not_found', 404, 'Learner was not found.');
  return getLearner(context, id);
}

async function ensureContact(db: SupabaseClient, kind: LearnerContactKind, learnerId: string, contactId: string) {
  const table = kind === 'email' ? 'learner_emails' : 'learner_phones';
  const { data, error } = await db.from(table).select('id').eq('id', contactId).eq('learner_id', learnerId).maybeSingle();
  if (error) throw databaseError(error, `Learner ${kind} could not be loaded.`);
  if (!data) throw new ApiError('not_found', 404, `Learner ${kind} was not found.`);
}

async function setPrimary(db: SupabaseClient, kind: LearnerContactKind, learnerId: string, contactId: string) {
  const table = kind === 'email' ? 'learner_emails' : 'learner_phones';
  await ensureContact(db, kind, learnerId, contactId);
  const cleared = await db.from(table).update({ is_primary: false }).eq('learner_id', learnerId).eq('is_primary', true);
  if (cleared.error) throw databaseError(cleared.error, `Primary ${kind} could not be changed.`);
  const selected = await db.from(table).update({ is_primary: true }).eq('id', contactId).eq('learner_id', learnerId);
  if (selected.error) throw databaseError(selected.error, `Primary ${kind} could not be changed.`);
}

export async function createLearnerContact(context: AdminContext, learnerId: string, kind: LearnerContactKind, input: Record<string, unknown>): Promise<LearnerAdminItem> {
  const db = client(context);
  const table = kind === 'email' ? 'learner_emails' : 'learner_phones';
  const valueColumn = kind === 'email' ? 'email' : 'phone';
  const wantsPrimary = input.is_primary === true;
  const insert = { ...input, learner_id: learnerId, is_primary: false };
  const { data, error } = await db.from(table).insert(insert).select('id').single();
  if (error || !data) throw await contactError(db, kind, String(input[valueColumn] ?? ''), error);
  if (wantsPrimary) await setPrimary(db, kind, learnerId, data.id);
  return getLearner(context, learnerId);
}

export async function updateLearnerContact(context: AdminContext, learnerId: string, kind: LearnerContactKind, contactId: string, input: Record<string, unknown>): Promise<LearnerAdminItem> {
  const db = client(context);
  const table = kind === 'email' ? 'learner_emails' : 'learner_phones';
  const valueColumn = kind === 'email' ? 'email' : 'phone';
  await ensureContact(db, kind, learnerId, contactId);
  const wantsPrimary = input.is_primary === true;
  const update = { ...input };
  if (wantsPrimary) delete update.is_primary;
  if (Object.keys(update).length) {
    const { error } = await db.from(table).update(update).eq('id', contactId).eq('learner_id', learnerId);
    if (error) throw await contactError(db, kind, String(input[valueColumn] ?? ''), error);
  }
  if (wantsPrimary) await setPrimary(db, kind, learnerId, contactId);
  return getLearner(context, learnerId);
}

export async function deleteLearnerContact(context: AdminContext, learnerId: string, kind: LearnerContactKind, contactId: string): Promise<LearnerAdminItem> {
  const db = client(context);
  const table = kind === 'email' ? 'learner_emails' : 'learner_phones';
  const { data, error } = await db.from(table).delete().eq('id', contactId).eq('learner_id', learnerId).select('id').maybeSingle();
  if (error) throw databaseError(error, `Learner ${kind} could not be removed.`);
  if (!data) throw new ApiError('not_found', 404, `Learner ${kind} was not found.`);
  return getLearner(context, learnerId);
}
