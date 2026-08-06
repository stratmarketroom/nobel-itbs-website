'use client';

import { useMemo, useState } from 'react';
import type { PricingOption, PricingTranslation, Programme, ProgrammeRun } from '@/components/admin-programmes';

type Locale = 'en' | 'ua' | 'cz';
type RunEditor = { status: ProgrammeRun['status']; startsAt: string; endsAt: string; applicationUrl: string };
type PricingEditor = { price: string; currencyCode: string; applicationUrl: string; sortOrder: string; isActive: boolean };
type PricingTranslationEditor = { translationStatus: PricingTranslation['translation_status']; title: string; description: string; ctaLabel: string };

const locales: Locale[] = ['en', 'ua', 'cz'];

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

function runEditor(run?: ProgrammeRun): RunEditor {
  return { status: run?.status ?? 'upcoming', startsAt: run?.starts_at ?? '', endsAt: run?.ends_at ?? '', applicationUrl: run?.application_url ?? '' };
}

function pricingEditor(option?: PricingOption, nextOrder = 0): PricingEditor {
  return { price: option?.price === null || option?.price === undefined ? '' : String(option.price), currencyCode: option?.currency_code ?? 'EUR', applicationUrl: option?.application_url ?? '', sortOrder: String(option?.sort_order ?? nextOrder), isActive: option?.is_active ?? false };
}

function pricingTranslationEditor(option: PricingOption | undefined, locale: Locale): PricingTranslationEditor {
  const translation = option?.programme_pricing_option_translations.find((item) => item.language_code === locale);
  return { translationStatus: translation?.translation_status ?? 'missing', title: translation?.title ?? '', description: translation?.description ?? '', ctaLabel: translation?.cta_label ?? '' };
}

function runLabel(run: ProgrammeRun): string {
  if (run.starts_at && run.ends_at) return `${run.starts_at} to ${run.ends_at}`;
  if (run.starts_at) return `Starts ${run.starts_at}`;
  return 'Continuous access';
}

function priceLabel(option: PricingOption): string {
  if (option.price === null) return 'No public price';
  return `${option.currency_code ?? ''} ${Number(option.price).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`.trim();
}

export function AdminProgrammeOperations({ mode, programme, accessToken, onRefresh }: { mode: 'runs' | 'pricing'; programme: Programme; accessToken: () => Promise<string>; onRefresh: () => Promise<void> }) {
  return mode === 'runs'
    ? <RunManager programme={programme} accessToken={accessToken} onRefresh={onRefresh} />
    : <PricingManager programme={programme} accessToken={accessToken} onRefresh={onRefresh} />;
}

