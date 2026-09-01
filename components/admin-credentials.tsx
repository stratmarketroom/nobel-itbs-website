'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PendingCredentialAdminItem } from '@/lib/credentials/types';
import type { ActivateCredentialResult } from '@/lib/credentials/activation-types';
import type { ResendCredentialResult } from '@/lib/credentials/resend-types';
import type { GenerateCredentialResult } from '@/lib/credentials/generation-types';
import type { UpdateValidPublicDataInput } from '@/lib/credentials/public-data-types';
import type {
  CredentialAdminDetail,
  CredentialAdminListItem,
  CredentialReferenceData,
  CredentialSetAdminItem,
  CredentialStatus,
  DocumentNumberAdminItem,
} from '@/lib/credentials/workspace-types';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AdminCredentialBatches } from '@/components/admin-credential-batches';
import { AdminPagination } from '@/components/admin-pagination';
import { useAdminFormChanges } from '@/components/admin-dirty-guard';

type WorkspaceTab = 'credentials' | 'batches' | 'sets' | 'numbers';
type DetailTab = 'summary' | 'files' | 'history';
type Notice = { kind: 'success' | 'error'; message: string; verificationUrl?: string } | null;

const pageSize = 50;

const statusLabels: Record<CredentialStatus, string> = {
  pending: 'Pending', valid: 'Valid', revoked: 'Revoked', voided: 'Voided',
};

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object' && 'message' in payload.error && typeof payload.error.message === 'string') {
    return payload.error.message;
  }
  return fallback;
}

function date(value: string | null): string {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : '—';
}

