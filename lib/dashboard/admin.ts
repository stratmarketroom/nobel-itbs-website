import 'server-only';
import {
  ApiError,
  getSupabaseRequestClient,
  requiresMfaForRole,
  type AdminContext,
  type AppRole,
} from '@/lib/supabase/server';
import type {
  AdminDashboardSummary,
  DashboardContentSummary,
  DashboardOperationsSummary,
} from '@/lib/dashboard/types';

const contentRoles: AppRole[] = ['owner', 'super_admin', 'content_manager'];
const operationsRoles: AppRole[] = ['owner', 'super_admin', 'credential_manager'];

function hasAnyRole(context: AdminContext, allowed: AppRole[]): boolean {
  return context.roles.some((role) => allowed.includes(role));
}

function assertCanAccessDashboard(context: AdminContext): void {
  if (!hasAnyRole(context, [...contentRoles, ...operationsRoles])) {
    throw new ApiError('forbidden', 403, 'Admin dashboard access is not permitted.');
  }

  if (context.roles.some(requiresMfaForRole) && !context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for this admin account.');
  }
}

async function exactCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  label: string,
): Promise<number> {
  const { count, error } = await query;
  if (error) throw new ApiError('server_error', 500, `${label} could not be counted.`);
  return count ?? 0;
}

async function contentSummary(context: AdminContext): Promise<DashboardContentSummary> {
  const client = getSupabaseRequestClient(context.accessToken);
  const programmes = () => client.from('programmes').select('id', { count: 'exact', head: true });

  const [total, published, draft, archived, contentPages, programmeTranslations] = await Promise.all([
    exactCount(programmes(), 'Programmes'),
    exactCount(programmes().eq('publication_status', 'published'), 'Published programmes'),
    exactCount(programmes().eq('publication_status', 'draft'), 'Draft programmes'),
    exactCount(programmes().eq('publication_status', 'archived'), 'Archived programmes'),
    exactCount(
      client.from('content_page_translations').select('page_id', { count: 'exact', head: true })
        .neq('translation_status', 'published'),
      'Content page translations',
    ),
    exactCount(
      client.from('programme_translations').select('programme_id', { count: 'exact', head: true })
        .neq('translation_status', 'published'),
      'Programme translations',
    ),
  ]);

  return {
    programmes: { total, published, draft, archived },
    translationsNeedingAttention: { contentPages, programmes: programmeTranslations },
  };
}

async function operationsSummary(context: AdminContext): Promise<DashboardOperationsSummary> {
  const client = getSupabaseRequestClient(context.accessToken);
  const learners = () => client.from('learners').select('id', { count: 'exact', head: true });
  const credentials = () => client.from('credentials').select('id', { count: 'exact', head: true });

  const [newContactSubmissions, activeLearners, archivedLearners, pending, valid, revoked, voided] = await Promise.all([
    exactCount(
      client.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      'New contact submissions',
    ),
    exactCount(learners().is('archived_at', null), 'Active learners'),
    exactCount(learners().not('archived_at', 'is', null), 'Archived learners'),
    exactCount(credentials().eq('status', 'pending'), 'Pending credentials'),
    exactCount(credentials().eq('status', 'valid'), 'Valid credentials'),
    exactCount(credentials().eq('status', 'revoked'), 'Revoked credentials'),
    exactCount(credentials().eq('status', 'voided'), 'Voided credentials'),
  ]);

  return {
    newContactSubmissions,
    learners: { active: activeLearners, archived: archivedLearners },
    credentials: { pending, valid, revoked, voided },
  };
}

export async function getAdminDashboardSummary(context: AdminContext): Promise<AdminDashboardSummary> {
  assertCanAccessDashboard(context);

  const canViewContent = hasAnyRole(context, contentRoles);
  const canViewOperations = hasAnyRole(context, operationsRoles);
  const [content, operations] = await Promise.all([
    canViewContent ? contentSummary(context) : Promise.resolve(null),
    canViewOperations ? operationsSummary(context) : Promise.resolve(null),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    content,
    operations,
  };
}
