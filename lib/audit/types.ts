export type AuditActor = {
  id: string;
  label: string;
};

export type AuditTarget = {
  schema: string | null;
  table: string | null;
  id: string | null;
};

export type AuditEventSummary = {
  id: string;
  occurredAt: string;
  action: string;
  actor: AuditActor | null;
  target: AuditTarget;
};

export type AuditMetadataEntry = {
  key: string;
  value: string;
  kind: 'boolean' | 'number' | 'identifier' | 'label';
};

export type AuditEventDetail = AuditEventSummary & {
  metadata: {
    entries: AuditMetadataEntry[];
    hiddenCount: number;
  };
};

export type AuditEventListResponse = {
  events: AuditEventSummary[];
  total: number;
  limit: number;
  offset: number;
};
