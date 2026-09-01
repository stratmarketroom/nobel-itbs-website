import {
  ApiError,
  assertCanAccessContactSubmissions,
  type AdminContext,
  getSupabaseRequestClient,
} from '@/lib/supabase/server';
import type {
  ContactSubmissionAdminItem,
  ContactSubmissionStatus,
  ContactSubmissionType,
} from '@/lib/contact/types';

export {
  contactSubmissionStatuses,
  contactSubmissionTypes,
  type ContactSubmissionStatus,
  type ContactSubmissionType,
} from '@/lib/contact/types';

type ContactSubmissionRow = {
  id: string;
  type: ContactSubmissionType;
  status: ContactSubmissionStatus;
  programme_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  language_code: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ProgrammeReferenceRow = {
  id: string;
  slug: string;
  programme_translations: Array<{
    language_code: string;
    title: string;
    translation_status: string;
  }> | null;
};

export type ContactSubmissionFilters = {
  status?: ContactSubmissionStatus;
  type?: ContactSubmissionType;
  limit?: number;
  offset?: number;
};

function selectProgrammeTitle(programme: ProgrammeReferenceRow, locale: string): string {
  const published = programme.programme_translations?.filter((translation) => (
    translation.translation_status === 'published'
  )) ?? [];

  return published.find((translation) => translation.language_code === locale)?.title
    ?? published.find((translation) => translation.language_code === 'en')?.title
    ?? programme.slug;
}

async function programmeReferences(context: AdminContext, rows: ContactSubmissionRow[]) {
  const programmeIds = [...new Set(rows.flatMap((row) => row.programme_id ? [row.programme_id] : []))];
  if (programmeIds.length === 0) return new Map<string, ProgrammeReferenceRow>();

  const client = getSupabaseRequestClient(context.accessToken);
  const { data, error } = await client
    .from('programmes')
    .select('id, slug, programme_translations(language_code, title, translation_status)')
    .in('id', programmeIds);

  if (error) throw new ApiError('server_error', 500, 'Failed to load programme references.');

  const programmes = (data ?? []) as unknown as ProgrammeReferenceRow[];
  return new Map(programmes.map((programme) => [programme.id, programme]));
}

async function toAdminItems(context: AdminContext, rows: ContactSubmissionRow[]): Promise<ContactSubmissionAdminItem[]> {
  const programmes = await programmeReferences(context, rows);

  return rows.map((row) => {
    const programme = row.programme_id ? programmes.get(row.programme_id) : null;
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      languageCode: row.language_code,
      metadata: row.metadata,
      programme: programme ? {
        slug: programme.slug,
        title: selectProgrammeTitle(programme, row.language_code),
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

const submissionSelect = 'id, type, status, programme_id, name, email, phone, message, language_code, metadata, created_at, updated_at';

export async function listContactSubmissions(
  context: AdminContext,
  filters: ContactSubmissionFilters,
): Promise<{ submissions: ContactSubmissionAdminItem[]; total: number }> {
  assertCanAccessContactSubmissions(context);
  const client = getSupabaseRequestClient(context.accessToken);
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const offset = Math.max(filters.offset ?? 0, 0);
  let query = client
    .from('contact_submissions')
    .select(submissionSelect, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.type) query = query.eq('type', filters.type);

  const { data, error, count } = await query;
  if (error) throw new ApiError('server_error', 500, 'Failed to list contact submissions.');

  const rows = (data ?? []) as unknown as ContactSubmissionRow[];
  return { submissions: await toAdminItems(context, rows), total: count ?? rows.length };
}

export async function getContactSubmission(
  context: AdminContext,
  id: string,
): Promise<ContactSubmissionAdminItem> {
  assertCanAccessContactSubmissions(context);
  const client = getSupabaseRequestClient(context.accessToken);
  const { data, error } = await client
    .from('contact_submissions')
    .select(submissionSelect)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError('server_error', 500, 'Failed to load contact submission.');
  if (!data) throw new ApiError('not_found', 404, 'Contact submission was not found.');

  return (await toAdminItems(context, [data as unknown as ContactSubmissionRow]))[0];
}

export async function updateContactSubmissionStatus(
  context: AdminContext,
  id: string,
  status: ContactSubmissionStatus,
): Promise<ContactSubmissionAdminItem> {
  assertCanAccessContactSubmissions(context);
  const client = getSupabaseRequestClient(context.accessToken);
  const { data, error } = await client
    .from('contact_submissions')
    .update({ status })
    .eq('id', id)
    .select(submissionSelect)
    .maybeSingle();

  if (error) throw new ApiError('server_error', 500, 'Failed to update contact submission status.');
  if (!data) throw new ApiError('not_found', 404, 'Contact submission was not found.');

  return (await toAdminItems(context, [data as unknown as ContactSubmissionRow]))[0];
}
