'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AdminPagination } from '@/components/admin-pagination';
import { useAdminFormChanges, useAdminUnsavedChanges } from '@/components/admin-dirty-guard';
import type { LearnerAdminItem, LearnerConflictReference, LearnerEmail, LearnerImportPreview, LearnerImportResult, LearnerPhone } from '@/lib/learners/types';

type ArchiveFilter = 'active' | 'archived' | 'all';
type EditorTab = 'profile' | 'contacts' | 'credentials';
type Notice = { kind: 'success' | 'error'; message: string; conflict?: LearnerConflictReference } | null;

const pageSize = 50;

class RequestError extends Error {
  conflict?: LearnerConflictReference;
  constructor(message: string, conflict?: LearnerConflictReference) { super(message); this.conflict = conflict; }
}

function displayName(learner: LearnerAdminItem): string {
  return `${learner.latinFirstName} ${learner.latinLastName}`;
}

function apiError(payload: unknown, fallback: string): RequestError {
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object') {
    const error = payload.error as { message?: unknown; details?: { learner?: LearnerConflictReference } };
    return new RequestError(typeof error.message === 'string' ? error.message : fallback, error.details?.learner);
  }
  return new RequestError(fallback);
}

function contactSummary(learner: LearnerAdminItem): string {
  const email = learner.emails.find(({ isPrimary }) => isPrimary)?.email ?? learner.emails[0]?.email;
  const phone = learner.phones.find(({ isPrimary }) => isPrimary)?.phone ?? learner.phones[0]?.phone;
  return [email, phone].filter(Boolean).join(' · ') || 'No contact details';
}