function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminCredentials() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [tab, setTab] = useState<WorkspaceTab>('credentials');
  const [detailTab, setDetailTab] = useState<DetailTab>('summary');
  const [credentials, setCredentials] = useState<CredentialAdminListItem[]>([]);
  const [references, setReferences] = useState<CredentialReferenceData | null>(null);
  const [detail, setDetail] = useState<CredentialAdminDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sets, setSets] = useState<CredentialSetAdminItem[]>([]);
  const [numbers, setNumbers] = useState<DocumentNumberAdminItem[]>([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState<'all' | CredentialStatus>('all');
  const [credentialTotal, setCredentialTotal] = useState(0);
  const [credentialOffset, setCredentialOffset] = useState(0);
  const [setTotal, setSetTotal] = useState(0);
  const [setOffset, setSetOffset] = useState(0);
  const [numberTotal, setNumberTotal] = useState(0);
  const [numberOffset, setNumberOffset] = useState(0);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const formGuard = useAdminFormChanges('Credential form draft');

  const token = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Sign in to manage credentials.');
    return data.session.access_token;
  }, [supabase]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const accessToken = await token();
    const isForm = init?.body instanceof FormData;
    const response = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(!isForm && init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null) as T | null;
    if (!response.ok || !payload) throw new Error(apiMessage(payload, 'Credential operation could not be completed.'));
    return payload;
  }, [token]);

  const requestBlob = useCallback(async (path: string): Promise<Blob> => {
    const response = await fetch(path, {
      headers: { Authorization: `Bearer ${await token()}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(apiMessage(payload, 'Private preview could not be loaded.'));
    }
    return response.blob();
  }, [token]);

  const loadCredentials = useCallback(async (preferredId?: string, offsetOverride = credentialOffset) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(offsetOverride) });
      if (status !== 'all') params.set('status', status);
      if (appliedSearch) params.set('query', appliedSearch);
      const locationParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const learnerQuery = locationParams?.get('learner');
      if (learnerQuery) params.set('learnerId', learnerQuery);
      const payload = await request<{ credentials: CredentialAdminListItem[]; total: number; references: CredentialReferenceData }>(`/api/v1/admin/credentials?${params}`);
      if (payload.total > 0 && offsetOverride >= payload.total) {
        setCredentialOffset(Math.floor((payload.total - 1) / pageSize) * pageSize);
        return;
      }
      setCredentials(payload.credentials);
      setCredentialTotal(payload.total);
      setReferences(payload.references);
      const queryId = locationParams?.get('credential');
      if (learnerQuery) {
        const learner = payload.references.learners.find(({ id }) => id === learnerQuery);
        if (learner) setSearch(learner.name);
      }
      const nextId = preferredId ?? queryId;
      if (nextId) setSelectedId(nextId);
      else setSelectedId((current) => current && payload.credentials.some(({ id }) => id === current) ? current : null);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Credentials could not be loaded.' });
    } finally { setLoading(false); }
  }, [appliedSearch, credentialOffset, request, status]);

  const loadSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(setOffset) });
      const payload = await request<{ credentialSets: CredentialSetAdminItem[]; total: number }>(`/api/v1/admin/credential-sets?${params}`);
      if (payload.total > 0 && setOffset >= payload.total) {
        setSetOffset(Math.floor((payload.total - 1) / pageSize) * pageSize);
        return;
      }
      setSets(payload.credentialSets);
      setSetTotal(payload.total);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Credential sets could not be loaded.' });
    } finally { setLoading(false); }
  }, [request, setOffset]);

  const loadNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(numberOffset) });
      const payload = await request<{ documentNumbers: DocumentNumberAdminItem[]; total: number }>(`/api/v1/admin/document-numbers?${params}`);
      if (payload.total > 0 && numberOffset >= payload.total) {
        setNumberOffset(Math.floor((payload.total - 1) / pageSize) * pageSize);
        return;
      }
      setNumbers(payload.documentNumbers);
      setNumberTotal(payload.total);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Document number log could not be loaded.' });
    } finally { setLoading(false); }
  }, [numberOffset, request]);

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const payload = await request<{ credential: CredentialAdminDetail }>(`/api/v1/admin/credentials/${id}`);
      setDetail(payload.credential);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Credential could not be loaded.' });
      setDetail(null);
    } finally { setLoading(false); }
  }, [request]);

  useEffect(() => { const task = window.setTimeout(() => void loadCredentials(), 0); return () => window.clearTimeout(task); }, [loadCredentials]);
  useEffect(() => {
    if (tab !== 'sets') return;
    const task = window.setTimeout(() => void loadSets(), 0);
    return () => window.clearTimeout(task);
  }, [loadSets, tab]);
  useEffect(() => {
    if (tab !== 'numbers') return;
    const task = window.setTimeout(() => void loadNumbers(), 0);
    return () => window.clearTimeout(task);
  }, [loadNumbers, tab]);
  useEffect(() => {
    const task = window.setTimeout(() => {
      if (selectedId && !creating) void loadDetail(selectedId);
      else setDetail(null);
    }, 0);
    return () => window.clearTimeout(task);
  }, [creating, loadDetail, selectedId]);

  function openTab(next: WorkspaceTab) {
    if (next !== tab && !formGuard.confirmDiscardChanges()) return;
    formGuard.markClean();
    setTab(next);
    setNotice(null);
  }

  async function createCredential(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setNotice(null);
    try {
      const body = {
        learnerId: String(form.get('learnerId') ?? ''), programmeId: String(form.get('programmeId') ?? ''),
        programmeRunId: String(form.get('programmeRunId') ?? '') || null, completionDate: String(form.get('completionDate') ?? '') || null,
        credentialTypeId: String(form.get('credentialTypeId') ?? ''), languageCode: String(form.get('languageCode') ?? ''),
        issueDate: String(form.get('issueDate') ?? ''), publicHolderName: String(form.get('publicHolderName') ?? ''),
        publicProgrammeTitle: String(form.get('publicProgrammeTitle') ?? ''), publicCredentialType: String(form.get('publicCredentialType') ?? ''),
        manualDocumentNumber: String(form.get('manualDocumentNumber') ?? '') || null, manualReason: String(form.get('manualReason') ?? '') || null,
      };
      const payload = await request<{ credential: PendingCredentialAdminItem }>('/api/v1/admin/credentials', { method: 'POST', body: JSON.stringify(body) });
      setCreating(false);
      formGuard.markClean();
      setCredentialOffset(0);
      setSelectedId(payload.credential.id);
      setDetailTab('summary');
      await loadCredentials(payload.credential.id, 0);
      setNotice({
        kind: 'success',
        message: `Pending credential ${payload.credential.documentNumber} created. Save the verification URL securely; it will not be shown again.`,
        verificationUrl: payload.credential.verificationUrl,
      });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Pending credential could not be created.' }); }
    finally { setSaving(false); }
  }

  async function reloadDetail(success?: string) {
    if (!selectedId) return;
    await Promise.all([loadDetail(selectedId), loadCredentials(selectedId)]);
    formGuard.markClean();
    if (success) setNotice({ kind: 'success', message: success });
  }

  return <main className="credential-admin-shell">
    <header className="admin-module-header"><div><p className="admin-kicker">Credential registry</p><h1>Credentials</h1><p>Create pending documents, manage private PDFs, review permanent numbers, sets, history, and internal notes.</p></div></header>
    <nav className="credential-workspace-tabs" aria-label="Credential registry sections">
      <button type="button" aria-current={tab === 'credentials' ? 'page' : undefined} onClick={() => openTab('credentials')}>Credentials <span>{credentialTotal}</span></button>
      <button type="button" aria-current={tab === 'batches' ? 'page' : undefined} onClick={() => openTab('batches')}>Batch generation</button>
      <button type="button" aria-current={tab === 'sets' ? 'page' : undefined} onClick={() => openTab('sets')}>Credential sets <span>{setTotal}</span></button>
      <button type="button" aria-current={tab === 'numbers' ? 'page' : undefined} onClick={() => openTab('numbers')}>Number log <span>{numberTotal}</span></button>
    </nav>
    {notice ? <div className={`credential-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}><span>{notice.message}</span>{notice.verificationUrl ? <div><code>{notice.verificationUrl}</code><button type="button" onClick={() => void navigator.clipboard.writeText(notice.verificationUrl!)}>Copy verification URL</button></div> : null}</div> : null}
    {tab === 'credentials' ? <>
      <form className="credential-toolbar" onSubmit={(event) => { event.preventDefault(); setCredentialOffset(0); setAppliedSearch(search.trim()); }}>
        <label><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Number, learner, programme" /></label>
        <label><span>Status</span><select value={status} onChange={(event) => { setCredentialOffset(0); setStatus(event.target.value as typeof status); }}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <button type="submit">Search</button>
        <button type="button" onClick={() => { if (!formGuard.confirmDiscardChanges()) return; formGuard.markClean(); setCreating(true); setSelectedId(null); setNotice(null); }}>Create pending credential</button>
        <span>{loading ? 'Loading…' : `${credentialTotal} credential${credentialTotal === 1 ? '' : 's'}`}</span>
      </form>
      <section className="credential-workspace">
        <nav className="credential-list" aria-label="Credentials">
          {!loading && credentials.length === 0 ? <Empty title="No credentials found" body="Change the filters or create the first pending credential." /> : null}
          {credentials.map((item) => <button type="button" key={item.id} aria-pressed={selectedId === item.id} onClick={() => { if (!formGuard.confirmDiscardChanges()) return; formGuard.markClean(); setSelectedId(item.id); setCreating(false); setDetailTab('summary'); setNotice(null); }}><span><strong>{item.documentNumber}</strong><small>{item.learnerName}</small><small>{item.programmeTitle}</small></span><em className={item.status}>{statusLabels[item.status]}</em></button>)}
          <AdminPagination label="Credential pages" limit={pageSize} offset={credentialOffset} total={credentialTotal} loading={loading} onOffsetChange={setCredentialOffset} />
        </nav>
        <section className="credential-editor" onChangeCapture={() => formGuard.markDirty()}>
          {creating && references ? <CreateForm references={references} saving={saving} onSubmit={createCredential} onCancel={() => { if (formGuard.confirmDiscardChanges()) { formGuard.markClean(); setCreating(false); } }} /> : null}
          {!creating && detail ? <CredentialDetail credential={detail} tab={detailTab} saving={saving} setTab={(next) => { if (next === detailTab || formGuard.confirmDiscardChanges()) { formGuard.markClean(); setDetailTab(next); } }} request={request} setSaving={setSaving} setNotice={setNotice} reload={reloadDetail} /> : null}
          {!creating && !detail ? <Empty title="Select a credential" body="Choose a document to review its private administrative record." editor /> : null}
        </section>
      </section>
    </> : null}
    {tab === 'batches' ? <AdminCredentialBatches request={request} requestBlob={requestBlob} /> : null}
    {tab === 'sets' ? <RegistryTable headers={['Learner', 'Programme', 'Run / completion', 'Documents', 'Created']} rows={sets.map((item) => [item.learnerName, item.programmeTitle, [item.programmeRunLabel, item.completionDate].filter(Boolean).join(' · ') || '—', String(item.credentialCount), date(item.createdAt)])} empty="No credential sets yet." pagination={<AdminPagination label="Credential set pages" limit={pageSize} offset={setOffset} total={setTotal} loading={loading} onOffsetChange={setSetOffset} />} /> : null}
    {tab === 'numbers' ? <RegistryTable headers={['Document number', 'Type', 'Status', 'Origin', 'Credential', 'Created']} rows={numbers.map((item) => [item.documentNumber, item.credentialType, item.status, item.isManual ? 'Manual' : 'Automatic', item.credentialId ? 'Linked' : 'Unlinked', date(item.createdAt)])} empty="No document numbers reserved yet." pagination={<AdminPagination label="Document number pages" limit={pageSize} offset={numberOffset} total={numberTotal} loading={loading} onOffsetChange={setNumberOffset} />} /> : null}
  </main>;
}

function CreateForm({ references, saving, onSubmit, onCancel }: { references: CredentialReferenceData; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const [learnerId, setLearnerId] = useState(references.learners.find(({ archived }) => !archived)?.id ?? '');
  const [programmeId, setProgrammeId] = useState(references.programmes[0]?.id ?? '');
  const [typeId, setTypeId] = useState(references.credentialTypes[0]?.id ?? '');
  const learner = references.learners.find(({ id }) => id === learnerId);
  const programme = references.programmes.find(({ id }) => id === programmeId);
  const type = references.credentialTypes.find(({ id }) => id === typeId);
  return <form className="credential-create-form" onSubmit={onSubmit}>
    <header><div><small>New record</small><h2>Create pending credential</h2><p>After creation, generate the configured private PDF package or use the controlled manual upload fallback, then review every document before activation.</p></div><button className="secondary" type="button" onClick={onCancel}>Cancel</button></header>
    <div className="credential-form-grid">
      <label><span>Learner</span><select name="learnerId" required value={learnerId} onChange={(event) => setLearnerId(event.target.value)}>{references.learners.map((item) => <option key={item.id} value={item.id}>{item.name}{item.archived ? ' (archived)' : ''}</option>)}</select></label>
      <label><span>Programme</span><select name="programmeId" required value={programmeId} onChange={(event) => setProgrammeId(event.target.value)}>{references.programmes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label><span>Programme run <small>optional</small></span><select name="programmeRunId"><option value="">No specific run</option>{references.programmeRuns.filter((run) => run.programmeId === programmeId).map((run) => <option key={run.id} value={run.id}>{run.label}</option>)}</select></label>
      <label><span>Completion date <small>optional</small></span><input name="completionDate" type="date" /></label>
      <label><span>Document type</span><select name="credentialTypeId" required value={typeId} onChange={(event) => setTypeId(event.target.value)}>{references.credentialTypes.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.documentLetter})</option>)}</select></label>
      <label><span>Document language</span><select name="languageCode" defaultValue="en"><option value="en">English</option><option value="ua">Ukrainian</option><option value="cz">Czech</option></select></label>
      <label><span>Issue date</span><input name="issueDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
      <label><span>Public holder name</span><input name="publicHolderName" required defaultValue={learner?.name ?? ''} key={learnerId} /></label>
      <label className="wide"><span>Public programme title</span><input name="publicProgrammeTitle" required defaultValue={programme?.title ?? ''} key={programmeId} /></label>
      <label className="wide"><span>Public document type</span><input name="publicCredentialType" required defaultValue={type?.label ?? ''} key={typeId} /></label>
      {references.canUseManualNumber ? <><label><span>Manual number <small>rare, optional</small></span><input name="manualDocumentNumber" placeholder="NITBS-C-2026-000123" /></label><label><span>Manual reason</span><input name="manualReason" placeholder="Required when manual number is used" /></label></> : null}
    </div>
    <footer><span>A permanent number is consumed when this record is created and is never reused.</span><button disabled={saving || !learnerId || !programmeId || !typeId} type="submit">{saving ? 'Creating…' : 'Create pending credential'}</button></footer>
  </form>;
}

function CredentialDetail({ credential, tab, saving, setTab, request, setSaving, setNotice, reload }: {
  credential: CredentialAdminDetail; tab: DetailTab; saving: boolean; setTab: (tab: DetailTab) => void;
  request: <T>(path: string, init?: RequestInit) => Promise<T>; setSaving: (saving: boolean) => void;
  setNotice: (notice: Notice) => void; reload: (success?: string) => Promise<void>;
}) {
  async function action(work: () => Promise<unknown>, success: string) {
    setSaving(true); setNotice(null);
    try { await work(); await reload(success); }
    catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Credential operation failed.' }); }
    finally { setSaving(false); }
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await action(() => request(`/api/v1/admin/credentials/${credential.id}/files`, { method: 'POST', body: form }), 'Private PDF uploaded.');
  }

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const templateVersionId = credential.generation.current?.templateVersionId
      ?? String(form.get('templateVersionId') ?? '');
    if (!templateVersionId) return;
    const verb = credential.generation.current ? 'Regenerate' : 'Generate';
    if (!window.confirm(`${verb} the complete private PDF package now? The credential number and QR stay unchanged.`)) return;
    setSaving(true);
    setNotice(null);
    try {
      const payload = await request<{ generation: GenerateCredentialResult }>(`/api/v1/admin/credentials/${credential.id}/generate`, {
        method: 'POST',
        body: JSON.stringify({ templateVersionId }),
      });
      setTab('files');
      await reload(`${payload.generation.isRegeneration ? 'Regenerated' : 'Generated'} ${payload.generation.fileCount} private PDF${payload.generation.fileCount === 1 ? '' : 's'} across ${payload.generation.pageCount} page${payload.generation.pageCount === 1 ? '' : 's'}. Review every file before activation.`);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Credential PDF package could not be generated.' });
    } finally { setSaving(false); }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    await action(() => request(`/api/v1/admin/credentials/${credential.id}/notes`, { method: 'POST', body: JSON.stringify({ body: String(form.get('body') ?? '') }) }), 'Internal note added.');
    formElement.reset();
  }

  async function activate(input: { recipientEmail: string | null; subject: string; body: string }) {
    setSaving(true);
    setNotice(null);
    try {
      const payload = await request<{ activation: ActivateCredentialResult }>(`/api/v1/admin/credentials/${credential.id}/activate`, {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: input.recipientEmail,
          emailSubject: input.subject,
          emailBody: input.body,
        }),
      });
      const copy = {
        sent: 'Credential activated and the mail server accepted all current PDFs for delivery.',
        failed: `Credential activated. Delivery failed: ${payload.activation.delivery.technicalError ?? 'provider error'}`,
        not_configured: 'Credential activated. Credential email is not configured, so no email was sent.',
        skipped_empty_recipient: 'Credential activated without email because the recipient was empty.',
        pending: 'Credential activated, but the delivery result could not be finalized. Do not activate again.',
      }[payload.activation.delivery.status];
      await reload(copy);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Credential could not be activated.' });
    } finally { setSaving(false); }
  }

  async function resend(input: { recipientEmail: string | null; subject: string; body: string }) {
    setSaving(true);
    setNotice(null);
    try {
      const payload = await request<{ resend: ResendCredentialResult }>(`/api/v1/admin/credentials/${credential.id}/resend`, {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: input.recipientEmail,
          emailSubject: input.subject,
          emailBody: input.body,
        }),
      });
      const copy = {
        sent: 'All current credential PDFs were accepted by the mail server. The credential remains valid.',
        failed: `Delivery failed, but the credential remains valid: ${payload.resend.delivery.technicalError ?? 'provider error'}`,
        not_configured: 'No email was sent because credential SMTP is not configured. The credential remains valid.',
        skipped_empty_recipient: 'No email was sent because the recipient was empty. The credential remains valid.',
        pending: 'The credential remains valid, but the delivery result could not be finalized. Check delivery history before retrying.',
      }[payload.resend.delivery.status];
      await reload(copy);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Credential could not be resent.' });
    } finally { setSaving(false); }
  }

  async function revoke(reason: string) {
    await action(
      () => request(`/api/v1/admin/credentials/${credential.id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
      'Credential revoked permanently. Its document number remains issued and cannot be reused.',
    );
  }

  async function voidPending(reason: string) {
    await action(
      () => request(`/api/v1/admin/credentials/${credential.id}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
      'Pending credential and its reserved document number were voided permanently.',
    );
  }

  async function updatePublicData(input: UpdateValidPublicDataInput) {
    await action(
      () => request(`/api/v1/admin/credentials/${credential.id}/public-data`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
      'Current public credential data updated. The correction is recorded in private History and Audit.',
    );
  }

  return <>
    <header className="credential-editor-heading"><div><small>Private credential record</small><h2>{credential.documentNumber}</h2><p>{credential.learnerName} · {credential.programmeTitle}</p></div><em className={credential.status}>{statusLabels[credential.status]}</em></header>
    <nav className="credential-detail-tabs" aria-label="Credential record sections">
      <button type="button" aria-current={tab === 'summary' ? 'page' : undefined} onClick={() => setTab('summary')}>Summary</button>
      <button type="button" aria-current={tab === 'files' ? 'page' : undefined} onClick={() => setTab('files')}>Private PDFs ({credential.files.length})</button>
      <button type="button" aria-current={tab === 'history' ? 'page' : undefined} onClick={() => setTab('history')}>History & notes</button>
    </nav>
    {tab === 'summary' ? <section className="credential-summary">
      <dl>
        <div><dt>Status</dt><dd>{statusLabels[credential.status]}</dd></div><div><dt>Issue date</dt><dd>{date(credential.issueDate)}</dd></div>
        <div><dt>Language</dt><dd>{credential.languageCode.toUpperCase()}</dd></div><div><dt>Document type</dt><dd>{credential.credentialType}</dd></div>
        <div><dt>Credential set</dt><dd><code>{credential.credentialSetId}</code></dd></div><div><dt>Programme run</dt><dd>{credential.programmeRunId ?? 'No specific run'}</dd></div>
      </dl>
      <div className="credential-public-snapshot"><small>Current public verification data</small><p><strong>{credential.publicHolderName}</strong></p><p>{credential.publicProgrammeTitle}</p><p>{credential.publicCredentialType}</p></div>
      {credential.status === 'pending' && credential.activationDraft ? <ActivationForm credential={credential} saving={saving} onActivate={activate} /> : null}
      {credential.status === 'pending' ? <VoidPendingForm saving={saving} onVoid={voidPending} /> : null}
      {credential.status === 'valid' ? <PublicDataForm key={credential.updatedAt} credential={credential} saving={saving} onSave={updatePublicData} /> : null}
      {credential.status === 'valid' && credential.resendDraft ? <ResendForm key={`${credential.id}-${credential.updatedAt}`} credential={credential} saving={saving} onResend={resend} /> : null}
      {credential.status === 'valid' ? <RevokeForm saving={saving} onRevoke={revoke} /> : null}
      {credential.status === 'revoked' ? <section className="credential-revocation-record" aria-label="Revocation record"><header><small>Private lifecycle record</small><h3>Revoked permanently</h3></header><dl><div><dt>Revoked on</dt><dd>{date(credential.revokedAt)}</dd></div><div><dt>Reason</dt><dd>{credential.revocationReason}</dd></div></dl></section> : null}
      {credential.status === 'voided' ? <section className="credential-void-record" aria-label="Void record"><header><small>Private lifecycle record</small><h3>Voided permanently</h3></header><dl><div><dt>Voided on</dt><dd>{date(credential.voidedAt)}</dd></div><div><dt>Reason</dt><dd>{credential.voidReason}</dd></div></dl></section> : null}
    </section> : null}
    {tab === 'files' ? <section className="credential-files">
      <GenerationPanel credential={credential} saving={saving} onGenerate={generate} />
      <form className="credential-file-upload" onSubmit={upload}><header><div><small>Private storage</small><h3>Upload PDF</h3></div><span>PDF only · max 20 MB</span></header><div>
        <label><span>PDF file</span><input name="file" type="file" accept="application/pdf" required /></label>
        <label><span>File type</span><select name="fileTypeId" required>{credential.fileTypes.map((type) => <option key={type.id} value={type.id}>{type.defaultLabel}</option>)}</select></label>
        <label><span>Admin label</span><input name="adminLabel" placeholder="Signed certificate" /></label>
        <label><span>Change reason</span><input name="reason" placeholder="Initial document upload" /></label>
        <label className="check"><input name="isPrimary" type="checkbox" value="true" defaultChecked={credential.files.length === 0} /><span>Primary PDF</span></label>
        <button disabled={saving} type="submit">{saving ? 'Saving…' : 'Upload PDF'}</button>
      </div></form>
      <div className="credential-file-list">{credential.files.length === 0 ? <Empty title="No private PDFs" body="Generate a configured package or upload an approved document before activation." /> : credential.files.map((file) => { const generated = credential.generation.current?.files.find((item) => item.credentialFileId === file.id); return <article key={`${file.id}-${file.updatedAt}`}><div><strong>{file.adminLabel || credential.fileTypes.find(({ id }) => id === file.fileTypeId)?.defaultLabel || 'Credential PDF'}</strong><span>{bytes(file.sizeBytes)}{generated ? ` · ${generated.pageCount} page${generated.pageCount === 1 ? '' : 's'} · generated attempt ${credential.generation.current?.generationAttempt}` : ''} · updated {date(file.updatedAt)}{file.isPrimary ? ' · Primary' : ''}</span></div><div>
        <button type="button" disabled={saving} onClick={() => void action(async () => { const result = await request<{ signedUrl: string }>(`/api/v1/admin/credentials/${credential.id}/files/${file.id}?disposition=inline`); window.open(result.signedUrl, '_blank', 'noopener,noreferrer'); }, 'Private review link created for 60 seconds.')}>Preview</button>
        <button type="button" disabled={saving} onClick={() => void action(async () => { const result = await request<{ signedUrl: string }>(`/api/v1/admin/credentials/${credential.id}/files/${file.id}`); window.open(result.signedUrl, '_blank', 'noopener,noreferrer'); }, 'Secure download link created.')}>Download</button>
        {!file.isPrimary && (credential.status === 'pending' || credential.status === 'valid') ? <button type="button" disabled={saving} onClick={() => void action(() => request(`/api/v1/admin/credentials/${credential.id}/files/${file.id}`, { method: 'PATCH', body: JSON.stringify({ isPrimary: true, reason: 'Set as primary in credential workspace' }) }), 'Primary PDF changed.')}>Make primary</button> : null}
        {credential.status === 'pending' ? <button className="danger" type="button" disabled={saving} onClick={() => { if (window.confirm('Delete this private PDF?')) void action(() => request(`/api/v1/admin/credentials/${credential.id}/files/${file.id}`, { method: 'DELETE' }), 'Private PDF deleted.'); }}>Delete</button> : null}
      </div>{credential.status === 'pending' || credential.status === 'valid' ? <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void action(() => request(`/api/v1/admin/credentials/${credential.id}/files/${file.id}`, { method: 'PUT', body: form }), 'Private PDF replaced.'); }}><input name="file" type="file" accept="application/pdf" required /><input name="reason" required={credential.status === 'valid'} placeholder={credential.status === 'valid' ? 'Replacement reason (required)' : 'Replacement reason'} /><button disabled={saving} type="submit">Replace</button></form> : null}</article>; })}</div>
    </section> : null}
    {tab === 'history' ? <section className="credential-history-notes">
      <div className="credential-notes"><header><small>Private internal comments</small><h3>Notes</h3></header><form onSubmit={addNote}><textarea name="body" required maxLength={4000} placeholder="Add context for other credential managers" /><button disabled={saving} type="submit">Add note</button></form>{credential.notes.filter(({ deletedAt }) => !deletedAt).map((note) => <article key={`${note.id}-${note.updatedAt}`}><p>{note.body}</p><span>{note.canEdit ? 'You' : 'Administrator'} · {date(note.updatedAt)}</span><div>{note.canEdit ? <button type="button" disabled={saving} onClick={() => { const next = window.prompt('Edit internal note', note.body); if (next?.trim()) void action(() => request(`/api/v1/admin/credentials/${credential.id}/notes/${note.id}`, { method: 'PATCH', body: JSON.stringify({ body: next }) }), 'Internal note updated.'); }}>Edit</button> : null}{note.canDelete ? <button className="danger" type="button" disabled={saving} onClick={() => { if (window.confirm('Delete this internal note?')) void action(() => request(`/api/v1/admin/credentials/${credential.id}/notes/${note.id}`, { method: 'DELETE' }), 'Internal note deleted.'); }}>Delete</button> : null}</div></article>)}</div>
      <div className="credential-timeline"><header><small>Append-only record</small><h3>History</h3></header>{credential.history.map((item) => <article key={item.id}><span>{date(item.createdAt)}</span><strong>{item.eventType.replaceAll('_', ' ')}</strong>{item.reason ? <p>{item.reason}</p> : null}{item.afterData && Object.keys(item.afterData).length ? <code>{JSON.stringify(item.afterData)}</code> : null}</article>)}</div>
      <div className="credential-delivery-history"><header><small>Private delivery record</small><h3>Email delivery</h3></header>{credential.emailSends.length === 0 ? <p>No delivery attempts yet.</p> : credential.emailSends.map((send) => <details key={send.id}><summary><span><strong>{send.status.replaceAll('_', ' ')}</strong><small>{date(send.sentAt)} · {send.recipientEmail || 'No recipient'} · {send.files.length} PDF{send.files.length === 1 ? '' : 's'}</small></span></summary><div><p><strong>Subject:</strong> {send.subject}</p><pre>{send.body}</pre>{send.technicalError ? <p className="delivery-error">{send.technicalError}</p> : null}<ul>{send.files.map((file) => <li key={file.fileId}>{file.filename} · {file.fileType}{file.isPrimary ? ' · Primary' : ''}</li>)}</ul></div></details>)}</div>
    </section> : null}
  </>;
}

