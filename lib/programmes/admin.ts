import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageContent,
  getSupabaseRequestClient,
  requiresMfaForRole,
  type AdminContext,
} from '@/lib/supabase/server';

const areaSelect = `id, slug, status, sort_order, created_at, updated_at,
  programme_area_translations (language_code, translation_status, title, short_description, intro_content, sections, seo_title, seo_description, og_title, og_description, updated_at)`;
const typeSelect = `id, slug, status, sort_order, created_at, updated_at,
  programme_type_translations (language_code, translation_status, title, landing_title, short_description, intro_content, sections, seo_title, seo_description, og_title, og_description, updated_at)`;
const programmeSelect = `id, area_id, type_id, slug, publication_status, format, application_provider, application_url,
  enrolment_badge_override, featured, catalogue_sort_order, instruction_language_codes, created_at, updated_at,
  programme_translations (language_code, translation_status, title, summary, hero_copy, catalogue_description, catalogue_facts, catalogue_document_summary, sections, seo_title, seo_description, og_title, og_description, updated_at),
  programme_runs (id, status, starts_at, ends_at, application_url, created_at, updated_at),
  programme_pricing_options (id, price, currency_code, application_url, sort_order, is_active, created_at, updated_at,
    programme_pricing_option_translations (language_code, translation_status, title, description, cta_label, updated_at))`;
const runSelect = 'id, programme_id, status, starts_at, ends_at, application_url, created_at, updated_at';
const pricingSelect = `id, programme_id, price, currency_code, application_url, sort_order, is_active, created_at, updated_at,
  programme_pricing_option_translations (language_code, translation_status, title, description, cta_label, updated_at)`;

function assertCanReadProgrammes(context: AdminContext): void {
  const allowed = context.roles.some((role) => ['owner', 'super_admin', 'content_manager', 'credential_manager'].includes(role));
  if (!allowed) throw new ApiError('forbidden', 403, 'Programme reference access is not permitted.');
  if (context.roles.some(requiresMfaForRole) && !context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for this admin account.');
  }
}

function assertCanMutateProgrammes(context: AdminContext): void {
  assertCanManageContent(context);
  if (context.roles.some(requiresMfaForRole) && !context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for this admin account.');
  }
}

function requestClient(context: AdminContext): SupabaseClient {
  return getSupabaseRequestClient(context.accessToken);
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '23505') return new ApiError('bad_request', 400, 'A record with this slug or order already exists.');
  if (error?.code === '23503') return new ApiError('bad_request', 400, 'This record is still referenced by another programme record.');
  if (error?.code === '23514' || error?.code === '22P02') return new ApiError('bad_request', 400, fallback);
  return new ApiError('server_error', 500, fallback);
}

async function listRows(context: AdminContext, table: string, select: string, order: string) {
  assertCanReadProgrammes(context);
  const { data, error } = await requestClient(context).from(table).select(select).order(order);
  if (error) throw databaseError(error, 'Programme data could not be loaded.');
  return data ?? [];
}

async function getRow(context: AdminContext, table: string, select: string, id: string) {
  assertCanReadProgrammes(context);
  const { data, error } = await requestClient(context).from(table).select(select).eq('id', id).maybeSingle();
  if (error) throw databaseError(error, 'Programme data could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Programme record not found.');
  return data;
}

async function createRow(context: AdminContext, table: string, input: Record<string, unknown>, select: string) {
  assertCanMutateProgrammes(context);
  const { data, error } = await requestClient(context).from(table).insert(input).select(select).single();
  if (error || !data) throw databaseError(error, 'Programme record could not be created.');
  return data;
}

async function updateRow(context: AdminContext, table: string, id: string, input: Record<string, unknown>, select: string) {
  assertCanMutateProgrammes(context);
  const { data, error } = await requestClient(context).from(table).update(input).eq('id', id).select(select).maybeSingle();
  if (error) throw databaseError(error, 'Programme record could not be updated.');
  if (!data) throw new ApiError('not_found', 404, 'Programme record not found.');
  return data;
}

async function upsertTranslation(
  context: AdminContext,
  table: string,
  input: Record<string, unknown>,
  conflict: string,
  parentTable: string,
  parentSelect: string,
  parentId: string,
) {
  assertCanMutateProgrammes(context);
  const { error } = await requestClient(context).from(table).upsert(input, { onConflict: conflict });
  if (error) throw databaseError(error, 'Translation could not be saved. Check all required published fields.');
  return getRow(context, parentTable, parentSelect, parentId);
}

async function deleteRow(context: AdminContext, table: string, id: string) {
  assertCanMutateProgrammes(context);
  const { data, error } = await requestClient(context).from(table).delete().eq('id', id).select('id').maybeSingle();
  if (error) throw databaseError(error, 'Programme record could not be deleted. Archive it if it is still referenced.');
  if (!data) throw new ApiError('not_found', 404, 'Programme record not found.');
  return { id };
}

