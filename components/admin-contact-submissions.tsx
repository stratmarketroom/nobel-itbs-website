'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  contactSubmissionStatuses,
  contactSubmissionTypes,
  type ContactSubmissionAdminItem,
  type ContactSubmissionStatus,
  type ContactSubmissionType,
} from '@/lib/contact/types';

type ContactListResponse = {
  submissions: ContactSubmissionAdminItem[];
  total: number;
};

const statusLabels: Record<ContactSubmissionStatus, string> = {
  new: 'New',
  processed: 'Processed',
  archived: 'Archived',
};

const typeLabels: Record<ContactSubmissionType, string> = {
  general: 'General',
  programme_question: 'Programme question',
  partner_enquiry: 'Partnership',
  organisation_enquiry: 'Organisation',
};

function readableDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function apiError(payload: unknown, fallback: string): string {
  if (
    payload && typeof payload === 'object' && 'error' in payload
    && payload.error && typeof payload.error === 'object' && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) return payload.error.message;
  return fallback;
}

export function AdminContactSubmissions() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [submissions, setSubmissions] = useState<ContactSubmissionAdminItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactSubmissionStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ContactSubmissionType | ''>('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selected = submissions.find((submission) => submission.id === selectedId) ?? null;

  const accessToken = useCallback(async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) throw new Error('Sign in to view contact submissions.');
    return data.session.access_token;
  }, [supabase]);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = await accessToken();
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const response = await fetch(`/api/v1/admin/contact-submissions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as ContactListResponse | null;
      if (!response.ok || !payload) throw new Error(apiError(payload, 'Contact submissions could not be loaded.'));

      setSubmissions(payload.submissions);
      setTotal(payload.total);
      setSelectedId((current) => (
        current && payload.submissions.some((submission) => submission.id === current) ? current : null
      ));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Contact submissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, typeFilter]);

  useEffect(() => {
    const task = window.setTimeout(() => void loadSubmissions(), 0);
    return () => window.clearTimeout(task);
  }, [loadSubmissions]);

  async function changeStatus(status: ContactSubmissionStatus) {
    if (!selected || selected.status === status) return;
    setSaving(true);
    setError('');

    try {
      const token = await accessToken();
      const response = await fetch(`/api/v1/admin/contact-submissions/${selected.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => null) as { submission?: ContactSubmissionAdminItem } | null;
      if (!response.ok || !payload?.submission) throw new Error(apiError(payload, 'Status could not be updated.'));

      setSubmissions((current) => current.map((submission) => (
        submission.id === payload.submission?.id ? payload.submission : submission
      )));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Status could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="contact-admin-shell">
      <header className="admin-module-header">
        <div>
          <p className="admin-kicker">Operations</p>
          <h1>Contact submissions</h1>
          <p>Review incoming requests and keep their processing status current.</p>
        </div>
      </header>

      <section className="contact-admin-toolbar" aria-label="Submission filters">
        <div className="contact-admin-filter">
          <label htmlFor="contact-status-filter">Status</label>
          <select
            id="contact-status-filter"
            onChange={(event) => setStatusFilter(event.target.value as ContactSubmissionStatus | '')}
            value={statusFilter}
          >
            <option value="">All statuses</option>
            {contactSubmissionStatuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </div>
        <div className="contact-admin-filter">
          <label htmlFor="contact-type-filter">Type</label>
          <select
            id="contact-type-filter"
            onChange={(event) => setTypeFilter(event.target.value as ContactSubmissionType | '')}
            value={typeFilter}
          >
            <option value="">All types</option>
            {contactSubmissionTypes.map((type) => (
              <option key={type} value={type}>{typeLabels[type]}</option>
            ))}
          </select>
        </div>
        <p aria-live="polite">{loading ? 'Loading submissions' : `${total} submission${total === 1 ? '' : 's'}`}</p>
      </section>

      {error ? (
        <div className="contact-admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadSubmissions()}>Try again</button>
          <Link href="/admin/login">Admin sign in</Link>
        </div>
      ) : null}

      <div className="contact-admin-workspace">
        <section className="contact-admin-list" aria-label="Contact submission list">
          <div className="contact-admin-table-header" aria-hidden="true">
            <span>Received</span>
            <span>Contact</span>
            <span>Type</span>
            <span>Status</span>
          </div>

          {loading ? (
            <div className="contact-admin-loading" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => <span key={index} />)}
            </div>
          ) : null}

          {!loading && submissions.length === 0 ? (
            <div className="contact-admin-empty">
              <h2>No submissions found</h2>
              <p>Change the filters or return when a new public enquiry arrives.</p>
            </div>
          ) : null}

          {!loading ? submissions.map((submission) => (
            <button
              aria-pressed={selectedId === submission.id}
              className="contact-admin-row"
              key={submission.id}
              onClick={() => setSelectedId(submission.id)}
              type="button"
            >
              <time dateTime={submission.createdAt}>{readableDate(submission.createdAt)}</time>
              <span className="contact-admin-person">
                <strong>{submission.name}</strong>
                <span>{submission.email}</span>
              </span>
              <span>{typeLabels[submission.type]}</span>
              <span className={`contact-status contact-status-${submission.status}`}>{statusLabels[submission.status]}</span>
            </button>
          )) : null}
        </section>

        <aside className="contact-admin-detail" aria-label="Selected submission details">
          {selected ? (
            <>
              <div className="contact-detail-heading">
                <div>
                  <span className={`contact-status contact-status-${selected.status}`}>{statusLabels[selected.status]}</span>
                  <h2>{selected.name}</h2>
                  <p>{typeLabels[selected.type]}</p>
                </div>
                <label>
                  <span>Status</span>
                  <select
                    disabled={saving}
                    onChange={(event) => void changeStatus(event.target.value as ContactSubmissionStatus)}
                    value={selected.status}
                  >
                    {contactSubmissionStatuses.map((status) => (
                      <option key={status} value={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                </label>
              </div>

              <dl className="contact-detail-facts">
                <div><dt>Received</dt><dd>{readableDate(selected.createdAt)}</dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div>
                <div><dt>Phone</dt><dd>{selected.phone ? <a href={`tel:${selected.phone}`}>{selected.phone}</a> : 'Not provided'}</dd></div>
                <div><dt>Website locale</dt><dd>{selected.languageCode.toUpperCase()}</dd></div>
                {selected.programme ? (
                  <div><dt>Programme</dt><dd>{selected.programme.title}<span>{selected.programme.slug}</span></dd></div>
                ) : null}
              </dl>

              <section className="contact-detail-message">
                <h3>Message</h3>
                <p>{selected.message}</p>
              </section>

              <p className="contact-detail-security">Status changes are recorded in the audit log.</p>
            </>
          ) : (
            <div className="contact-detail-placeholder">
              <h2>Select a submission</h2>
              <p>Contact details and the full message will appear here.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