function GenerationPanel({ credential, saving, onGenerate }: {
  credential: CredentialAdminDetail;
  saving: boolean;
  onGenerate: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const generation = credential.generation;
  const current = generation.current;
  return <form className="credential-generation-panel" onSubmit={onGenerate}>
    <header><div><small>PDFGEN-005 · private package</small><h3>{current ? 'Regenerate current package' : 'Generate from Template Package'}</h3></div>{current ? <span>Attempt {current.generationAttempt}</span> : null}</header>
    {current ? <>
      <p><strong>{current.templateDisplayName}</strong> · variant <code>{current.variantCode}</code> · v{current.versionNumber} {current.versionStatus}</p>
      <p>{current.files.length} PDF{current.files.length === 1 ? '' : 's'} · {current.files.reduce((sum, item) => sum + item.pageCount, 0)} pages · generated {date(current.generatedAt)}. Regeneration replaces these current files in place and keeps the same permanent number and QR.</p>
      {credential.status === 'pending' ? <button type="submit" disabled={saving || !generation.eligible}>{saving ? 'Generating…' : 'Regenerate same version'}</button> : null}
    </> : <>
      <p>Select an exact published package matching this credential. Every configured document and page is generated together.</p>
      {generation.options.length ? <label><span>Published Template Package</span><select name="templateVersionId" required disabled={saving || !generation.eligible}>{generation.options.map((option) => <option key={option.templateVersionId} value={option.templateVersionId}>{option.displayName} · {option.variantCode} · v{option.versionNumber} · {option.documentCount} PDF{option.documentCount === 1 ? '' : 's'} / {option.pageCount} pages{option.programmeRunId ? ' · run-specific' : ''}</option>)}</select></label> : null}
      {credential.status === 'pending' ? <button type="submit" disabled={saving || !generation.eligible || generation.options.length === 0}>{saving ? 'Generating…' : 'Generate complete package'}</button> : null}
    </>}
    {generation.blockedReason ? <p className="generation-blocked">{generation.blockedReason}</p> : null}
    <footer>Generated files stay in private Storage. Open Preview for each PDF before activation.</footer>
  </form>;
}

function ActivationForm({ credential, saving, onActivate }: {
  credential: CredentialAdminDetail;
  saving: boolean;
  onActivate: (input: { recipientEmail: string | null; subject: string; body: string }) => Promise<void>;
}) {
  const draft = credential.activationDraft!;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm('Activate this credential now? Its number will be issued permanently even if email delivery fails.')) return;
    const form = new FormData(event.currentTarget);
    await onActivate({
      recipientEmail: String(form.get('recipientEmail') ?? '').trim() || null,
      subject: String(form.get('subject') ?? ''),
      body: String(form.get('body') ?? ''),
    });
  }
  return <form className="credential-activation-form" onSubmit={(event) => void submit(event)}>
    <header><div><small>WF-003 · irreversible transition</small><h3>Activate and deliver</h3></div><span>{draft.fileCount} current PDF{draft.fileCount === 1 ? '' : 's'}</span></header>
    {!draft.hasPrimaryPdf ? <p className="activation-blocked">Choose a primary PDF before activation.</p> : null}
    <label><span>Recipient email <small>optional</small></span><input name="recipientEmail" type="email" defaultValue={draft.recipientEmail} placeholder="Leave empty to activate without email" /></label>
    <label><span>Email subject</span><input name="subject" required maxLength={180} defaultValue={draft.subject} /></label>
    <label><span>Email body <small>{draft.templateLanguage.toUpperCase()} template, editable for this send</small></span><textarea name="body" required maxLength={20000} defaultValue={draft.body} /></label>
    <footer><span>Activation succeeds even when the recipient is empty or email delivery fails.</span><button type="submit" disabled={saving || !draft.hasPrimaryPdf}>{saving ? 'Activating…' : 'Activate credential'}</button></footer>
  </form>;
}