export function AdminLearners() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [learners, setLearners] = useState<LearnerAdminItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<EditorTab>('profile');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<LearnerImportPreview | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [importing, setImporting] = useState(false);
  const selected = learners.find(({ id }) => id === selectedId) ?? null;
  const formGuard = useAdminFormChanges('Learner form draft');
  const importDirty = Boolean(importFile || importPreview || importConfirmed);
  const importGuard = useAdminUnsavedChanges(importDirty, 'Learner import draft');

  const token = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new RequestError('Sign in to manage learners.');
    return data.session.access_token;
  }, [supabase]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const accessToken = await token();
    const response = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null) as T | null;
    if (!response.ok || !payload) throw apiError(payload, 'Learner operation could not be completed.');
    return payload;
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const params = new URLSearchParams({ archived: archiveFilter, limit: String(pageSize), offset: String(offset) });
      if (appliedSearch) params.set('query', appliedSearch);
      const payload = await request<{ learners: LearnerAdminItem[]; total: number }>(`/api/v1/admin/learners?${params}`);
      if (payload.total > 0 && offset >= payload.total) {
        setOffset(Math.floor((payload.total - 1) / pageSize) * pageSize);
        return;
      }
      setLearners(payload.learners);
      setTotal(payload.total);
      setSelectedId((current) => current && payload.learners.some(({ id }) => id === current) ? current : null);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Learners could not be loaded.' });
    } finally { setLoading(false); }
  }, [appliedSearch, archiveFilter, offset, request]);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  function replaceLearner(learner: LearnerAdminItem) {
    setLearners((current) => current.some(({ id }) => id === learner.id)
      ? current.map((item) => item.id === learner.id ? learner : item)
      : [learner, ...current]);
    setSelectedId(learner.id);
    setCreating(false);
  }

  async function mutation(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>, success = 'Changes saved.') {
    setSaving(true);
    setNotice(null);
    try {
      const payload = await request<{ learner: LearnerAdminItem }>(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      replaceLearner(payload.learner);
      formGuard.markClean();
      setNotice({ kind: 'success', message: success });
      return true;
    } catch (error) {
      const requestError = error instanceof RequestError ? error : new RequestError('Changes could not be saved.');
      setNotice({ kind: 'error', message: requestError.message, conflict: requestError.conflict });
      return false;
    } finally { setSaving(false); }
  }

  async function openConflict(reference: LearnerConflictReference) {
    setSaving(true);
    try {
      const payload = await request<{ learner: LearnerAdminItem }>(`/api/v1/admin/learners/${reference.id}`);
      replaceLearner(payload.learner);
      setTab('contacts');
      setNotice({ kind: 'success', message: `Opened ${reference.displayName}.` });
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Existing learner could not be opened.' });
    } finally { setSaving(false); }
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>, learner?: LearnerAdminItem) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      latinFirstName: String(form.get('latinFirstName') ?? ''),
      latinLastName: String(form.get('latinLastName') ?? ''),
      ukrainianFullName: String(form.get('ukrainianFullName') ?? ''),
      internalNote: String(form.get('internalNote') ?? ''),
    };
    const ok = await mutation(learner ? `/api/v1/admin/learners/${learner.id}` : '/api/v1/admin/learners', learner ? 'PATCH' : 'POST', body, learner ? 'Learner profile saved.' : 'Learner created. Add contact details next.');
    if (ok && !learner) setTab('contacts');
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>, email?: LearnerEmail) {
    event.preventDefault();
    if (!selected) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await mutation(
      `/api/v1/admin/learners/${selected.id}/emails${email ? `/${email.id}` : ''}`,
      email ? 'PATCH' : 'POST',
      { email: String(form.get('email') ?? ''), isPrimary: form.get('isPrimary') === 'on' },
      email ? 'Email updated.' : 'Email added.',
    );
    if (ok && !email) formElement.reset();
  }

  async function submitPhone(event: React.FormEvent<HTMLFormElement>, phone?: LearnerPhone) {
    event.preventDefault();
    if (!selected) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await mutation(
      `/api/v1/admin/learners/${selected.id}/phones${phone ? `/${phone.id}` : ''}`,
      phone ? 'PATCH' : 'POST',
      {
        phone: String(form.get('phone') ?? ''),
        hasTelegram: form.get('hasTelegram') === 'on',
        telegramUsername: String(form.get('telegramUsername') ?? ''),
        hasViber: form.get('hasViber') === 'on',
        hasWhatsapp: form.get('hasWhatsapp') === 'on',
        isPrimary: form.get('isPrimary') === 'on',
      },
      phone ? 'Phone updated.' : 'Phone added.',
    );
    if (ok && !phone) formElement.reset();
  }

  async function removeContact(kind: 'emails' | 'phones', id: string) {
    if (!selected || !window.confirm(`Remove this ${kind === 'emails' ? 'email' : 'phone'} from the learner?`)) return;
    await mutation(`/api/v1/admin/learners/${selected.id}/${kind}/${id}`, 'DELETE', undefined, 'Contact removed.');
  }

  async function toggleArchive(learner: LearnerAdminItem) {
    const message = learner.archivedAt ? 'Learner restored.' : 'Learner archived.';
    const ok = await mutation(
      `/api/v1/admin/learners/${learner.id}`,
      'PATCH',
      { archived: !learner.archivedAt },
      message,
    );
    if (ok && archiveFilter !== 'all') {
      await load();
      setNotice({ kind: 'success', message });
    }
  }

  async function downloadTemplate() {
    setImporting(true); setNotice(null);
    try {
      const accessToken = await token();
      const response = await fetch('/api/v1/admin/learners/import/template', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      if (!response.ok) throw new RequestError('The import template could not be downloaded.');
      downloadBlob(await response.blob(), 'nobel-itbs-learners-template.xlsx');
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'The import template could not be downloaded.' }); }
    finally { setImporting(false); }
  }

  async function previewImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!importFile) { setNotice({ kind: 'error', message: 'Choose an .xlsx or .csv file.' }); return; }
    setImporting(true); setNotice(null); setImportPreview(null); setImportConfirmed(false);
    try {
      const accessToken = await token(); const form = new FormData(); form.set('file', importFile);
      const response = await fetch('/api/v1/admin/learners/import/preview', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form, cache: 'no-store' });
      const payload = await response.json().catch(() => null) as { preview?: LearnerImportPreview } | null;
      if (!response.ok || !payload?.preview) throw apiError(payload, 'The learner file could not be checked.');
      setImportPreview(payload.preview);
      setNotice({ kind: 'success', message: `Checked ${payload.preview.totalRows} rows. Nothing has been saved yet.` });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'The learner file could not be checked.' }); }
    finally { setImporting(false); }
  }

  async function commitImport() {
    if (!importPreview || !importConfirmed || importPreview.validRows.length === 0) return;
    setImporting(true); setNotice(null);
    try {
      const rows = importPreview.validRows.map(toImportRow);
      const payload = await request<{ result: LearnerImportResult }>('/api/v1/admin/learners/import/commit', { method: 'POST', body: JSON.stringify({ rows }) });
      setNotice({ kind: 'success', message: `${payload.result.importedCount} learners imported. Invalid rows were not saved.` });
      setImportPreview(null); setImportFile(null); setImportConfirmed(false); setImportOpen(false); await load();
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Learners could not be imported. No rows were saved.' }); }
    finally { setImporting(false); }
  }

  function downloadErrors() {
    if (!importPreview?.invalidRows.length) return;
    const header = ['Row', 'Latin first name', 'Latin last name', 'Ukrainian full name', 'Email', 'Phone', 'Issues'];
    const lines = [header, ...importPreview.invalidRows.map((row) => [row.rowNumber, row.latinFirstName, row.latinLastName, row.ukrainianFullName, row.email ?? '', row.phone ?? '', row.issues.join(' | ')])];
    downloadBlob(new Blob([`\uFEFF${lines.map((line) => line.map(csvCell).join(',')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), 'learner-import-errors.csv');
  }

  return (
    <main className="learner-admin-shell">
      <header className="admin-module-header">
        <div><p className="admin-kicker">Credential registry</p><h1>Learners</h1><p>Maintain private learner identity and contact records before issuing credentials.</p></div>
      </header>

      <form className="learner-admin-toolbar" onSubmit={(event) => { event.preventDefault(); setOffset(0); setAppliedSearch(search.trim()); }}>
        <label><span>Search learners</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Full name, email, or phone" /></label>
        <label><span>Status</span><select value={archiveFilter} onChange={(event) => { setOffset(0); setArchiveFilter(event.target.value as ArchiveFilter); }}><option value="active">Active learners</option><option value="archived">Archived learners</option><option value="all">All learners</option></select></label>
        <button type="submit">Search</button>
        <button className="secondary" type="button" onClick={() => { if (formGuard.isDirty && !formGuard.confirmDiscardChanges()) return; formGuard.markClean(); setCreating(true); setSelectedId(null); setTab('profile'); setNotice(null); }}>Add learner</button>
        <button className="secondary" type="button" aria-expanded={importOpen} onClick={() => { setImportOpen((current) => !current); setImportPreview(null); setImportConfirmed(false); setNotice(null); }}>Import list</button>
        <span aria-live="polite">{loading ? 'Loading learners' : `${total} learner${total === 1 ? '' : 's'}`}</span>
      </form>

      {notice ? <div className={`learner-admin-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}><span>{notice.message}</span>{notice.conflict ? <button disabled={saving} type="button" onClick={() => void openConflict(notice.conflict!)}>Open {notice.conflict.displayName}</button> : null}</div> : null}

      {importOpen ? <LearnerImportPanel file={importFile} preview={importPreview} confirmed={importConfirmed} busy={importing} onFile={(file) => { setImportFile(file); setImportPreview(null); setImportConfirmed(false); }} onPreview={previewImport} onTemplate={() => void downloadTemplate()} onErrors={downloadErrors} onConfirmed={setImportConfirmed} onCommit={() => void commitImport()} onClose={() => { if (!importGuard.confirmDiscardChanges()) return; setImportOpen(false); setImportPreview(null); setImportFile(null); setImportConfirmed(false); }} /> : null}

      <section className="learner-admin-workspace">
        <nav className="learner-admin-list" aria-label="Learner list">
          {loading ? Array.from({ length: 5 }, (_, index) => <span className="learner-list-skeleton" key={index} />) : null}
          {!loading && learners.length === 0 ? <div className="learner-empty"><strong>No learners found</strong><span>Change the search or add the first learner.</span></div> : null}
          {!loading ? learners.map((learner) => <button type="button" key={learner.id} aria-pressed={learner.id === selectedId} onClick={() => { if (formGuard.isDirty && !formGuard.confirmDiscardChanges()) return; formGuard.markClean(); setSelectedId(learner.id); setCreating(false); setNotice(null); }}><span><strong>{displayName(learner)}</strong><small>{learner.ukrainianFullName}</small><small>{contactSummary(learner)}</small></span><em className={learner.archivedAt ? 'archived' : 'active'}>{learner.archivedAt ? 'Archived' : 'Active'}</em></button>) : null}
          <AdminPagination label="Learner pages" limit={pageSize} offset={offset} total={total} loading={loading} onOffsetChange={setOffset} />
        </nav>

        <section className="learner-admin-editor" onChangeCapture={() => formGuard.markDirty()}>
          {creating ? <ProfileForm saving={saving} onSubmit={(event) => void submitProfile(event)} /> : selected ? <>
            <header className="learner-editor-heading"><div><small>Private learner record</small><h2>{displayName(selected)}</h2></div><span className={selected.archivedAt ? 'archived' : 'active'}>{selected.archivedAt ? 'Archived' : 'Active'}</span></header>
            <nav className="learner-editor-tabs" aria-label="Learner record sections">{(['profile', 'contacts', 'credentials'] as EditorTab[]).map((item) => <button type="button" key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => { if (item === tab || !formGuard.isDirty || formGuard.confirmDiscardChanges()) { formGuard.markClean(); setTab(item); } }}>{item === 'contacts' ? `Contacts (${selected.emails.length + selected.phones.length})` : item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
            {tab === 'profile' ? <ProfileForm learner={selected} saving={saving} onSubmit={(event) => void submitProfile(event, selected)} onArchive={() => void toggleArchive(selected)} /> : null}
            {tab === 'contacts' ? <ContactEditor learner={selected} saving={saving} onEmail={submitEmail} onPhone={submitPhone} onRemove={removeContact} /> : null}
            {tab === 'credentials' ? <section className="learner-credentials"><header><div><small>Credential registry</small><h3>{selected.credentials.length} document{selected.credentials.length === 1 ? '' : 's'}</h3></div><Link href={`/admin/credentials?learner=${selected.id}`}>Open credential workspace</Link></header>{selected.credentials.length === 0 ? <div className="learner-credential-placeholder"><span>Credential records</span><h3>No credentials yet</h3><p>Create the first pending credential from the protected credential workspace.</p></div> : <div>{selected.credentials.map((credential) => <Link key={credential.id} href={`/admin/credentials?credential=${credential.id}`}><span><strong>{credential.documentNumber}</strong><small>{credential.programmeTitle} · {credential.credentialType}</small><small>Issued {credential.issueDate}</small></span><em className={credential.status}>{credential.status}</em></Link>)}</div>}</section> : null}
          </> : <div className="learner-empty editor"><strong>Select a learner</strong><span>Choose a record to manage profile, contacts, and future credentials.</span></div>}
        </section>
      </section>
    </main>
  );
}

function csvCell(value: unknown): string { return `"${String(value).replace(/"/g, '""')}"`; }

function toImportRow(row: LearnerImportPreview['validRows'][number]) {
  return {
    rowNumber: row.rowNumber,
    latinFirstName: row.latinFirstName,
    latinLastName: row.latinLastName,
    ukrainianFullName: row.ukrainianFullName,
    email: row.email,
    phone: row.phone,
    hasTelegram: row.hasTelegram,
    telegramUsername: row.telegramUsername,
    hasViber: row.hasViber,
    hasWhatsapp: row.hasWhatsapp,
    internalNote: row.internalNote,
  };
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}

function LearnerImportPanel({ file, preview, confirmed, busy, onFile, onPreview, onTemplate, onErrors, onConfirmed, onCommit, onClose }: { file: File | null; preview: LearnerImportPreview | null; confirmed: boolean; busy: boolean; onFile: (file: File | null) => void; onPreview: (event: React.FormEvent<HTMLFormElement>) => void; onTemplate: () => void; onErrors: () => void; onConfirmed: (confirmed: boolean) => void; onCommit: () => void; onClose: () => void }) {
  return <section className="learner-import" aria-labelledby="learner-import-heading">
    <header><div><small>Batch operation</small><h2 id="learner-import-heading">Import learner list</h2><p>Check an Excel or CSV file before saving. Existing records are never overwritten.</p></div><button className="secondary" type="button" onClick={onClose} disabled={busy}>Close import</button></header>
    <div className="learner-import-steps" aria-label="Import steps"><span className={!preview ? 'current' : 'done'}>1. Choose file</span><span className={preview ? 'current' : ''}>2. Review</span><span>3. Confirm</span></div>
    <form className="learner-import-upload" onSubmit={onPreview}>
      <div><strong>Start with the controlled template</strong><span>.xlsx or .csv, up to 500 learners and 5 MB. The example row must be removed.</span></div>
      <button className="secondary" type="button" onClick={onTemplate} disabled={busy}>Download template</button>
      <label><span>Learner file</span><input type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={(event) => onFile(event.target.files?.[0] ?? null)} /></label>
      <button type="submit" disabled={!file || busy}>{busy ? 'Checking…' : 'Check file'}</button>
    </form>
    {preview ? <div className="learner-import-preview">
      <div className="learner-import-summary"><span><strong>{preview.totalRows}</strong>Total rows</span><span className="valid"><strong>{preview.validRows.length}</strong>Ready to import</span><span className={preview.invalidRows.length ? 'invalid' : ''}><strong>{preview.invalidRows.length}</strong>Need attention</span></div>
      {preview.invalidRows.length ? <section><header><div><small>Not imported</small><h3>Rows that need correction</h3></div><button className="secondary" type="button" onClick={onErrors}>Download errors CSV</button></header><div className="learner-import-table" role="region" aria-label="Invalid learner rows" tabIndex={0}><table><thead><tr><th>Row</th><th>Learner</th><th>Contact</th><th>Issue</th></tr></thead><tbody>{preview.invalidRows.map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td><strong>{row.latinFirstName} {row.latinLastName}</strong><small>{row.ukrainianFullName}</small></td><td><span>{row.email ?? '—'}</span><small>{row.phone ?? '—'}</small></td><td>{row.issues.join(' ')}</td></tr>)}</tbody></table></div></section> : <p className="learner-import-all-valid">All rows passed validation.</p>}
      <footer><label><input type="checkbox" checked={confirmed} onChange={(event) => onConfirmed(event.target.checked)} /><span>I reviewed the preview. Import {preview.validRows.length} valid learner{preview.validRows.length === 1 ? '' : 's'} without changing existing records.</span></label><button type="button" disabled={!confirmed || preview.validRows.length === 0 || busy} onClick={onCommit}>{busy ? 'Importing…' : `Import ${preview.validRows.length} learners`}</button></footer>
    </div> : null}
  </section>;
}

function ProfileForm({ learner, saving, onSubmit, onArchive }: { learner?: LearnerAdminItem; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onArchive?: () => void }) {
  return <form className="learner-profile-form" key={learner?.updatedAt ?? 'new'} onSubmit={onSubmit}><header><div><small>{learner ? 'Identity' : 'New learner'}</small><h2>{learner ? 'Profile details' : 'Create learner profile'}</h2></div>{learner && onArchive ? <button className="quiet-danger" type="button" disabled={saving} onClick={onArchive}>{learner.archivedAt ? 'Restore learner' : 'Archive learner'}</button> : null}</header><div className="learner-form-grid"><label><span>Latin first name</span><input name="latinFirstName" required defaultValue={learner?.latinFirstName} autoComplete="off" /></label><label><span>Latin last name</span><input name="latinLastName" required defaultValue={learner?.latinLastName} autoComplete="off" /></label><label className="wide"><span>Ukrainian full name</span><input name="ukrainianFullName" required defaultValue={learner?.ukrainianFullName} autoComplete="off" /></label><label className="wide"><span>Internal note <small>Private, never shown publicly</small></span><textarea name="internalNote" defaultValue={learner?.internalNote ?? ''} /></label></div><footer><span>{learner ? 'Contact details are managed in the Contacts tab.' : 'Create the profile first, then add contacts.'}</span><button disabled={saving} type="submit">{saving ? 'Saving…' : learner ? 'Save profile' : 'Create learner'}</button></footer></form>;
}

function ContactEditor({ learner, saving, onEmail, onPhone, onRemove }: { learner: LearnerAdminItem; saving: boolean; onEmail: (event: React.FormEvent<HTMLFormElement>, email?: LearnerEmail) => void; onPhone: (event: React.FormEvent<HTMLFormElement>, phone?: LearnerPhone) => void; onRemove: (kind: 'emails' | 'phones', id: string) => void }) {
  return <div className="learner-contacts"><section><header><div><small>Email addresses</small><h3>{learner.emails.length} saved</h3></div></header>{learner.emails.map((email) => <form className="learner-contact-row email" key={`${email.id}-${email.updatedAt}`} onSubmit={(event) => onEmail(event, email)}><label><span>Email</span><input name="email" type="email" required defaultValue={email.email} /></label><label className="contact-check"><input name="isPrimary" type="checkbox" defaultChecked={email.isPrimary} /><span>Primary</span></label><div><button disabled={saving} type="submit">Save</button><button className="remove" disabled={saving} type="button" onClick={() => onRemove('emails', email.id)}>Remove</button></div></form>)}<form className="learner-contact-add" onSubmit={(event) => onEmail(event)}><label><span>Add email</span><input name="email" type="email" required placeholder="learner@example.com" /></label><label className="contact-check"><input name="isPrimary" type="checkbox" defaultChecked={learner.emails.length === 0} /><span>Primary</span></label><button disabled={saving} type="submit">Add email</button></form></section>
    <section><header><div><small>Phone numbers</small><h3>{learner.phones.length} saved</h3></div></header>{learner.phones.map((phone) => <form className="learner-contact-row phone" key={`${phone.id}-${phone.updatedAt}`} onSubmit={(event) => onPhone(event, phone)}><label><span>Phone</span><input name="phone" type="tel" required defaultValue={phone.phone} /></label><label><span>Telegram username</span><input name="telegramUsername" defaultValue={phone.telegramUsername ?? ''} placeholder="username" /></label><div className="learner-messenger-flags"><label><input name="hasTelegram" type="checkbox" defaultChecked={phone.hasTelegram} /><span>Telegram</span></label><label><input name="hasViber" type="checkbox" defaultChecked={phone.hasViber} /><span>Viber</span></label><label><input name="hasWhatsapp" type="checkbox" defaultChecked={phone.hasWhatsapp} /><span>WhatsApp</span></label><label><input name="isPrimary" type="checkbox" defaultChecked={phone.isPrimary} /><span>Primary</span></label></div><div className="contact-actions"><button disabled={saving} type="submit">Save</button><button className="remove" disabled={saving} type="button" onClick={() => onRemove('phones', phone.id)}>Remove</button></div></form>)}<form className="learner-contact-add phone" onSubmit={(event) => onPhone(event)}><label><span>Add phone</span><input name="phone" type="tel" required placeholder="+420123456789" /></label><label><span>Telegram username</span><input name="telegramUsername" placeholder="username" /></label><div className="learner-messenger-flags"><label><input name="hasTelegram" type="checkbox" /><span>Telegram</span></label><label><input name="hasViber" type="checkbox" /><span>Viber</span></label><label><input name="hasWhatsapp" type="checkbox" /><span>WhatsApp</span></label><label><input name="isPrimary" type="checkbox" defaultChecked={learner.phones.length === 0} /><span>Primary</span></label></div><button disabled={saving} type="submit">Add phone</button></form></section></div>;
}
