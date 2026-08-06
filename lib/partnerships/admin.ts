import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageContent,
  getSupabaseRequestClient,
  requiresMfaForRole,
  type AdminContext,
} from '@/lib/supabase/server';

const partnerSelect = `id, slug, partner_type, status, official_url, logo_path, sort_order, created_at, updated_at,
  partner_translations (language_code, translation_status, name, role_label, location, logo_alt, updated_at)`;
const expertSelect = `id, slug, status, photo_path, sort_order, created_at, updated_at,
  expert_translations (language_code, translation_status, name, public_category, expert_role, photo_alt, updated_at)`;

function client(context: AdminContext): SupabaseClient {
  assertCanManageContent(context);
  if (context.roles.some(requiresMfaForRole) && !context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for this admin account.');
  }
  return getSupabaseRequestClient(context.accessToken);
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '23505') return new ApiError('bad_request', 400, 'A record with this slug already exists.');
  if (error?.code === '23503') return new ApiError('bad_request', 400, 'This record is still referenced and should be archived.');
  if (error?.code === '23514' || error?.code === '22P02') return new ApiError('bad_request', 400, fallback);
  return new ApiError('server_error', 500, fallback);
}

async function listRows(context: AdminContext, table: string, select: string) {
  const { data, error } = await client(context).from(table).select(select).order('sort_order');
  if (error) throw databaseError(error, 'Partner content could not be loaded.');
  return data ?? [];
}

async function getRow(context: AdminContext, table: string, select: string, id: string) {
  const { data, error } = await client(context).from(table).select(select).eq('id', id).maybeSingle();
  if (error) throw databaseError(error, 'Partner content could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Content record not found.');
  return data;
}

async function createRow(context: AdminContext, table: string, select: string, input: Record<string, unknown>) {
  const { data, error } = await client(context).from(table).insert(input).select(select).single();
  if (error || !data) throw databaseError(error, 'Content record could not be created.');
  return data;
}

async function updateRow(context: AdminContext, table: string, select: string, id: string, input: Record<string, unknown>) {
  const { data, error } = await client(context).from(table).update(input).eq('id', id).select(select).maybeSingle();
  if (error) throw databaseError(error, 'Content record could not be updated.');
  if (!data) throw new ApiError('not_found', 404, 'Content record not found.');
  return data;
}

async function upsertTranslation(context: AdminContext, table: string, parentTable: string, select: string, parentId: string, conflict: string, input: Record<string, unknown>) {
  const { error } = await client(context).from(table).upsert(input, { onConflict: conflict });
  if (error) throw databaseError(error, 'Translation could not be saved. Check the required published fields.');
  return getRow(context, parentTable, select, parentId);
}

async function deleteRow(context: AdminContext, table: string, id: string) {
  const { data, error } = await client(context).from(table).delete().eq('id', id).select('id').maybeSingle();
  if (error) throw databaseError(error, 'Content record could not be deleted. Archive it if it is referenced.');
  if (!data) throw new ApiError('not_found', 404, 'Content record not found.');
  return { id };
}

export const listPartners = (context: AdminContext) => listRows(context, 'partners', partnerSelect);
export const getPartner = (context: AdminContext, id: string) => getRow(context, 'partners', partnerSelect, id);
export const createPartner = (context: AdminContext, input: Record<string, unknown>) => createRow(context, 'partners', partnerSelect, input);
export const updatePartner = (context: AdminContext, id: string, input: Record<string, unknown>) => updateRow(context, 'partners', partnerSelect, id, input);
export const savePartnerTranslation = (context: AdminContext, id: string, input: Record<string, unknown>) => upsertTranslation(context, 'partner_translations', 'partners', partnerSelect, id, 'partner_id,language_code', input);
export const deletePartner = (context: AdminContext, id: string) => deleteRow(context, 'partners', id);

export const listExperts = (context: AdminContext) => listRows(context, 'experts', expertSelect);
export const getExpert = (context: AdminContext, id: string) => getRow(context, 'experts', expertSelect, id);
export const createExpert = (context: AdminContext, input: Record<string, unknown>) => createRow(context, 'experts', expertSelect, input);
export const updateExpert = (context: AdminContext, id: string, input: Record<string, unknown>) => updateRow(context, 'experts', expertSelect, id, input);
export const saveExpertTranslation = (context: AdminContext, id: string, input: Record<string, unknown>) => upsertTranslation(context, 'expert_translations', 'experts', expertSelect, id, 'expert_id,language_code', input);
export const deleteExpert = (context: AdminContext, id: string) => deleteRow(context, 'experts', id);