function ResendForm({ credential, saving, onResend }: {
  credential: CredentialAdminDetail;
  saving: boolean;
  onResend: (input: { recipientEmail: string | null; subject: string; body: string }) => Promise<void>;
}) {
  const draft = credential.resendDraft!;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm(`Send all ${draft.fileCount} current PDF${draft.fileCount === 1 ? '' : 's'} now? This creates a permanent delivery-history entry.`)) return;
    const form = new FormData(event.currentTarget);
    await onResend({
      recipientEmail: String(form.get('recipientEmail') ?? '').trim() || null,
      subject: String(form.get('subject') ?? ''),
      body: String(form.get('body') ?? ''),
    });
  }

  return <details className="credential-resend-panel">
    <summary><span><small>WF-004 · delivery action</small><strong>Resend credential PDFs</strong></span><em>{draft.fileCount} current PDF{draft.fileCount === 1 ? '' : 's'}</em></summary>
    <form onSubmit={(event) => void submit(event)}>
      {!draft.hasFiles ? <p className="resend-blocked">Attach a current private PDF before resending.</p> : null}
      <p>This sends every current PDF and creates an immutable delivery record. It does not change the learner profile or the valid credential status.</p>
      <label><span>Recipient email <small>optional</small></span><input name="recipientEmail" type="email" defaultValue={draft.recipientEmail} placeholder="Leave empty to record a skipped delivery" disabled={saving} /></label>
      <label><span>Email subject</span><input name="subject" required maxLength={180} defaultValue={draft.subject} disabled={saving} /></label>
      <label><span>Email body <small>{draft.templateLanguage.toUpperCase()} template, editable for this send</small></span><textarea name="body" required maxLength={20000} defaultValue={draft.body} disabled={saving} /></label>
      <footer><span>Delivery failure never revokes or otherwise changes this credential.</span><button type="submit" disabled={saving || !draft.hasFiles}>{saving ? 'Sending…' : 'Resend all current PDFs'}</button></footer>
    </form>
  </details>;
}

