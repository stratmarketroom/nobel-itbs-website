'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BatchActivationChunkResult,
  BatchChunkResult,
  BatchDetail,
  BatchIssuingContextInput,
  BatchListItem,
  BatchPreview,
  BatchReferenceData,
  CredentialGenerationItemStatus,
} from '@/lib/credentials/batch-generation-types';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
type Notice = { kind: 'success' | 'error'; message: string } | null;

const statusLabel: Record<CredentialGenerationItemStatus, string> = {
  queued: 'Queued', processing: 'Processing', generated: 'Generated', retryable: 'Retryable',
  conflict: 'Conflict', reviewed: 'Reviewed', activating: 'Activating', activated: 'Activated', failed: 'Failed',
};

function formattedDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : '—';
}

export function AdminCredentialBatches({ request }: { request: Request }) {
  const [references, setReferences] = useState<BatchReferenceData | null>(null);
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [draft, setDraft] = useState<BatchIssuingContextInput | null>(null);
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [selectedActivationItems, setSelectedActivationItems] = useState<Set<string>>(new Set());
  const [learnerSearch, setLearnerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await request<{ batches: BatchListItem[]; references: BatchReferenceData }>('/api/v1/admin/credential-generation-batches');
      setBatches(payload.batches);
      setReferences(payload.references);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Generation batches could not be loaded.' });
    } finally { setLoading(false); }
  }, [request]);

  useEffect(() => { const task = window.setTimeout(() => void loadWorkspace(), 0); return () => window.clearTimeout(task); }, [loadWorkspace]);

  const activeLearners = useMemo(() => (references?.learners ?? []).filter((learner) => !learner.archived), [references]);
  const filteredLearners = useMemo(() => {
    const needle = learnerSearch.trim().toLocaleLowerCase();
    return activeLearners.filter((learner) => !needle || learner.name.toLocaleLowerCase().includes(needle));
  }, [activeLearners, learnerSearch]);

  async function openBatch(id: string) {
    setLoading(true); setCreating(false); setPreview(null); setSelectedActivationItems(new Set()); setNotice(null);
    try { setBatch((await request<{ batch: BatchDetail }>(`/api/v1/admin/credential-generation-batches/${id}`)).batch); }
    catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Generation batch could not be loaded.' }); }
    finally { setLoading(false); }
  }

  function startCreate() {
    setCreating(true); setBatch(null); setPreview(null); setDraft(null); setSelectedLearners(new Set()); setNotice(null);
  }

  function toggleLearner(id: string) {
    setPreview(null);
    setSelectedLearners((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function preparePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const templateVersionId = String(form.get('templateVersionId') ?? '');
    const template = references?.templates.find((item) => item.templateVersionId === templateVersionId);
    if (!template || selectedLearners.size === 0) return;
    const input: BatchIssuingContextInput = {
      idempotencyKey: draft?.idempotencyKey ?? crypto.randomUUID(),
      templateVersionId,
      programmeId: template.programmeId,
      programmeRunId: template.programmeRunId,
      credentialTypeId: template.credentialTypeId,
      languageCode: template.languageCode,
      issueDate: String(form.get('issueDate') ?? ''),
      completionDate: String(form.get('completionDate') ?? '') || null,
      learnerIds: activeLearners.filter((learner) => selectedLearners.has(learner.id)).map((learner) => learner.id),
    };
    setSaving(true); setNotice(null);
    try {
      const payload = await request<{ preview: BatchPreview }>('/api/v1/admin/credential-generation-batches/preview', { method: 'POST', body: JSON.stringify(input) });
      setDraft(input); setPreview(payload.preview);
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Batch preview could not be prepared.' }); }
    finally { setSaving(false); }
  }

  async function confirmBatch() {
    if (!draft || !preview || preview.archivedCount > 0 || preview.acceptedCount === 0) return;
    if (!window.confirm(`Confirm ${preview.selectedCount} selected learners? ${preview.acceptedCount} permanent credential numbers will be reserved during generation and will never be reused. ${preview.conflictCount} conflict${preview.conflictCount === 1 ? '' : 's'} will be recorded without duplicate credentials.`)) return;
    setSaving(true); setNotice(null);
    try {
      const payload = await request<{ batch: BatchDetail }>('/api/v1/admin/credential-generation-batches/confirm', { method: 'POST', body: JSON.stringify(draft) });
      setBatch(payload.batch); setCreating(false); setPreview(null);
      await loadWorkspace();
      setNotice({ kind: 'success', message: `Batch confirmed. ${payload.batch.pendingCount} accepted item${payload.batch.pendingCount === 1 ? '' : 's'} are ready for bounded generation.` });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Batch could not be confirmed.' }); }
    finally { setSaving(false); }
  }

  async function processAll() {
    if (!batch) return;
    setSaving(true); setNotice(null);
    let current = batch;
    let generated = 0;
    let retryable = 0;
    try {
      do {
        const payload = await request<{ result: BatchChunkResult }>(`/api/v1/admin/credential-generation-batches/${current.id}/process`, { method: 'POST' });
        current = payload.result.batch;
        generated += payload.result.generatedCount;
        retryable += payload.result.retryableCount;
        setBatch(current);
        if (!payload.result.hasMore) break;
      } while (true);
      await loadWorkspace();
      setBatch(current);
      setNotice({
        kind: retryable ? 'error' : 'success',
        message: `${generated} item${generated === 1 ? '' : 's'} generated in bounded chunks.${retryable ? ` ${retryable} item${retryable === 1 ? '' : 's'} need individual retry.` : ' Review every private PDF before marking an item reviewed.'}`,
      });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Batch processing stopped safely. Reload and resume.' }); }
    finally { setSaving(false); }
  }

  async function retryItem(itemId: string) {
    if (!batch) return;
    setSaving(true); setNotice(null);
    try {
      const payload = await request<{ batch: BatchDetail }>(`/api/v1/admin/credential-generation-batches/${batch.id}/items/${itemId}/retry`, { method: 'POST' });
      setBatch(payload.batch); await loadWorkspace(); setNotice({ kind: 'success', message: 'Batch item regenerated with its existing permanent number.' });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Batch item retry failed safely.' }); }
    finally { setSaving(false); }
  }

  async function reviewItem(itemId: string) {
    if (!batch) return;
    setSaving(true); setNotice(null);
    try {
      const payload = await request<{ batch: BatchDetail }>(`/api/v1/admin/credential-generation-batches/${batch.id}/items/${itemId}/review`, { method: 'POST' });
      setBatch(payload.batch); await loadWorkspace(); setNotice({ kind: 'success', message: 'Generated package marked reviewed and is now eligible for explicit batch activation.' });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Batch item could not be marked reviewed.' }); }
    finally { setSaving(false); }
  }

  async function activateSelected() {
    if (!batch) return;
    const itemIds = batch.items
      .filter((item) => selectedActivationItems.has(item.id) && item.activationEligible)
      .map((item) => item.id);
    if (!itemIds.length) return;
    if (!window.confirm(`Activate ${itemIds.length} explicitly selected reviewed credential${itemIds.length === 1 ? '' : 's'}? Each credential becomes valid independently. Empty recipient or VEDOS failure will not roll back activation or block another item.`)) return;
    const idempotencyKey = crypto.randomUUID();
    setSaving(true); setNotice(null);
    let current = batch;
    let sent = 0;
    let notSent = 0;
    let failed = 0;
    let retryableDelivery = 0;
    try {
      do {
        const payload = await request<{ result: BatchActivationChunkResult }>(`/api/v1/admin/credential-generation-batches/${batch.id}/activate`, {
          method: 'POST', body: JSON.stringify({ idempotencyKey, itemIds }),
        });
        current = payload.result.batch;
        sent += payload.result.activatedSentCount;
        notSent += payload.result.activatedNotSentCount;
        failed += payload.result.failedCount;
        retryableDelivery += payload.result.retryableDeliveryCount;
        setBatch(current);
        if (!payload.result.hasMore) break;
      } while (true);
      setSelectedActivationItems(new Set());
      await loadWorkspace(); setBatch(current);
      setNotice({
        kind: failed || retryableDelivery ? 'error' : 'success',
        message: `${sent + notSent + retryableDelivery} credential${sent + notSent + retryableDelivery === 1 ? '' : 's'} activated: ${sent} sent, ${notSent} not sent.${failed ? ` ${failed} activation${failed === 1 ? '' : 's'} failed safely and can be retried.` : ''}${retryableDelivery ? ` ${retryableDelivery} delivery result${retryableDelivery === 1 ? '' : 's'} need retry; credentials remain valid.` : ''}`,
      });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Batch activation stopped safely. Reload and resume the recorded request.' }); }
    finally { setSaving(false); }
  }

  async function retryActivation(activationItemId: string) {
    if (!batch) return;
    setSaving(true); setNotice(null);
    try {
      const payload = await request<{ result: BatchActivationChunkResult }>(`/api/v1/admin/credential-generation-batches/${batch.id}/activation-items/${activationItemId}/retry`, { method: 'POST' });
      setBatch(payload.result.batch); await loadWorkspace();
      setNotice({ kind: payload.result.failedCount || payload.result.retryableDeliveryCount ? 'error' : 'success', message: payload.result.activatedSentCount ? 'Credential remains valid and its complete PDF package was sent.' : payload.result.activatedNotSentCount ? 'Credential activated; delivery was recorded as not sent.' : 'Activation or delivery retry finished with a safe retryable outcome.' });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Activation or delivery retry failed safely.' }); }
    finally { setSaving(false); }
  }

  async function resumeActivationRequest(activationRequestId: string) {
    if (!batch) return;
    setSaving(true); setNotice(null);
    let current = batch;
    let processed = 0;
    try {
      do {
        const payload = await request<{ result: BatchActivationChunkResult }>(`/api/v1/admin/credential-generation-batches/${batch.id}/activation-requests/${activationRequestId}/process`, { method: 'POST' });
        current = payload.result.batch;
        processed += payload.result.processedCount;
        setBatch(current);
        if (!payload.result.hasMore) break;
      } while (true);
      await loadWorkspace(); setBatch(current);
      setNotice({ kind: 'success', message: processed ? `Resumed ${processed} recorded activation item${processed === 1 ? '' : 's'} safely.` : 'No queued or expired activation lease is currently available. An active worker may still be finishing this request.' });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Recorded activation request could not be resumed safely.' }); }
    finally { setSaving(false); }
  }

  async function previewFile(credentialId: string, fileId: string) {
    try {
      const payload = await request<{ signedUrl: string }>(`/api/v1/admin/credentials/${credentialId}/files/${fileId}?disposition=inline`);
      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Private preview could not be opened.' }); }
  }

  return <section className="credential-batch-module">
    <header className="credential-batch-heading">
      <div><small>PDFGEN-006 · private operations</small><h2>Batch generation and review</h2><p>Confirm one complete selected cohort, generate in automatic bounded chunks, retry individual failures, and review every private package.</p></div>
      <button type="button" onClick={startCreate}>Create generation batch</button>
    </header>
    {notice ? <div className={`credential-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div> : null}
    <div className="credential-batch-layout">
      <nav className="credential-batch-list" aria-label="Generation batches">
        {loading && batches.length === 0 ? <p>Loading batches…</p> : null}
        {!loading && batches.length === 0 ? <p>No generation batches yet.</p> : null}
        {batches.map((item) => <button type="button" key={item.id} aria-pressed={batch?.id === item.id} onClick={() => void openBatch(item.id)}>
          <strong>{item.context.programmeTitle}</strong><span>{item.context.credentialType} · {item.context.languageCode.toUpperCase()} · v{item.context.templateVersionNumber}</span>
          <small>{item.generatedCount}/{item.totalCount} generated · {item.retryableCount} retry · {formattedDate(item.createdAt)}</small>
        </button>)}
      </nav>
      <div className="credential-batch-editor">
        {creating && references ? <form className="credential-batch-create" onSubmit={(event) => void preparePreview(event)}>
          <header><div><small>Step 1 of 2</small><h3>Select context and complete cohort</h3></div><span>No cohort-size cap</span></header>
          <div className="credential-batch-context-fields">
            <label><span>Published Template Package</span><select name="templateVersionId" required disabled={saving} onChange={() => setPreview(null)}>
              <option value="">Select package…</option>{references.templates.map((template) => <option key={template.templateVersionId} value={template.templateVersionId}>{template.displayName} · {references.programmes.find((programme) => programme.id === template.programmeId)?.title ?? 'Programme'} · {template.languageCode.toUpperCase()} · v{template.versionNumber} · {template.documentCount} PDF / {template.pageCount} pages</option>)}
            </select></label>
            <label><span>Issue date</span><input type="date" name="issueDate" required defaultValue={new Date().toISOString().slice(0, 10)} disabled={saving} onChange={() => setPreview(null)} /></label>
            <label><span>Completion date <small>optional</small></span><input type="date" name="completionDate" disabled={saving} onChange={() => setPreview(null)} /></label>
          </div>
          <section className="credential-batch-learners">
            <header><div><h4>Learners</h4><span>{selectedLearners.size} explicitly selected of {activeLearners.length} active</span></div><input aria-label="Search learners" value={learnerSearch} onChange={(event) => setLearnerSearch(event.target.value)} placeholder="Search learner" /></header>
            <div className="credential-batch-selection-actions">
              <button type="button" className="secondary" disabled={saving || filteredLearners.length === 0} onClick={() => { setPreview(null); setSelectedLearners((current) => new Set([...current, ...filteredLearners.map((learner) => learner.id)])); }}>Select all shown</button>
              <button type="button" className="secondary" disabled={saving || selectedLearners.size === 0} onClick={() => { setPreview(null); setSelectedLearners(new Set()); }}>Clear selection</button>
            </div>
            <div className="credential-batch-learner-grid">{filteredLearners.map((learner) => <label key={learner.id}><input type="checkbox" checked={selectedLearners.has(learner.id)} onChange={() => toggleLearner(learner.id)} disabled={saving} /><span>{learner.name}</span></label>)}</div>
          </section>
          <footer><span>Preview is read-only. Permanent numbers are reserved only after confirmation and per-item generation begins.</span><button type="submit" disabled={saving || selectedLearners.size === 0}>{saving ? 'Checking…' : 'Preview conflicts'}</button></footer>
          {preview ? <section className="credential-batch-preview">
            <header><div><small>Step 2 of 2</small><h3>Confirm exact cohort</h3></div><span>{preview.selectedCount} selected</span></header>
            <div className="credential-batch-metrics"><span><strong>{preview.acceptedCount}</strong> accepted</span><span><strong>{preview.conflictCount}</strong> conflicts</span><span><strong>{preview.archivedCount}</strong> archived</span><span><strong>{preview.context.templateDocumentCount}</strong> PDF per credential</span></div>
            <p>{preview.context.programmeTitle} · {preview.context.credentialType} · {preview.context.languageCode.toUpperCase()} · {preview.context.templateDisplayName} v{preview.context.templateVersionNumber} · issue {preview.context.issueDate}</p>
            <div className="credential-batch-preview-list">{preview.learners.map((learner) => <div key={learner.learnerId}><span>{learner.position}. {learner.learnerName}</span><em className={learner.outcome}>{learner.outcome}{learner.conflictingDocumentNumber ? ` · ${learner.conflictingDocumentNumber}` : ''}</em></div>)}</div>
            {preview.archivedCount ? <p className="credential-batch-warning">Archived learners must be removed before confirmation.</p> : null}
            <button type="button" disabled={saving || preview.archivedCount > 0 || preview.acceptedCount === 0} onClick={() => void confirmBatch()}>{saving ? 'Confirming…' : `Confirm batch for ${preview.acceptedCount} accepted learners`}</button>
          </section> : null}
        </form> : null}
        {!creating && batch ? <BatchReview batch={batch} saving={saving} selectedActivationItems={selectedActivationItems} onToggleActivation={(id) => setSelectedActivationItems((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onSelectAllActivation={() => setSelectedActivationItems(new Set(batch.items.filter((item) => item.activationEligible).map((item) => item.id)))} onClearActivation={() => setSelectedActivationItems(new Set())} onActivate={() => void activateSelected()} onResumeActivation={(id) => void resumeActivationRequest(id)} onRetryActivation={(id) => void retryActivation(id)} onProcess={() => void processAll()} onRetry={(id) => void retryItem(id)} onReview={(id) => void reviewItem(id)} onPreview={(credentialId, fileId) => void previewFile(credentialId, fileId)} /> : null}
        {!creating && !batch ? <div className="credential-empty editor"><strong>Select or create a batch</strong><span>The aggregate review keeps the entire selected cohort under one resumable record.</span></div> : null}
      </div>
    </div>
  </section>;
}

function BatchReview({ batch, saving, selectedActivationItems, onToggleActivation, onSelectAllActivation, onClearActivation, onActivate, onResumeActivation, onRetryActivation, onProcess, onRetry, onReview, onPreview }: {
  batch: BatchDetail; saving: boolean; onProcess: () => void; onRetry: (id: string) => void;
  selectedActivationItems: Set<string>; onToggleActivation: (id: string) => void;
  onSelectAllActivation: () => void; onClearActivation: () => void; onActivate: () => void;
  onResumeActivation: (id: string) => void; onRetryActivation: (id: string) => void; onReview: (id: string) => void;
  onPreview: (credentialId: string, fileId: string) => void;
}) {
  const eligibleCount = batch.items.filter((item) => item.activationEligible).length;
  const resumableRequestIds = [...new Set(batch.items
    .filter((item) => item.activation?.requestStatus === 'processing' && ['queued', 'processing'].includes(item.activation.status))
    .map((item) => item.activation?.requestId)
    .filter((id): id is string => Boolean(id)))];
  return <section className="credential-batch-review">
    <header><div><small>PDFGEN-007 · aggregate batch · {batch.status}</small><h3>{batch.context.programmeTitle}</h3><p>{batch.context.credentialType} · {batch.context.languageCode.toUpperCase()} · {batch.context.templateDisplayName} v{batch.context.templateVersionNumber} · {batch.context.templateDocumentCount} PDF / {batch.context.templatePageCount} pages per learner</p></div>
      {batch.pendingCount > 0 ? <button type="button" disabled={saving} onClick={onProcess}>{saving ? 'Processing bounded chunks…' : `Generate remaining ${batch.pendingCount}`}</button> : null}
    </header>
    <div className="credential-batch-metrics"><span><strong>{batch.totalCount}</strong> total</span><span><strong>{batch.generatedCount}</strong> generated</span><span><strong>{batch.reviewedCount}</strong> reviewed</span><span><strong>{batch.activatedCount}</strong> activated</span><span><strong>{batch.activationSentCount}</strong> sent</span><span><strong>{batch.activationNotSentCount}</strong> not sent</span><span><strong>{batch.activationFailedCount}</strong> failed</span></div>
    <p className="credential-batch-review-note">Generated files remain private. Only explicitly selected reviewed packages activate. Each valid credential keeps its own immutable delivery history; an empty recipient or VEDOS failure never rolls back activation or blocks another item.</p>
    {eligibleCount ? <div className="credential-batch-activation-toolbar"><div><strong>{selectedActivationItems.size}</strong><span> selected of {eligibleCount} activation-eligible</span></div><div><button type="button" className="secondary" disabled={saving} onClick={onSelectAllActivation}>Select all eligible</button><button type="button" className="secondary" disabled={saving || selectedActivationItems.size === 0} onClick={onClearActivation}>Clear</button><button type="button" disabled={saving || selectedActivationItems.size === 0} onClick={onActivate}>{saving ? 'Activating bounded chunks…' : `Activate selected ${selectedActivationItems.size}`}</button></div></div> : null}
    {resumableRequestIds.map((requestId) => <div className="credential-batch-resume" key={requestId}><span>An earlier activation request has queued work or an active/expired lease.</span><button type="button" disabled={saving} onClick={() => onResumeActivation(requestId)}>Resume recorded activation</button></div>)}
    <div className="credential-batch-items">{batch.items.map((item) => <article key={item.id}>
      <header><div><strong>{item.position}. {item.learnerName}</strong><span>{item.documentNumber ?? (item.status === 'conflict' ? 'Existing credential conflict' : 'Number not reserved yet')} · attempt {item.attemptCount}</span></div><em className={item.status}>{statusLabel[item.status]}</em></header>
      {item.lastErrorCode ? <p className="credential-batch-error">Validation: {item.lastErrorCode.replaceAll('_', ' ')}</p> : null}
      {item.files.length ? <div className="credential-batch-files">{item.files.map((file) => <button type="button" key={file.id} disabled={saving || !item.credentialId} onClick={() => item.credentialId && onPreview(item.credentialId, file.id)}><strong>{file.adminLabel}</strong><span>{file.pageCount} page{file.pageCount === 1 ? '' : 's'}{file.isPrimary ? ' · Primary' : ''} · Private preview</span></button>)}</div> : null}
      <footer>
        {['retryable', 'failed'].includes(item.status) ? <button type="button" disabled={saving} onClick={() => onRetry(item.id)}>Retry this item</button> : null}
        {item.status === 'generated' ? <button type="button" disabled={saving || item.files.length !== batch.context.templateDocumentCount} onClick={() => onReview(item.id)}>Mark package reviewed</button> : null}
        {item.activationEligible ? <label className="credential-batch-activation-choice"><input type="checkbox" checked={selectedActivationItems.has(item.id)} disabled={saving} onChange={() => onToggleActivation(item.id)} /><span>Select reviewed item for activation</span></label> : null}
        {item.activation ? <span className={`credential-batch-activation-outcome ${item.activation.status}`}>Activation: {item.activation.status.replaceAll('_', ' ')} · attempt {item.activation.attemptCount}{item.activation.deliveryStatus ? ` · delivery ${item.activation.deliveryStatus.replaceAll('_', ' ')}` : ''}</span> : null}
        {item.activation && ['activation_failed', 'delivery_retryable'].includes(item.activation.status) ? <button type="button" disabled={saving} onClick={() => onRetryActivation(item.activation!.id)}>Retry activation/delivery</button> : null}
      </footer>
    </article>)}</div>
  </section>;
}
