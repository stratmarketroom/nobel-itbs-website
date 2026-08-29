import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageEmailTemplates,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import type { AdminEmailTemplate, EmailTemplateUpdate } from './types';

type EmailTemplateRow = {
  id: string;
  template_key: 'credential_delivery';
  language_code: 'en' | 'ua';
  subject: string;
  body: string;
  updated_by: string | null;
  updated_at: string;
};

const select = 'id, template_key, language_code, subject, body, updated_by, updated_at';

function client(context: AdminContext): SupabaseClient {
  assertCanManageEmailTemplates(context);
  return getSupabaseRequestClient(context.accessToken);
}

function toTemplate(row: EmailTemplateRow): AdminEmailTemplate {
  return {
    id: row.id,
    templateKey: row.template_key,
    languageCode: row.language_code,
    subject: row.subject,
    body: row.body,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '42501') {
    return new ApiError('forbidden', 403, 'Email template management is not permitted.');
  }
  if (error?.code === 'P0002') {
    return new ApiError('not_found', 404, 'Email template was not found.');
  }
  if (error?.code === '22023' || error?.code === '22P02' || error?.code === '23514') {
    return new ApiError('bad_request', 400, fallback);
  }
  return new ApiError('server_error', 500, fallback);
}

export async function listEmailTemplates(context: AdminContext): Promise<AdminEmailTemplate[]> {
  const { data, error } = await client(context)
    .from('email_templates')
    .select(select)
    .eq('template_key', 'credential_delivery')
    .in('language_code', ['en', 'ua'])
    .order('language_code');

  if (error) throw databaseError(error, 'Email templates could not be loaded.');
  const rows = (data ?? []) as EmailTemplateRow[];
  if (rows.length !== 2) {
    throw new ApiError('server_error', 500, 'Release 1 EN/UA email templates are incomplete.');
  }
  return rows.map(toTemplate);
}

export async function updateEmailTemplate(
  context: AdminContext,
  templateId: string,
  input: EmailTemplateUpdate,
): Promise<AdminEmailTemplate> {
  const db = client(context);
  const { data, error } = await db.rpc('update_email_template', {
    p_template_id: templateId,
    p_subject: input.subject,
    p_body: input.body,
  });

  if (error) throw databaseError(error, 'Email template could not be updated.');
  const row = (Array.isArray(data) ? data[0] : data) as EmailTemplateRow | null;
  if (!row) throw new ApiError('server_error', 500, 'Updated email template could not be loaded.');
  return toTemplate(row);
}