function RunManager({ programme, accessToken, onRefresh }: { programme: Programme; accessToken: () => Promise<string>; onRefresh: () => Promise<void> }) {
  const sortedRuns = useMemo(() => [...programme.programme_runs].sort((a, b) => (a.starts_at ?? '9999').localeCompare(b.starts_at ?? '9999')), [programme.programme_runs]);
  const [selectedId, setSelectedId] = useState<string | 'new'>(sortedRuns[0]?.id ?? 'new');
  const selected = sortedRuns.find((item) => item.id === selectedId);
  const [editor, setEditor] = useState<RunEditor>(runEditor(selected));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function choose(id: string | 'new') {
    const run = sortedRuns.find((item) => item.id === id);
    setSelectedId(id); setEditor(runEditor(run)); setMessage(''); setConfirmDelete(false);
  }

  function validate(): void {
    if (editor.startsAt && editor.endsAt && editor.endsAt < editor.startsAt) throw new Error('End date cannot be before the start date.');
    if (editor.applicationUrl && !editor.applicationUrl.startsWith('https://')) throw new Error('Run URL must start with https://.');
  }

  async function save() {
    validate(); setSaving(true); setMessage('');
    try {
      const creating = selectedId === 'new';
      const response = await fetch(creating ? '/api/v1/admin/programme-runs' : `/api/v1/admin/programme-runs/${selectedId}`, {
        method: creating ? 'POST' : 'PATCH',
        headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(creating ? { programmeId: programme.id, status: editor.status, startsAt: editor.startsAt || null, endsAt: editor.endsAt || null, applicationUrl: editor.applicationUrl.trim() || null } : { record: { status: editor.status, startsAt: editor.startsAt || null, endsAt: editor.endsAt || null, applicationUrl: editor.applicationUrl.trim() || null } }),
      });
      const payload = await response.json().catch(() => null) as { run?: ProgrammeRun } | null;
      if (!response.ok || !payload?.run) throw new Error(apiMessage(payload, 'Programme run could not be saved.'));
      setSelectedId(payload.run.id); await onRefresh(); setMessage(creating ? 'Run created.' : 'Run updated.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Programme run could not be saved.'); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (selectedId === 'new') return; setSaving(true); setMessage('');
    try {
      const response = await fetch(`/api/v1/admin/programme-runs/${selectedId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${await accessToken()}` } });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiMessage(payload, 'Programme run could not be removed.'));
      setSelectedId('new'); setEditor(runEditor()); await onRefresh(); setMessage('Run removed.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Programme run could not be removed.'); }
    finally { setSaving(false); setConfirmDelete(false); }
  }

  return <section className="programme-operation-panel">
    <header><div><h3>Programme runs</h3><p>Run status drives the public enrolment badge unless a correction is set on the programme.</p></div><button type="button" onClick={() => choose('new')}>New run</button></header>
    {message ? <p className="programme-operation-message" role="status">{message}</p> : null}
    <div className="programme-operation-layout"><nav aria-label="Programme runs">{sortedRuns.map((run) => <button type="button" key={run.id} aria-pressed={selectedId === run.id} onClick={() => choose(run.id)}><strong>{runLabel(run)}</strong><span className={`programme-run-status ${run.status}`}>{run.status}</span></button>)}{sortedRuns.length === 0 ? <p>No runs yet. Add a continuous or date-based run.</p> : null}</nav>
      <form onSubmit={(event) => { event.preventDefault(); void save(); }}><div className="programme-operation-heading"><strong>{selectedId === 'new' ? 'New run' : runLabel(selected as ProgrammeRun)}</strong><span>{selectedId === 'new' ? 'Unsaved' : 'Existing record'}</span></div><div className="programme-form-grid"><label><span>Status</span><select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value as ProgrammeRun['status'] })}><option value="upcoming">Upcoming</option><option value="open">Open</option><option value="ongoing">Ongoing</option><option value="closed">Closed</option></select></label><label><span>Application URL</span><input type="url" placeholder="Optional run-specific https:// URL" value={editor.applicationUrl} onChange={(event) => setEditor({ ...editor, applicationUrl: event.target.value })} /></label><label><span>Learning start</span><input type="date" value={editor.startsAt} onChange={(event) => setEditor({ ...editor, startsAt: event.target.value })} /></label><label><span>Learning end</span><input type="date" value={editor.endsAt} onChange={(event) => setEditor({ ...editor, endsAt: event.target.value })} /></label></div><p className="programme-operation-note">A start date describes learning commencement. It does not automatically close enrolment.</p><div className="programme-operation-actions">{selectedId !== 'new' ? confirmDelete ? <><button type="button" className="danger" onClick={() => void remove()} disabled={saving}>Confirm remove</button><button type="button" className="text" onClick={() => setConfirmDelete(false)}>Cancel</button></> : <button type="button" className="text danger-text" onClick={() => setConfirmDelete(true)}>Remove run</button> : <span /> }<button type="submit" disabled={saving}>{saving ? 'Saving…' : selectedId === 'new' ? 'Create run' : 'Save run'}</button></div></form>
    </div>
  </section>;
}

