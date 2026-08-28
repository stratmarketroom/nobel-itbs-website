'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BatchActivationChunkResult,
  BatchChunkResult,
  BatchDetail,
  BatchIssuingContextInput,
  BatchListItem,
  BatchPreview,
  BatchReferenceData,
  BatchReviewFile,
  BatchReviewResult,
  CredentialGenerationItemStatus,
} from '@/lib/credentials/batch-generation-types';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
type RequestBlob = (path: string) => Promise<Blob>;
type Notice = { kind: 'success' | 'error'; message: string } | null;
const reviewPageSize = 25;

const statusLabel: Record<CredentialGenerationItemStatus, string> = {
  queued: 'Queued', processing: 'Processing', generated: 'Generated', retryable: 'Retryable',
  conflict: 'Conflict', reviewed: 'Reviewed', activating: 'Activating', activated: 'Activated', failed: 'Failed',
};

function formattedDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : '—';
}

export function AdminCredentialBatches({ request, requestBlob }: { request: Request; requestBlob: RequestBlob }) {
  const [references, setReferences] = useState<BatchReferenceData | null>(null);
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [draft, setDraft] = useState<BatchIssuingContextInput | null>(null);
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [selectedReviewItems, setSelectedReviewItems] = useState<Set<string>>(new Set());
  const [openedReviewFiles, setOpenedReviewFiles] = useState<Set<string>>(new Set());
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
    setLoading(true); setCreating(false); setPreview(null); setSelectedReviewItems(new Set()); setOpenedReviewFiles(new Set()); setSelectedActivationItems(new Set()); setNotice(null);
    try { setBatch((await request<{ batch: BatchDetail }>(`/api/v1/admin/credential-generation-batches/${id}`)).batch); }
    catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Generation batch could not be loaded.' }); }
    finally { setLoading(false); }
  }

  function startCreate() {
    setCreating(true); setBatch(null); setPreview(null); setDraft(null); setSelectedLearners(new Set()); setSelectedReviewItems(new Set()); setOpenedReviewFiles(new Set()); setNotice(null);
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
      const replacedFileIds = batch.items.find((item) => item.id === itemId)?.files.map((file) => file.id) ?? [];
      setOpenedReviewFiles((current) => new Set([...current].filter((id) => !replacedFileIds.includes(id))));
      setSelectedReviewItems((current) => new Set([...current].filter((id) => id !== itemId)));
      setBatch(payload.batch); await loadWorkspace(); setNotice({ kind: 'success', message: 'Batch item regenerated with its existing permanent number.' });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Batch item retry failed safely.' }); }
    finally { setSaving(false); }
  }

  async function reviewSelected() {
    if (!batch) return;
    const itemIds = batch.items
      .filter((item) => selectedReviewItems.has(item.id) && item.status === 'generated'
        && item.files.length === batch.context.templateDocumentCount
        && item.files.every((file) => openedReviewFiles.has(file.id)))
      .map((item) => item.id)
      .slice(0, reviewPageSize);
    if (!itemIds.length) return;
    if (!window.confirm(`Mark ${itemIds.length} selected package${itemIds.length === 1 ? '' : 's'} reviewed? This records you as reviewer and makes the packages activation-eligible. It does not activate or email any credential.`)) return;
    setSaving(true); setNotice(null);
    try {
      const payload = await request<{ result: BatchReviewResult }>(`/api/v1/admin/credential-generation-batches/${batch.id}/review`, {
        method: 'POST', body: JSON.stringify({ itemIds }),
      });
      setBatch(payload.result.batch);
      setSelectedReviewItems(new Set());
      await loadWorkspace();
      setNotice({
        kind: payload.result.failedCount ? 'error' : 'success',
        message: `${payload.result.reviewedCount} package${payload.result.reviewedCount === 1 ? '' : 's'} marked reviewed.${payload.result.failedCount ? ` ${payload.result.failedCount} changed before completion and remain unreviewed.` : ' Activation remains a separate explicit action.'}`,
      });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Selected packages could not be marked reviewed.' }); }
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
    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      setNotice({ kind: 'error', message: 'The browser blocked the private preview tab. Allow pop-ups for this admin site and try again.' });
      return;
    }
    previewWindow.opener = null;
    try {
      const payload = await request<{ signedUrl: string }>(`/api/v1/admin/credentials/${credentialId}/files/${fileId}?disposition=inline`);
      previewWindow.location.replace(payload.signedUrl);
      setOpenedReviewFiles((current) => new Set([...current, fileId]));
    } catch (error) {
      previewWindow.close();
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Private preview could not be opened.' });
    }
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
        {!creating && batch ? <BatchReview key={batch.id} batch={batch} saving={saving} requestBlob={requestBlob} selectedReviewItems={selectedReviewItems} openedReviewFiles={openedReviewFiles} onToggleReview={(id) => setSelectedReviewItems((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onSetReviewSelection={(ids) => setSelectedReviewItems(new Set(ids))} onClearReview={() => setSelectedReviewItems(new Set())} onReviewSelected={() => void reviewSelected()} selectedActivationItems={selectedActivationItems} onToggleActivation={(id) => setSelectedActivationItems((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onSelectAllActivation={() => setSelectedActivationItems(new Set(batch.items.filter((item) => item.activationEligible).map((item) => item.id)))} onClearActivation={() => setSelectedActivationItems(new Set())} onActivate={() => void activateSelected()} onResumeActivation={(id) => void resumeActivationRequest(id)} onRetryActivation={(id) => void retryActivation(id)} onProcess={() => void processAll()} onRetry={(id) => void retryItem(id)} onPreview={(credentialId, fileId) => void previewFile(credentialId, fileId)} /> : null}
        {!creating && !batch ? <div className="credential-empty editor"><strong>Select or create a batch</strong><span>The aggregate review keeps the entire selected cohort under one resumable record.</span></div> : null}
      </div>
    </div>
  </section>;
}

function BatchReview({ batch, saving, requestBlob, selectedReviewItems, openedReviewFiles, onToggleReview, onSetReviewSelection, onClearReview, onReviewSelected, selectedActivationItems, onToggleActivation, onSelectAllActivation, onClearActivation, onActivate, onResumeActivation, onRetryActivation, onProcess, onRetry, onPreview }: {
  batch: BatchDetail; saving: boolean; requestBlob: RequestBlob; onProcess: () => void; onRetry: (id: string) => void;
  selectedReviewItems: Set<string>; openedReviewFiles: Set<string>; onToggleReview: (id: string) => void;
  onSetReviewSelection: (ids: string[]) => void; onClearReview: () => void; onReviewSelected: () => void;
  selectedActivationItems: Set<string>; onToggleActivation: (id: string) => void;
  onSelectAllActivation: () => void; onClearActivation: () => void; onActivate: () => void;
  onResumeActivation: (id: string) => void; onRetryActivation: (id: string) => void;
  onPreview: (credentialId: string, fileId: string) => void;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(batch.items.length / reviewPageSize));
  const pageItems = batch.items.slice((page - 1) * reviewPageSize, page * reviewPageSize);
  const readyForSelection = pageItems.filter((item) => item.status === 'generated'
    && item.files.length === batch.context.templateDocumentCount
    && item.files.every((file) => openedReviewFiles.has(file.id)));
  const selectedOnPage = pageItems.filter((item) => selectedReviewItems.has(item.id)).length;
  const eligibleCount = batch.items.filter((item) => item.activationEligible).length;
  const resumableRequestIds = [...new Set(batch.items
    .filter((item) => item.activation?.requestStatus === 'processing' && ['queued', 'processing'].includes(item.activation.status))
    .map((item) => item.activation?.requestId)
    .filter((id): id is string => Boolean(id)))];

  function changePage(nextPage: number) {
    onClearReview();
    setPage(Math.max(1, Math.min(totalPages, nextPage)));
  }

  return <section className="credential-batch-review">
    <header><div><small>PDFGEN-007 · aggregate batch · {batch.status}</small><h3>{batch.context.programmeTitle}</h3><p>{batch.context.credentialType} · {batch.context.languageCode.toUpperCase()} · {batch.context.templateDisplayName} v{batch.context.templateVersionNumber} · {batch.context.templateDocumentCount} PDF / {batch.context.templatePageCount} pages per learner</p></div>
      {batch.pendingCount > 0 ? <button type="button" disabled={saving} onClick={onProcess}>{saving ? 'Processing bounded chunks…' : `Generate remaining ${batch.pendingCount}`}</button> : null}
    </header>
    <div className="credential-batch-metrics"><span><strong>{batch.totalCount}</strong> total</span><span><strong>{batch.generatedCount}</strong> generated</span><span><strong>{batch.reviewedCount}</strong> reviewed</span><span><strong>{batch.activatedCount}</strong> activated</span><span><strong>{batch.activationSentCount}</strong> sent</span><span><strong>{batch.activationNotSentCount}</strong> not sent</span><span><strong>{batch.activationFailedCount}</strong> failed</span></div>
    <p className="credential-batch-review-note">Generated files remain private. Review every package before selection: holder, programme, credential type, dates, number, QR, and layout. Review never activates or emails a credential.</p>
    <div className="credential-batch-review-toolbar">
      <div><strong>{selectedOnPage}</strong><span> selected on page {page} of {totalPages}</span><small>Open every PDF in a package to enable its review checkbox.</small></div>
      <div><button type="button" className="secondary" disabled={saving || readyForSelection.length === 0} onClick={() => onSetReviewSelection(readyForSelection.map((item) => item.id))}>Select opened packages</button><button type="button" className="secondary" disabled={saving || selectedReviewItems.size === 0} onClick={onClearReview}>Clear</button><button type="button" aria-label="Mark package reviewed for selected items" disabled={saving || selectedReviewItems.size === 0} onClick={onReviewSelected}>{saving ? 'Recording review…' : `Mark selected reviewed ${selectedReviewItems.size}`}</button></div>
    </div>
    {eligibleCount ? <div className="credential-batch-activation-toolbar"><div><strong>{selectedActivationItems.size}</strong><span> selected of {eligibleCount} activation-eligible</span></div><div><button type="button" className="secondary" disabled={saving} onClick={onSelectAllActivation}>Select all eligible</button><button type="button" className="secondary" disabled={saving || selectedActivationItems.size === 0} onClick={onClearActivation}>Clear</button><button type="button" disabled={saving || selectedActivationItems.size === 0} onClick={onActivate}>{saving ? 'Activating bounded chunks…' : `Activate selected ${selectedActivationItems.size}`}</button></div></div> : null}
    {resumableRequestIds.map((requestId) => <div className="credential-batch-resume" key={requestId}><span>An earlier activation request has queued work or an active/expired lease.</span><button type="button" disabled={saving} onClick={() => onResumeActivation(requestId)}>Resume recorded activation</button></div>)}
    <nav className="credential-batch-pagination" aria-label="Batch review pages"><button type="button" className="secondary" disabled={saving || page === 1} onClick={() => changePage(page - 1)}>Previous 25</button><span>Items {(page - 1) * reviewPageSize + 1}–{Math.min(page * reviewPageSize, batch.items.length)} of {batch.items.length}</span><button type="button" className="secondary" disabled={saving || page === totalPages} onClick={() => changePage(page + 1)}>Next 25</button></nav>
    <div className="credential-batch-items">{pageItems.map((item) => {
      const packageOpened = item.files.length === batch.context.templateDocumentCount && item.files.every((file) => openedReviewFiles.has(file.id));
      return <article key={item.id}>
      <header><div><strong>{item.position}. {item.learnerName}</strong><span>{item.documentNumber ?? (item.status === 'conflict' ? 'Existing credential conflict' : 'Number not reserved yet')} · attempt {item.attemptCount}</span></div><em className={item.status}>{statusLabel[item.status]}</em></header>
      {item.lastErrorCode ? <p className="credential-batch-error">Validation: {item.lastErrorCode.replaceAll('_', ' ')}</p> : null}
      {item.files.length && item.credentialId ? <div className="credential-batch-files">{item.files.map((file) => <CredentialReviewThumbnail key={file.id} credentialId={item.credentialId!} learnerName={item.learnerName} file={file} opened={openedReviewFiles.has(file.id)} saving={saving} requestBlob={requestBlob} onOpen={() => onPreview(item.credentialId!, file.id)} />)}</div> : null}
      <footer>
        {['retryable', 'failed'].includes(item.status) ? <button type="button" disabled={saving} onClick={() => onRetry(item.id)}>Retry this item</button> : null}
        {item.status === 'generated' ? <label className={`credential-batch-review-choice${packageOpened ? ' ready' : ''}`}><input type="checkbox" checked={selectedReviewItems.has(item.id)} disabled={saving || !packageOpened} onChange={() => onToggleReview(item.id)} /><span>{packageOpened ? 'Select reviewed package' : `Open ${item.files.filter((file) => !openedReviewFiles.has(file.id)).length} remaining PDF${item.files.filter((file) => !openedReviewFiles.has(file.id)).length === 1 ? '' : 's'} before selection`}</span></label> : null}
        {item.activationEligible ? <label className="credential-batch-activation-choice"><input type="checkbox" checked={selectedActivationItems.has(item.id)} disabled={saving} onChange={() => onToggleActivation(item.id)} /><span>Select reviewed item for activation</span></label> : null}
        {item.activation ? <span className={`credential-batch-activation-outcome ${item.activation.status}`}>Activation: {item.activation.status.replaceAll('_', ' ')} · attempt {item.activation.attemptCount}{item.activation.deliveryStatus ? ` · delivery ${item.activation.deliveryStatus.replaceAll('_', ' ')}` : ''}</span> : null}
        {item.activation && ['activation_failed', 'delivery_retryable'].includes(item.activation.status) ? <button type="button" disabled={saving} onClick={() => onRetryActivation(item.activation!.id)}>Retry activation/delivery</button> : null}
      </footer>
    </article>;})}</div>
    <nav className="credential-batch-pagination bottom" aria-label="Batch review pages"><button type="button" className="secondary" disabled={saving || page === 1} onClick={() => changePage(page - 1)}>Previous 25</button><span>Page {page} of {totalPages}</span><button type="button" className="secondary" disabled={saving || page === totalPages} onClick={() => changePage(page + 1)}>Next 25</button></nav>
  </section>;
}

function CredentialReviewThumbnail({ credentialId, learnerName, file, opened, saving, requestBlob, onOpen }: {
  credentialId: string; learnerName: string; file: BatchReviewFile; opened: boolean; saving: boolean;
  requestBlob: RequestBlob; onOpen: () => void;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    void requestBlob(`/api/v1/admin/credentials/${credentialId}/files/${file.id}/pages/1`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setThumbnailUrl(objectUrl);
      })
      .catch(() => { if (active) setThumbnailError(true); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [credentialId, file.id, requestBlob]);

  return <button type="button" className={`credential-review-thumbnail${opened ? ' opened' : ''}`} disabled={saving} onClick={onOpen}>
    <span className="credential-review-thumbnail-image">{thumbnailUrl ? <img src={thumbnailUrl} loading="lazy" alt={`First page of ${file.adminLabel} for ${learnerName}`} /> : <span>{thumbnailError ? 'Thumbnail unavailable' : 'Loading private thumbnail…'}</span>}</span>
    <strong>{file.adminLabel}</strong>
    <span>{file.pageCount} page{file.pageCount === 1 ? '' : 's'}{file.isPrimary ? ' · Primary' : ''} · {opened ? 'Opened' : 'Open and inspect'}</span>
  </button>;
}