function RevokeForm({ saving, onRevoke }: {
  saving: boolean;
  onRevoke: (reason: string) => Promise<void>;
}) {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get('reason') ?? '').trim();
    if (!reason) return;
    if (!window.confirm('Revoke this valid credential? This action is permanent and its document number will never be reused.')) return;
    await onRevoke(reason);
  }

  return <form className="credential-revoke-form" onSubmit={(event) => void submit(event)}>
    <header><div><small>WF-005 · irreversible transition</small><h3>Revoke credential</h3></div><span>Valid → Revoked</span></header>
    <p>Use this only when the issued document must no longer verify as valid. The reason stays private in History.</p>
    <label><span>Revocation reason</span><textarea name="reason" required maxLength={4000} disabled={saving} placeholder="Explain why this credential must be revoked" /></label>
    <footer><span>The credential cannot be restored through the standard workflow.</span><button type="submit" disabled={saving}>{saving ? 'Revoking…' : 'Revoke permanently'}</button></footer>
  </form>;
}

function VoidPendingForm({ saving, onVoid }: {
  saving: boolean;
  onVoid: (reason: string) => Promise<void>;
}) {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get('reason') ?? '').trim();
    if (!reason) return;
    if (!window.confirm('Void this pending credential? Its reserved document number will be voided permanently and can never be reused.')) return;
    await onVoid(reason);
  }

  return <details className="credential-void-panel">
    <summary><span><small>WF-006 · irreversible transition</small><strong>Void pending credential</strong></span><em>Reserved → Voided</em></summary>
    <form onSubmit={(event) => void submit(event)}>
      <p>Use this when the pending record must be cancelled before activation. It will behave as not found in public verification.</p>
      <label><span>Void reason</span><textarea name="reason" required maxLength={4000} disabled={saving} placeholder="Explain why this pending credential must be voided" /></label>
      <footer><span>Neither the credential nor its number can be restored through the standard workflow.</span><button type="submit" disabled={saving}>{saving ? 'Voiding…' : 'Void permanently'}</button></footer>
    </form>
  </details>;
}