function PricingManager({ programme, accessToken, onRefresh }: { programme: Programme; accessToken: () => Promise<string>; onRefresh: () => Promise<void> }) {
  const options = useMemo(() => [...programme.programme_pricing_options].sort((a, b) => a.sort_order - b.sort_order), [programme.programme_pricing_options]);
  const nextOrder = options.reduce((highest, option) => Math.max(highest, option.sort_order), -1) + 1;
  const [selectedId, setSelectedId] = useState<string | 'new'>(options[0]?.id ?? 'new');
  const selected = options.find((item) => item.id === selectedId);
  const [editor, setEditor] = useState<PricingEditor>(pricingEditor(selected, nextOrder));
  const [locale, setLocale] = useState<Locale>('en');
  const [translation, setTranslation] = useState<PricingTranslationEditor>(pricingTranslationEditor(selected, 'en'));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function choose(id: string | 'new') {
    const option = options.find((item) => item.id === id);
    setSelectedId(id); setEditor(pricingEditor(option, nextOrder)); setTranslation(pricingTranslationEditor(option, locale)); setMessage(''); setConfirmDelete(false);
  }

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale); setTranslation(pricingTranslationEditor(selected, nextLocale)); setMessage('');
  }

  function validateRecord(): { price: number | null; currencyCode: string | null } {
    const price = editor.price.trim() === '' ? null : Number(editor.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error('Price must be a non-negative number.');
    if (price !== null && !/^[A-Z]{3}$/.test(editor.currencyCode)) throw new Error('Currency must use a three-letter uppercase code.');
    if (!Number.isInteger(Number(editor.sortOrder)) || Number(editor.sortOrder) < 0) throw new Error('Sort order must be a non-negative integer.');
    if (editor.applicationUrl && !editor.applicationUrl.startsWith('https://')) throw new Error('Pricing URL must start with https://.');
    if (editor.isActive && selectedId === 'new') throw new Error('Create the pricing option as inactive, then add its English translation before activation.');
    if (editor.isActive && selected?.programme_pricing_option_translations.find((item) => item.language_code === 'en')?.translation_status !== 'published') {
      throw new Error('Publish the English pricing translation before activating this option.');
    }
    return { price, currencyCode: price === null ? null : editor.currencyCode };
  }

  async function saveRecord() {
    const price = validateRecord(); setSaving(true); setMessage('');
    try {
      const creating = selectedId === 'new';
      if (creating && options.length >= 3) throw new Error('A programme can have up to three pricing options in Release 1.');
      const record = { ...price, applicationUrl: editor.applicationUrl.trim() || null, sortOrder: Number(editor.sortOrder), isActive: editor.isActive };
      const response = await fetch(creating ? '/api/v1/admin/programme-pricing-options' : `/api/v1/admin/programme-pricing-options/${selectedId}`, { method: creating ? 'POST' : 'PATCH', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(creating ? { programmeId: programme.id, ...record } : { record }) });
      const payload = await response.json().catch(() => null) as { pricingOption?: PricingOption } | null;
      if (!response.ok || !payload?.pricingOption) throw new Error(apiMessage(payload, 'Pricing option could not be saved.'));
      setSelectedId(payload.pricingOption.id); await onRefresh(); setMessage(creating ? 'Pricing option created. Add its translations before activation.' : 'Pricing option updated.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Pricing option could not be saved.'); }
    finally { setSaving(false); }
  }

  async function saveTranslation() {
    if (selectedId === 'new') return; setSaving(true); setMessage('');
    try {
      const response = await fetch(`/api/v1/admin/programme-pricing-options/${selectedId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ translation: { languageCode: locale, ...translation } }) });
      const payload = await response.json().catch(() => null) as { pricingOption?: PricingOption } | null;
      if (!response.ok || !payload?.pricingOption) throw new Error(apiMessage(payload, 'Pricing translation could not be saved.'));
      await onRefresh(); setTranslation(pricingTranslationEditor(payload.pricingOption, locale)); setMessage(`${locale.toUpperCase()} pricing translation saved.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Pricing translation could not be saved.'); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (selectedId === 'new') return; setSaving(true); setMessage('');
    try {
      const response = await fetch(`/api/v1/admin/programme-pricing-options/${selectedId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${await accessToken()}` } });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiMessage(payload, 'Pricing option could not be removed.'));
      setSelectedId('new'); setEditor(pricingEditor(undefined, nextOrder)); setTranslation(pricingTranslationEditor(undefined, locale)); await onRefresh(); setMessage('Pricing option removed.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Pricing option could not be removed.'); }
    finally { setSaving(false); setConfirmDelete(false); }
  }

  return <section className="programme-operation-panel">
    <header><div><h3>Pricing options</h3><p>Use one to three options. A pricing URL takes priority over run and programme URLs.</p></div><button type="button" disabled={options.length >= 3} onClick={() => choose('new')}>{options.length >= 3 ? '3 option limit' : 'New option'}</button></header>
    {message ? <p className="programme-operation-message" role="status">{message}</p> : null}
    <div className="programme-url-hierarchy" aria-label="Application URL priority"><span>1 Pricing option URL</span><span>2 Active run URL</span><span>3 Programme URL</span><span>4 Question fallback</span></div>
    <div className="programme-operation-layout"><nav aria-label="Pricing options">{options.map((option) => <button type="button" key={option.id} aria-pressed={selectedId === option.id} onClick={() => choose(option.id)}><strong>{option.programme_pricing_option_translations.find((item) => item.language_code === 'en')?.title || `Option ${option.sort_order + 1}`}</strong><span>{priceLabel(option)} · {option.is_active ? 'Active' : 'Inactive'}</span></button>)}{options.length === 0 ? <p>No pricing options. The public pricing block stays hidden.</p> : null}</nav>
        <div className="programme-pricing-editor"><form onSubmit={(event) => { event.preventDefault(); void saveRecord(); }}><div className="programme-operation-heading"><strong>{selectedId === 'new' ? 'New pricing option' : selected ? priceLabel(selected) : 'Loading pricing option…'}</strong><span>{selectedId === 'new' ? 'Unsaved' : selected?.is_active ? 'Active' : 'Inactive'}</span></div><div className="programme-form-grid"><label><span>Price</span><input type="number" min="0" step="0.01" placeholder="Optional" value={editor.price} onChange={(event) => setEditor({ ...editor, price: event.target.value })} /></label><label><span>Currency</span><input maxLength={3} disabled={!editor.price} value={editor.currencyCode} onChange={(event) => setEditor({ ...editor, currencyCode: event.target.value.toUpperCase() })} /></label><label><span>Pricing URL</span><input type="url" placeholder="Optional https:// URL" value={editor.applicationUrl} onChange={(event) => setEditor({ ...editor, applicationUrl: event.target.value })} /></label><label><span>Sort order</span><input type="number" min="0" step="1" value={editor.sortOrder} onChange={(event) => setEditor({ ...editor, sortOrder: event.target.value })} /></label></div><label className="programme-check-field"><input type="checkbox" disabled={selectedId === 'new'} checked={editor.isActive} onChange={(event) => setEditor({ ...editor, isActive: event.target.checked })} /><span>Show this pricing option publicly when its English translation is published</span></label><div className="programme-operation-actions">{selectedId !== 'new' ? confirmDelete ? <><button type="button" className="danger" onClick={() => void remove()} disabled={saving}>Confirm remove</button><button type="button" className="text" onClick={() => setConfirmDelete(false)}>Cancel</button></> : <button type="button" className="text danger-text" onClick={() => setConfirmDelete(true)}>Remove option</button> : <span /> }<button type="submit" disabled={saving}>{saving ? 'Saving…' : selectedId === 'new' ? 'Create option' : 'Save option'}</button></div></form>
        {selectedId !== 'new' ? <form className="programme-pricing-translation" onSubmit={(event) => { event.preventDefault(); void saveTranslation(); }}><div className="programme-locale-bar"><span>Pricing language</span>{locales.map((item) => <button type="button" key={item} aria-pressed={locale === item} onClick={() => changeLocale(item)}>{item.toUpperCase()}<small>{selected?.programme_pricing_option_translations.find((translationItem) => translationItem.language_code === item)?.translation_status ?? 'missing'}</small></button>)}</div><label><span>Translation status</span><select value={translation.translationStatus} onChange={(event) => setTranslation({ ...translation, translationStatus: event.target.value as PricingTranslation['translation_status'] })}><option value="missing">Missing</option><option value="draft">Draft</option><option value="published">Published</option></select></label><label><span>Option title</span><input value={translation.title} onChange={(event) => setTranslation({ ...translation, title: event.target.value })} /></label><label><span>Description</span><textarea rows={4} value={translation.description} onChange={(event) => setTranslation({ ...translation, description: event.target.value })} /></label><label><span>CTA label</span><input value={translation.ctaLabel} onChange={(event) => setTranslation({ ...translation, ctaLabel: event.target.value })} /></label><div className="programme-operation-actions"><span /><button type="submit" disabled={saving}>{saving ? 'Saving…' : `Save ${locale.toUpperCase()} translation`}</button></div></form> : <p className="programme-operation-note">Create the pricing record before adding localized title, description, and CTA.</p>}
      </div>
    </div>
  </section>;
}