export const listProgrammeAreas = (context: AdminContext) => listRows(context, 'programme_areas', areaSelect, 'sort_order');
export const getProgrammeArea = (context: AdminContext, id: string) => getRow(context, 'programme_areas', areaSelect, id);
export const createProgrammeArea = (context: AdminContext, input: Record<string, unknown>) => createRow(context, 'programme_areas', input, areaSelect);
export const updateProgrammeArea = (context: AdminContext, id: string, input: Record<string, unknown>) => updateRow(context, 'programme_areas', id, input, areaSelect);
export const saveProgrammeAreaTranslation = (context: AdminContext, id: string, input: Record<string, unknown>) => upsertTranslation(context, 'programme_area_translations', input, 'area_id,language_code', 'programme_areas', areaSelect, id);
export const deleteProgrammeArea = (context: AdminContext, id: string) => deleteRow(context, 'programme_areas', id);

export const listProgrammeTypes = (context: AdminContext) => listRows(context, 'programme_types', typeSelect, 'sort_order');
export const getProgrammeType = (context: AdminContext, id: string) => getRow(context, 'programme_types', typeSelect, id);
export const createProgrammeType = (context: AdminContext, input: Record<string, unknown>) => createRow(context, 'programme_types', input, typeSelect);
export const updateProgrammeType = (context: AdminContext, id: string, input: Record<string, unknown>) => updateRow(context, 'programme_types', id, input, typeSelect);
export const saveProgrammeTypeTranslation = (context: AdminContext, id: string, input: Record<string, unknown>) => upsertTranslation(context, 'programme_type_translations', input, 'type_id,language_code', 'programme_types', typeSelect, id);
export const deleteProgrammeType = (context: AdminContext, id: string) => deleteRow(context, 'programme_types', id);

export const listProgrammes = (context: AdminContext) => listRows(context, 'programmes', programmeSelect, 'catalogue_sort_order');
export const getProgramme = (context: AdminContext, id: string) => getRow(context, 'programmes', programmeSelect, id);
export const createProgramme = (context: AdminContext, input: Record<string, unknown>) => createRow(context, 'programmes', input, programmeSelect);
export const updateProgramme = (context: AdminContext, id: string, input: Record<string, unknown>) => updateRow(context, 'programmes', id, input, programmeSelect);
export const saveProgrammeTranslation = (context: AdminContext, id: string, input: Record<string, unknown>) => upsertTranslation(context, 'programme_translations', input, 'programme_id,language_code', 'programmes', programmeSelect, id);
export const deleteProgramme = (context: AdminContext, id: string) => deleteRow(context, 'programmes', id);

export const listProgrammeRuns = (context: AdminContext) => listRows(context, 'programme_runs', runSelect, 'starts_at');
export const getProgrammeRun = (context: AdminContext, id: string) => getRow(context, 'programme_runs', runSelect, id);
export const createProgrammeRun = (context: AdminContext, input: Record<string, unknown>) => createRow(context, 'programme_runs', input, runSelect);
export const updateProgrammeRun = (context: AdminContext, id: string, input: Record<string, unknown>) => updateRow(context, 'programme_runs', id, input, runSelect);
export const deleteProgrammeRun = (context: AdminContext, id: string) => deleteRow(context, 'programme_runs', id);

export const listPricingOptions = (context: AdminContext) => listRows(context, 'programme_pricing_options', pricingSelect, 'sort_order');
export const getPricingOption = (context: AdminContext, id: string) => getRow(context, 'programme_pricing_options', pricingSelect, id);
export async function createPricingOption(context: AdminContext, input: Record<string, unknown>) {
  assertCanMutateProgrammes(context);
  const programmeId = input.programme_id;
  if (typeof programmeId !== 'string') throw new ApiError('bad_request', 400, 'Programme ID is required.');
  const { count, error } = await requestClient(context).from('programme_pricing_options')
    .select('id', { count: 'exact', head: true }).eq('programme_id', programmeId);
  if (error) throw databaseError(error, 'Pricing options could not be counted.');
  if ((count ?? 0) >= 3) throw new ApiError('bad_request', 400, 'A programme can have up to three pricing options in Release 1.');
  return createRow(context, 'programme_pricing_options', input, pricingSelect);
}
export const updatePricingOption = (context: AdminContext, id: string, input: Record<string, unknown>) => updateRow(context, 'programme_pricing_options', id, input, pricingSelect);
export const savePricingTranslation = (context: AdminContext, id: string, input: Record<string, unknown>) => upsertTranslation(context, 'programme_pricing_option_translations', input, 'pricing_option_id,language_code', 'programme_pricing_options', pricingSelect, id);
export const deletePricingOption = (context: AdminContext, id: string) => deleteRow(context, 'programme_pricing_options', id);

export async function listProgrammeSlugRedirects(context: AdminContext) {
  assertCanMutateProgrammes(context);
  const { data, error } = await requestClient(context).from('programme_slug_redirects')
    .select('old_slug, new_slug, entity_type, entity_id, created_at').order('created_at', { ascending: false });
  if (error) throw databaseError(error, 'Programme slug redirects could not be loaded.');
  return data ?? [];
}