function PublicDataForm({ credential, saving, onSave }: {
  credential: CredentialAdminDetail;
  saving: boolean;
  onSave: (input: UpdateValidPublicDataInput) => Promise<void>;
}) {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSave({
      publicHolderName: String(form.get('publicHolderName') ?? ''),
      publicProgrammeTitle: String(form.get('publicProgrammeTitle') ?? ''),
      publicCredentialType: String(form.get('publicCredentialType') ?? ''),
      reason: String(form.get('reason') ?? ''),
    });
  }

  return <details className="credential-public-data-panel">
    <summary><span><small>WF-007 · controlled correction</small><strong>Correct public verification data</strong></span><em>Valid only</em></summary>
    <form onSubmit={(event) => void submit(event)}>
      <p>These values are shown publicly for a valid document. The change reason stays private and no revision notice is shown publicly.</p>
      <div>
        <label><span>Public holder name</span><input name="publicHolderName" required maxLength={320} disabled={saving} defaultValue={credential.publicHolderName} /></label>
        <label><span>Public document type</span><input name="publicCredentialType" required maxLength={200} disabled={saving} defaultValue={credential.publicCredentialType} /></label>
        <label className="wide"><span>Public programme title</span><input name="publicProgrammeTitle" required maxLength={500} disabled={saving} defaultValue={credential.publicProgrammeTitle} /></label>
        <label className="wide"><span>Change reason</span><textarea name="reason" required maxLength={4000} disabled={saving} placeholder="Explain why the public credential data must be corrected" /></label>
      </div>
      <footer><span>Only the current public verification record changes. The issued number, PDF, learner, programme, and lifecycle stay unchanged.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save correction'}</button></footer>
    </form>
  </details>;
}

function RegistryTable({ headers, rows, empty, pagination }: { headers: string[]; rows: string[][]; empty: string; pagination: React.ReactNode }) {
  return <div className="credential-registry-table"><div className="credential-registry-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table></div>{rows.length === 0 ? <Empty title={empty} body="The registry will populate automatically as credentials are created." /> : null}{pagination}</div>;
}

function Empty({ title, body, editor = false }: { title: string; body: string; editor?: boolean }) {
  return <div className={`credential-empty${editor ? ' editor' : ''}`}><strong>{title}</strong><span>{body}</span>{editor ? <Link href="/admin/learners">Open learners</Link> : null}</div>;
}
