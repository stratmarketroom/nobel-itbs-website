import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanViewGlobalAudit,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import type { AuditFilters } from '@/lib/audit/input';
import type {
  AuditActor,
  AuditEventDetail,
  AuditEventListResponse,
  AuditEventSummary,
  AuditMetadataEntry,
} from '@/lib/audit/types';

type AuditRow = {
  id: string;
  occurred_at: string;
  actor_id: string | null;
  action: string;
  target_schema: string | null;
  target_table: string | null;
  target_id: string | null;
  metadata?: Record<string, unknown>;
};

type ActorRow = { id: string; full_name: string | null };

const auditSummarySelect = 'id, occurred_at, actor_id, action, target_schema, target_table, target_id';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeIdentifierKeys = new Set([
  'assigned_by', 'batch_activation_item_id', 'batch_id', 'batch_item_id',
  'credential_id', 'credential_type_id', 'document_number_log_id', 'file_type_id',
  'from_set_id', 'programme_id', 'template_package_id', 'template_version_id',
  'to_set_id',
]);
const safeBooleanKeys = new Set([
  'admin_label_changed', 'assigned_by_changed', 'body_changed',
  'content_metadata_changed', 'file_type_changed', 'full_name_changed',
  'is_active', 'is_active_changed', 'is_owner', 'is_owner_changed', 'is_primary',
  'manual', 'mfa_required', 'mfa_required_changed', 'pending', 'primary_changed',
  'replace', 'reserved', 'sample_data', 'subject_changed', 'valid', 'voided',
  'was_primary',
]);
const safeNumberKeys = new Set([
  'activation_attempt', 'already_rotated_count', 'attempt', 'count', 'file_count',
  'generation_attempt', 'issue_year', 'page_count', 'processing_chunk_size',
  'rotated_count', 'selected_count', 'size_bytes', 'version_number',
]);
const safeStringKeys = new Set([
  'action', 'role', 'old_role', 'new_role', 'status', 'old_status', 'new_status',
  'from_status', 'to_status', 'language_code', 'template_key', 'template_kind',
  'field_key', 'operation', 'entity_type', 'document_type', 'delivery_status',
  'generation_status', 'review_status', 'provider', 'format', 'source',
  'error_code', 'setting_key', 'variant_code',
]);

function client(context: AdminContext): SupabaseClient {
  assertCanViewGlobalAudit(context);
  return getSupabaseRequestClient(context.accessToken);
}

async function actorDirectory(db: SupabaseClient, rows: AuditRow[]): Promise<Map<string, AuditActor>> {
  const ids = [...new Set(rows.flatMap((row) => row.actor_id ? [row.actor_id] : []))];
  if (ids.length === 0) return new Map();

  const { data, error } = await db.from('user_profiles').select('id, full_name').in('id', ids);
  if (error) throw new ApiError('server_error', 500, 'Audit actors could not be resolved.');

  return new Map(((data ?? []) as ActorRow[]).map((actor) => [
    actor.id,
    { id: actor.id, label: actor.full_name || `Admin ${actor.id.slice(0, 8)}` },
  ]));
}

function toSummary(row: AuditRow, actors: Map<string, AuditActor>): AuditEventSummary {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    action: row.action,
    actor: row.actor_id ? actors.get(row.actor_id) ?? { id: row.actor_id, label: `Admin ${row.actor_id.slice(0, 8)}` } : null,
    target: { schema: row.target_schema, table: row.target_table, id: row.target_id },
  };
}

function safeMetadata(metadata: Record<string, unknown> | undefined): AuditEventDetail['metadata'] {
  const entries: AuditMetadataEntry[] = [];
  let hiddenCount = 0;

  for (const [key, value] of Object.entries(metadata ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
    if (typeof value === 'boolean' && safeBooleanKeys.has(key)) {
      entries.push({ key, value: value ? 'Yes' : 'No', kind: 'boolean' });
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value) && safeNumberKeys.has(key)) {
      entries.push({ key, value: String(value), kind: 'number' });
      continue;
    }
    if (typeof value === 'string' && safeIdentifierKeys.has(key) && uuidPattern.test(value)) {
      entries.push({ key, value, kind: 'identifier' });
      continue;
    }
    if (
      typeof value === 'string'
      && safeStringKeys.has(key)
      && value.length <= 80
      && /^[\p{L}\p{N}_.:/ -]+$/u.test(value)
    ) {
      entries.push({ key, value, kind: 'label' });
      continue;
    }
    hiddenCount += 1;
  }

  return { entries, hiddenCount };
}

export async function listAuditEvents(
  context: AdminContext,
  filters: AuditFilters,
): Promise<AuditEventListResponse> {
  const db = client(context);
  let query = db.from('audit_log')
    .select(auditSummarySelect, { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.action) {
    const escaped = filters.action.replace(/[\\%_]/g, (character) => `\\${character}`);
    query = query.ilike('action', `%${escaped}%`);
  }
  if (filters.targetTable) query = query.eq('target_table', filters.targetTable);
  if (filters.from) query = query.gte('occurred_at', filters.from);
  if (filters.to) query = query.lte('occurred_at', filters.to);

  const { data, error, count } = await query;
  if (error) throw new ApiError('server_error', 500, 'Audit events could not be loaded.');

  const rows = (data ?? []) as AuditRow[];
  const actors = await actorDirectory(db, rows);
  return {
    events: rows.map((row) => toSummary(row, actors)),
    total: count ?? rows.length,
    limit: filters.limit,
    offset: filters.offset,
  };
}

export async function getAuditEvent(context: AdminContext, id: string): Promise<AuditEventDetail> {
  const db = client(context);
  const { data, error } = await db.from('audit_log')
    .select(`${auditSummarySelect}, metadata`)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError('server_error', 500, 'Audit event could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Audit event was not found.');

  const row = data as AuditRow;
  const actors = await actorDirectory(db, [row]);
  return { ...toSummary(row, actors), metadata: safeMetadata(row.metadata) };
}
