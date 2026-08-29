'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuditEventDetail, AuditEventListResponse, AuditEventSummary } from '@/lib/audit/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type FilterState = { action: string; targetTable: string; from: string; to: string };
type LoadState = 'loading' | 'ready' | 'error';

const pageSize = 50;
const emptyFilters: FilterState = { action: '', targetTable: '', from: '', to: '' };
const targetTables = [
  'user_profiles', 'user_roles', 'content_pages', 'content_page_translations',
  'programmes', 'programme_translations', 'programme_runs', 'programme_pricing_options',
  'partners', 'experts', 'contact_submissions', 'learners', 'learner_emails',
  'learner_phones', 'credential_sets', 'credentials', 'credential_files',
  'document_number_log', 'email_templates', 'site_settings',
  'credential_template_packages', 'credential_template_versions',
  'credential_generation_batches',
];

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return fallback;
}

function readableDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function actionLabel(action: string): string {
  const value = action.replace(/[._]+/g, ' ');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tableLabel(value: string | null): string {
  if (!value) return 'System';
  return value.replace(/_/g, ' ');
}

function targetLabel(event: AuditEventSummary): string {
  if (!event.target.table) return 'System';
  return event.target.id ? `${tableLabel(event.target.table)} · ${event.target.id.slice(0, 8)}` : tableLabel(event.target.table);
}

export function AdminAuditHistory() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [events, setEvents] = useState<AuditEventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<AuditEventDetail | null>(null);
  const [listState, setListState] = useState<LoadState>('loading');
  const [detailState, setDetailState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const accessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error('Sign in with MFA to review Audit/History.');
    return data.session.access_token;
  }, [supabase]);

  const loadEvents = useCallback(async () => {
    setListState('loading');
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
      if (filters.action) params.set('action', filters.action);
      if (filters.targetTable) params.set('targetTable', filters.targetTable);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const response = await fetch(`/api/v1/admin/audit-events?${params}`, {
        headers: { Authorization: `Bearer ${await accessToken()}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as AuditEventListResponse | null;
      if (!response.ok || !payload?.events) throw new Error(apiMessage(payload, 'Audit events could not be loaded.'));

      setEvents(payload.events);
      setTotal(payload.total);
      setSelectedId((current) => payload.events.some((event) => event.id === current) ? current : payload.events[0]?.id ?? '');
      setListState('ready');
    } catch (caughtError) {
      setEvents([]);
      setDetail(null);
      setError(caughtError instanceof Error ? caughtError.message : 'Audit events could not be loaded.');
      setListState('error');
    }
  }, [accessToken, filters, offset]);

  useEffect(() => {
    const task = window.setTimeout(() => void loadEvents(), 0);
    return () => window.clearTimeout(task);
  }, [loadEvents]);

  useEffect(() => {
    if (!selectedId) return;

    let active = true;
    const task = window.setTimeout(async () => {
      setDetailState('loading');
      try {
        const response = await fetch(`/api/v1/admin/audit-events/${selectedId}`, {
          headers: { Authorization: `Bearer ${await accessToken()}` },
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => null) as { event?: AuditEventDetail } | null;
        if (!response.ok || !payload?.event) throw new Error(apiMessage(payload, 'Audit event detail could not be loaded.'));
        if (active) {
          setDetail(payload.event);
          setDetailState('ready');
        }
      } catch (caughtError) {
        if (active) {
          setDetail(null);
          setDetailState('error');
          setError(caughtError instanceof Error ? caughtError.message : 'Audit event detail could not be loaded.');
        }
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(task);
    };
  }, [accessToken, selectedId]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    setFilters(draftFilters);
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setOffset(0);
  }

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + pageSize, total);

  return (
    <main className="audit-admin-shell">
      <header className="admin-module-header">
        <div>
          <p className="admin-kicker">Security and accountability</p>
          <h1>Audit / History</h1>
          <p>Owner and Super Admin only. MFA required.</p>
        </div>
      </header>

      <form className="audit-filters" onSubmit={applyFilters} aria-label="Audit filters">
        <label className="audit-filter-action">
          <span>Action contains</span>
          <input
            type="search"
            value={draftFilters.action}
            maxLength={120}
            placeholder="credential.activated"
            onChange={(event) => setDraftFilters((current) => ({ ...current, action: event.target.value }))}
          />
        </label>
        <label>
          <span>Module</span>
          <select
            value={draftFilters.targetTable}
            onChange={(event) => setDraftFilters((current) => ({ ...current, targetTable: event.target.value }))}
          >
            <option value="">All modules</option>
            {targetTables.map((table) => <option key={table} value={table}>{tableLabel(table)}</option>)}
          </select>
        </label>
        <label>
          <span>From</span>
          <input type="date" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} />
        </label>
        <div className="audit-filter-actions">
          <button type="button" onClick={clearFilters}>Clear</button>
          <button className="primary" type="submit">Apply filters</button>
        </div>
      </form>

      {error ? (
        <div className="audit-notice" role="alert">
          <span>{error}</span>
          {listState === 'error' ? <button type="button" onClick={() => void loadEvents()}>Try again</button> : null}
        </div>
      ) : null}

      <div className="audit-workspace">
        <section className="audit-list" aria-label="Global audit event list">
          <header>
            <span>{listState === 'loading' ? 'Loading events' : `${total.toLocaleString('en-GB')} events`}</span>
            <small>Newest first</small>
          </header>

          <div className="audit-list-columns" aria-hidden="true">
            <span>Occurred</span><span>Action</span><span>Actor</span><span>Target</span>
          </div>

          {listState === 'loading' ? (
            <div className="audit-list-loading" aria-busy="true" aria-label="Loading audit events">
              {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
            </div>
          ) : null}

          {listState === 'ready' && events.length === 0 ? (
            <div className="audit-empty"><strong>No audit events found</strong><span>Change the filters or date range.</span></div>
          ) : null}

          {listState === 'ready' ? events.map((event) => (
            <button
              type="button"
              className="audit-row"
              aria-pressed={selectedId === event.id}
              key={event.id}
              onClick={() => { setSelectedId(event.id); setError(''); }}
            >
              <time dateTime={event.occurredAt}>{readableDate(event.occurredAt)}</time>
              <span className="audit-row-action"><strong>{actionLabel(event.action)}</strong><code>{event.action}</code></span>
              <span>{event.actor?.label ?? 'System'}</span>
              <span>{targetLabel(event)}</span>
            </button>
          )) : null}

          <footer className="audit-pagination">
            <span>{pageStart}–{pageEnd} of {total.toLocaleString('en-GB')}</span>
            <div>
              <button type="button" disabled={offset === 0 || listState === 'loading'} onClick={() => setOffset((current) => Math.max(0, current - pageSize))}>Previous</button>
              <button type="button" disabled={offset + pageSize >= total || listState === 'loading'} onClick={() => setOffset((current) => current + pageSize)}>Next</button>
            </div>
          </footer>
        </section>

        <aside className="audit-detail" aria-label="Selected audit event detail">
          {detailState === 'loading' && selectedId ? (
            <div className="audit-detail-loading" aria-busy="true" aria-label="Loading audit event detail"><span /><span /><span /></div>
          ) : null}

          {detailState === 'ready' && selectedId && detail ? (
            <>
              <header>
                <p>{detail.action.split('.')[0] || 'system'}</p>
                <h2>{actionLabel(detail.action)}</h2>
                <code>{detail.action}</code>
              </header>

              <dl className="audit-detail-facts">
                <div><dt>Occurred</dt><dd><time dateTime={detail.occurredAt}>{readableDate(detail.occurredAt)}</time></dd></div>
                <div><dt>Actor</dt><dd>{detail.actor?.label ?? 'System'}{detail.actor ? <code>{detail.actor.id}</code> : null}</dd></div>
                <div><dt>Target</dt><dd>{tableLabel(detail.target.table)}{detail.target.id ? <code>{detail.target.id}</code> : null}</dd></div>
                <div><dt>Event ID</dt><dd><code>{detail.id}</code></dd></div>
              </dl>

              <section className="audit-metadata">
                <div><h3>Safe event context</h3><span>Privacy-projected</span></div>
                {detail.metadata.entries.length ? (
                  <dl>{detail.metadata.entries.map((entry) => (
                    <div key={entry.key}><dt>{entry.key.replace(/_/g, ' ')}</dt><dd className={entry.kind === 'identifier' ? 'identifier' : undefined}>{entry.value}</dd></div>
                  ))}</dl>
                ) : <p>No display-safe metadata for this event.</p>}
                {detail.metadata.hiddenCount ? <small>{detail.metadata.hiddenCount} field{detail.metadata.hiddenCount === 1 ? '' : 's'} hidden by the privacy projection.</small> : null}
              </section>

              <p className="audit-integrity-note">Append-only record. Audit events cannot be edited or deleted.</p>
            </>
          ) : null}

          {!selectedId || (detailState === 'ready' && !detail) ? (
            <div className="audit-empty"><strong>Select an event</strong><span>Its actor, target, and safe context will appear here.</span></div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
