'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminDashboardSummary } from '@/lib/dashboard/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type LoadState = 'loading' | 'ready' | 'error';

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return fallback;
}

function refreshedAt(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="dashboard-metric">
      <dt>{label}</dt>
      <dd>{value.toLocaleString('en-GB')}</dd>
      <span>{detail}</span>
    </div>
  );
}

export function AdminDashboard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error('Sign in to open the admin dashboard.');

      const response = await fetch('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as AdminDashboardSummary | null;
      if (!response.ok || !payload) throw new Error(apiMessage(payload, 'Dashboard summary could not be loaded.'));

      setSummary(payload);
      setState('ready');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Dashboard summary could not be loaded.');
      setState('error');
    }
  }, [supabase]);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  return (
    <main className="dashboard-admin-shell">
      <header className="admin-module-header dashboard-admin-header">
        <div>
          <p className="admin-kicker">Operations overview</p>
          <h1>Dashboard</h1>
          <p>Role-aware queues and current registry totals.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={state === 'loading'}>
          {state === 'loading' ? 'Refreshing…' : 'Refresh summary'}
        </button>
      </header>

      {state === 'error' ? (
        <div className="dashboard-notice" role="alert">
          <div><strong>Dashboard unavailable</strong><span>{error}</span></div>
          <button type="button" onClick={() => void load()}>Try again</button>
        </div>
      ) : null}

      {state === 'loading' ? (
        <section className="dashboard-loading" aria-busy="true" aria-label="Loading dashboard summary">
          <span /><span /><span /><span />
        </section>
      ) : null}

      {state === 'ready' && summary ? (
        <div className="dashboard-sections">
          {summary.operations ? (
            <section className="dashboard-section" aria-labelledby="dashboard-operations-title">
              <header>
                <div>
                  <p>Registry operations</p>
                  <h2 id="dashboard-operations-title">Priority queues</h2>
                </div>
                <span>Private totals · MFA protected</span>
              </header>

              <dl className="dashboard-metrics dashboard-metrics-priority">
                <Metric label="New enquiries" value={summary.operations.newContactSubmissions} detail="Awaiting review" />
                <Metric label="Pending credentials" value={summary.operations.credentials.pending} detail="Not publicly visible" />
                <Metric label="Active learners" value={summary.operations.learners.active} detail={`${summary.operations.learners.archived} archived`} />
              </dl>

              <div className="dashboard-status-strip" aria-label="Credential status totals">
                <div><span className="dashboard-status-dot valid" /><strong>{summary.operations.credentials.valid}</strong><span>Valid</span></div>
                <div><span className="dashboard-status-dot revoked" /><strong>{summary.operations.credentials.revoked}</strong><span>Revoked</span></div>
                <div><span className="dashboard-status-dot voided" /><strong>{summary.operations.credentials.voided}</strong><span>Voided</span></div>
              </div>

              <nav className="dashboard-actions" aria-label="Registry actions">
                <Link href="/admin/contact-submissions">Review submissions <span aria-hidden="true">→</span></Link>
                <Link href="/admin/credentials">Open credentials <span aria-hidden="true">→</span></Link>
                <Link href="/admin/learners">Manage learners <span aria-hidden="true">→</span></Link>
              </nav>
            </section>
          ) : null}

          {summary.content ? (
            <section className="dashboard-section" aria-labelledby="dashboard-content-title">
              <header>
                <div>
                  <p>Publishing operations</p>
                  <h2 id="dashboard-content-title">Content readiness</h2>
                </div>
                <span>EN · UA · CZ</span>
              </header>

              <dl className="dashboard-metrics dashboard-metrics-content">
                <Metric label="Programmes" value={summary.content.programmes.total} detail={`${summary.content.programmes.published} published`} />
                <Metric label="Draft programmes" value={summary.content.programmes.draft} detail="Not published" />
                <Metric label="Archived programmes" value={summary.content.programmes.archived} detail="Removed from catalogue" />
              </dl>

              <div className="dashboard-work-list">
                <h3>Translations needing attention</h3>
                <Link href="/admin/content-pages">
                  <span><strong>Content pages</strong><small>Missing or draft translations</small></span>
                  <b>{summary.content.translationsNeedingAttention.contentPages}</b>
                </Link>
                <Link href="/admin/programmes">
                  <span><strong>Programme pages</strong><small>Missing or draft translations</small></span>
                  <b>{summary.content.translationsNeedingAttention.programmes}</b>
                </Link>
              </div>

              <nav className="dashboard-actions" aria-label="Content actions">
                <Link href="/admin/programmes">Manage programmes <span aria-hidden="true">→</span></Link>
                <Link href="/admin/content-pages">Edit content pages <span aria-hidden="true">→</span></Link>
              </nav>
            </section>
          ) : null}

          <footer className="dashboard-footer">
            <span>Summary refreshed {refreshedAt(summary.generatedAt)}</span>
            <span>Counts follow your current role and database RLS.</span>
          </footer>
        </div>
      ) : null}
    </main>
  );
}
