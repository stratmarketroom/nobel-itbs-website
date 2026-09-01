'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAdminUnsavedChanges } from '@/components/admin-dirty-guard';

type TaxonomyKind = 'area' | 'type';
type Locale = 'en' | 'ua' | 'cz';
type RecordStatus = 'draft' | 'published' | 'archived';
type TranslationStatus = 'missing' | 'draft' | 'published';
type JsonValue = string | string[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };

type TaxonomyTranslation = {
  language_code: Locale;
  translation_status: TranslationStatus;
  title: string | null;
  landing_title?: string | null;
  short_description: string | null;
  intro_content: string | null;
  sections: JsonObject;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  updated_at: string;
};

type TaxonomyRecord = {
  id: string;
  slug: string;
  status: RecordStatus;
  sort_order: number;
  updated_at: string;
  programme_area_translations?: TaxonomyTranslation[];
  programme_type_translations?: TaxonomyTranslation[];
};

type RecordEditor = { slug: string; status: RecordStatus; sortOrder: string };
type TranslationEditor = {
  translationStatus: TranslationStatus;
  title: string;
  landingTitle: string;
  shortDescription: string;
  introContent: string;
  sections: JsonObject;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
};

const locales: Locale[] = ['en', 'ua', 'cz'];

const configs = {
  area: { endpoint: '/api/v1/admin/programme-areas', responseKey: 'areas', singular: 'area', plural: 'Programme areas', kicker: 'Catalogue structure' },
  type: { endpoint: '/api/v1/admin/programme-types', responseKey: 'types', singular: 'type', plural: 'Programme types', kicker: 'Learning formats' },
} as const;

const areaSections: JsonObject = {
  eyebrow: '', supporting_copy: '', primary_cta_label: '',
  about: { heading: '', content: '' }, audience: { heading: '', items: [] },
  outcomes: { heading: '', items: [] },
  listing: { heading: '', intro: '', empty_heading: '', empty_body: '' },
  closing_cta: { heading: '', copy: '', label: '' },
};

const typeSections: JsonObject = {
  primary_cta_label: '', audience: { heading: '', items: [] },
  comparison: { heading: '', intro: '', items: [] },
  listing: { heading: '', intro: '', empty_heading: '', empty_body: '', empty_cta_label: '' },
  closing_cta: { heading: '', copy: '', label: '' },
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

function translations(record: TaxonomyRecord, kind: TaxonomyKind): TaxonomyTranslation[] {
  return kind === 'area' ? record.programme_area_translations ?? [] : record.programme_type_translations ?? [];
}

function recordTitle(record: TaxonomyRecord, kind: TaxonomyKind): string {
  const all = translations(record, kind);
  return all.find((item) => item.language_code === 'en')?.title ?? all.find((item) => item.title)?.title ?? record.slug;
}

function makeRecordEditor(record: TaxonomyRecord): RecordEditor {
  return { slug: record.slug, status: record.status, sortOrder: String(record.sort_order) };
}

function makeTranslationEditor(record: TaxonomyRecord, kind: TaxonomyKind, locale: Locale): TranslationEditor {
  const item = translations(record, kind).find((translation) => translation.language_code === locale);
  return {
    translationStatus: item?.translation_status ?? 'missing', title: item?.title ?? '',
    landingTitle: item?.landing_title ?? '', shortDescription: item?.short_description ?? '',
    introContent: item?.intro_content ?? '',
    sections: clone(item?.sections && Object.keys(item.sections).length ? item.sections : kind === 'area' ? areaSections : typeSections),
    seoTitle: item?.seo_title ?? '', seoDescription: item?.seo_description ?? '',
    ogTitle: item?.og_title ?? '', ogDescription: item?.og_description ?? '',
  };
}

function nestedObject(root: JsonObject, key: string): JsonObject {
  const value = root[key]; return value && !Array.isArray(value) && typeof value === 'object' ? value : {};
}

function nestedString(root: JsonObject, key: string): string {
  const value = root[key]; return typeof value === 'string' ? value : '';
}

function nestedItems(root: JsonObject, key: string): string[] {
  const value = root[key]; return Array.isArray(value) ? value : [];
}

function updateSection(root: JsonObject, path: string[], value: string | string[]): JsonObject {
  const next = clone(root); let cursor = next;
  path.slice(0, -1).forEach((part) => { cursor[part] = nestedObject(cursor, part); cursor = cursor[part] as JsonObject; });
  cursor[path[path.length - 1]] = value; return next;
}

function TextField({ label, value, onChange, rows = 0 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label><span>{label}</span>{rows ? <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}

function SectionGroup({ title, object, base, sections, onChange, fields, listField }: { title: string; object: JsonObject; base: string; sections: JsonObject; onChange: (sections: JsonObject) => void; fields: Array<{ key: string; label: string; rows?: number }>; listField?: { key: string; label: string } }) {
  return <fieldset className="programme-section-group"><legend>{title}</legend>{fields.map((field) => <TextField key={field.key} label={field.label} rows={field.rows} value={nestedString(object, field.key)} onChange={(value) => onChange(updateSection(sections, [base, field.key], value))} />)}{listField ? <label className="programme-array-field"><span>{listField.label}</span><small>One item per line</small><textarea rows={6} value={nestedItems(object, listField.key).join('\n')} onChange={(event) => onChange(updateSection(sections, [base, listField.key], event.target.value.split('\n').filter(Boolean)))} /></label> : null}</fieldset>;
}

function TaxonomySections({ kind, sections, onChange }: { kind: TaxonomyKind; sections: JsonObject; onChange: (sections: JsonObject) => void }) {
  const audience = nestedObject(sections, 'audience'); const listing = nestedObject(sections, 'listing'); const closing = nestedObject(sections, 'closing_cta');
  return <div className="taxonomy-sections-editor">
    {kind === 'area' ? <><div className="programme-form-grid"><TextField label="Eyebrow" value={nestedString(sections, 'eyebrow')} onChange={(value) => onChange(updateSection(sections, ['eyebrow'], value))} /><TextField label="Primary CTA label" value={nestedString(sections, 'primary_cta_label')} onChange={(value) => onChange(updateSection(sections, ['primary_cta_label'], value))} /></div><TextField label="Supporting copy" rows={3} value={nestedString(sections, 'supporting_copy')} onChange={(value) => onChange(updateSection(sections, ['supporting_copy'], value))} /><SectionGroup title="About" object={nestedObject(sections, 'about')} base="about" sections={sections} onChange={onChange} fields={[{ key: 'heading', label: 'Heading' }, { key: 'content', label: 'Content', rows: 6 }]} /></> : <TextField label="Primary CTA label" value={nestedString(sections, 'primary_cta_label')} onChange={(value) => onChange(updateSection(sections, ['primary_cta_label'], value))} />}
    <SectionGroup title="Audience" object={audience} base="audience" sections={sections} onChange={onChange} fields={[{ key: 'heading', label: 'Heading' }]} listField={{ key: 'items', label: 'Audience items' }} />
    {kind === 'area' ? <SectionGroup title="Outcomes" object={nestedObject(sections, 'outcomes')} base="outcomes" sections={sections} onChange={onChange} fields={[{ key: 'heading', label: 'Heading' }]} listField={{ key: 'items', label: 'Outcome items' }} /> : <SectionGroup title="Comparison" object={nestedObject(sections, 'comparison')} base="comparison" sections={sections} onChange={onChange} fields={[{ key: 'heading', label: 'Heading' }, { key: 'intro', label: 'Introduction', rows: 3 }]} listField={{ key: 'items', label: 'Comparison items' }} />}
    <SectionGroup title="Listing" object={listing} base="listing" sections={sections} onChange={onChange} fields={[{ key: 'heading', label: 'Heading' }, { key: 'intro', label: 'Introduction', rows: 3 }, { key: 'empty_heading', label: 'Empty-state heading' }, { key: 'empty_body', label: 'Empty-state body', rows: 3 }, ...(kind === 'type' ? [{ key: 'empty_cta_label', label: 'Empty-state CTA' }] : [])]} />
    <SectionGroup title="Closing CTA" object={closing} base="closing_cta" sections={sections} onChange={onChange} fields={[{ key: 'heading', label: 'Heading' }, { key: 'copy', label: 'Copy', rows: 3 }, { key: 'label', label: 'CTA label' }]} />
  </div>;
}

export function AdminProgrammeTaxonomy({ kind }: { kind: TaxonomyKind }) {
  const config = configs[kind]; const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [records, setRecords] = useState<TaxonomyRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null); const selectedRef = useRef<string | null>(null);
  const [recordEditor, setRecordEditor] = useState<RecordEditor | null>(null);
  const [translationEditor, setTranslationEditor] = useState<TranslationEditor | null>(null);
  const [locale, setLocale] = useState<Locale>('en'); const [tab, setTab] = useState<'record' | 'copy' | 'sections' | 'seo'>('record');
  const [query, setQuery] = useState(''); const [creating, setCreating] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(''); const [messageKind, setMessageKind] = useState<'error' | 'success'>('error');

  const accessToken = useCallback(async () => { const { data, error } = await supabase.auth.getSession(); if (error || !data.session?.access_token) throw new Error(`Sign in to manage programme ${config.singular}s.`); return data.session.access_token; }, [config.singular, supabase]);
  const choose = useCallback((all: TaxonomyRecord[], id: string | null, activeLocale: Locale) => { const record = all.find((item) => item.id === id) ?? all[0] ?? null; selectedRef.current = record?.id ?? null; setSelectedId(record?.id ?? null); setRecordEditor(record ? makeRecordEditor(record) : null); setTranslationEditor(record ? makeTranslationEditor(record, kind, activeLocale) : null); setCreating(false); }, [kind]);
  const load = useCallback(async (preferredId?: string | null) => { setLoading(true); setMessage(''); try { const response = await fetch(config.endpoint, { headers: { Authorization: `Bearer ${await accessToken()}` }, cache: 'no-store' }); const payload = await response.json().catch(() => null) as Record<string, TaxonomyRecord[]> | null; const items = payload?.[config.responseKey]; if (!response.ok || !items) throw new Error(apiMessage(payload, `${config.plural} could not be loaded.`)); setRecords(items); choose(items, preferredId ?? selectedRef.current, locale); } catch (error) { setMessageKind('error'); setMessage(error instanceof Error ? error.message : `${config.plural} could not be loaded.`); } finally { setLoading(false); } }, [accessToken, choose, config, locale]);
  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  const selected = records.find((item) => item.id === selectedId) ?? null;
  const recordDirty = Boolean(creating || (recordEditor && selected && JSON.stringify(recordEditor) !== JSON.stringify(makeRecordEditor(selected))));
  const translationDirty = Boolean(translationEditor && selected && JSON.stringify(translationEditor) !== JSON.stringify(makeTranslationEditor(selected, kind, locale)));
  const { confirmDiscardChanges } = useAdminUnsavedChanges(recordDirty || translationDirty, `Programme ${config.singular} draft`);
  const visible = records.filter((item) => `${recordTitle(item, kind)} ${item.slug}`.toLowerCase().includes(query.trim().toLowerCase()));

  function selectRecord(record: TaxonomyRecord) { if (!confirmDiscardChanges()) return; selectedRef.current = record.id; setSelectedId(record.id); setRecordEditor(makeRecordEditor(record)); setTranslationEditor(makeTranslationEditor(record, kind, locale)); setCreating(false); setMessage(''); }
  function beginCreate() { if (!confirmDiscardChanges()) return; const order = records.reduce((max, item) => Math.max(max, item.sort_order), 0) + 10; selectedRef.current = null; setSelectedId(null); setCreating(true); setTab('record'); setMessage(''); setRecordEditor({ slug: '', status: 'draft', sortOrder: String(order) }); setTranslationEditor(null); }
  function changeLocale(next: Locale) { if (next !== locale && translationDirty && !confirmDiscardChanges()) return; setLocale(next); if (selected) setTranslationEditor(makeTranslationEditor(selected, kind, next)); }

  async function saveRecord() {
    if (!recordEditor) return; if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(recordEditor.slug)) throw new Error('Slug must use lowercase letters, numbers, and hyphens.');
    if (!Number.isInteger(Number(recordEditor.sortOrder)) || Number(recordEditor.sortOrder) < 0) throw new Error('Sort order must be a non-negative integer.');
    if (recordEditor.status === 'published' && creating) throw new Error(`Create the ${config.singular} as a draft, then publish its English translation.`);
    if (recordEditor.status === 'published' && selected && translations(selected, kind).find((item) => item.language_code === 'en')?.translation_status !== 'published') throw new Error(`Publish the English translation before publishing this ${config.singular}.`);
    const record = { slug: recordEditor.slug.trim(), status: recordEditor.status, sortOrder: Number(recordEditor.sortOrder) };
    const response = await fetch(creating ? config.endpoint : `${config.endpoint}/${selectedId}`, { method: creating ? 'POST' : 'PATCH', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(creating ? record : { record }) });
    const payload = await response.json().catch(() => null) as Record<string, TaxonomyRecord> | null; const saved = payload?.[config.singular];
    if (!response.ok || !saved) throw new Error(apiMessage(payload, `Programme ${config.singular} could not be saved.`)); await load(saved.id); setMessageKind('success'); setMessage(creating ? `${config.singular[0].toUpperCase()}${config.singular.slice(1)} created as a draft.` : `${config.singular[0].toUpperCase()}${config.singular.slice(1)} settings saved.`);
  }

  async function saveTranslation() {
    if (!selectedId || !translationEditor) return;
    const translation = { languageCode: locale, translationStatus: translationEditor.translationStatus, title: translationEditor.title, ...(kind === 'type' ? { landingTitle: translationEditor.landingTitle } : {}), shortDescription: translationEditor.shortDescription, introContent: translationEditor.introContent, sections: translationEditor.sections, seoTitle: translationEditor.seoTitle, seoDescription: translationEditor.seoDescription, ogTitle: translationEditor.ogTitle, ogDescription: translationEditor.ogDescription };
    const response = await fetch(`${config.endpoint}/${selectedId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ translation }) });
    const payload = await response.json().catch(() => null) as Record<string, TaxonomyRecord> | null; const saved = payload?.[config.singular];
    if (!response.ok || !saved) throw new Error(apiMessage(payload, 'Translation could not be saved.')); setRecords((current) => current.map((item) => item.id === saved.id ? saved : item)); setTranslationEditor(makeTranslationEditor(saved, kind, locale)); setMessageKind('success'); setMessage(`${locale.toUpperCase()} translation saved.`);
  }

  async function submit(action: 'record' | 'translation') { setSaving(true); setMessage(''); try { if (action === 'record') await saveRecord(); else await saveTranslation(); } catch (error) { setMessageKind('error'); setMessage(error instanceof Error ? error.message : 'The change could not be saved.'); } finally { setSaving(false); } }

  return <main className="programme-admin-shell taxonomy-admin-shell">
    <header className="admin-module-header"><div><p className="admin-kicker">{config.kicker}</p><h1>{config.plural}</h1><p>Manage shared catalogue structure, localized landing content, and publication state.</p></div></header>
    <section className="programme-admin-toolbar" aria-label={`${config.plural} controls`}><label><span>Search {config.singular}s</span><input type="search" placeholder="Title or slug" value={query} onChange={(event) => setQuery(event.target.value)} /></label><span>{records.length} records</span><button type="button" onClick={beginCreate}>New {config.singular}</button></section>
    {message ? <p className={`programme-admin-message ${messageKind}`} role="status">{message}</p> : null}
    <section className="programme-admin-layout"><aside className="programme-admin-list" aria-label={config.plural}>{loading ? Array.from({ length: 3 }, (_, index) => <div className="programme-admin-skeleton" key={index} />) : null}{!loading && visible.length === 0 ? <div className="programme-admin-empty"><strong>No records found</strong><span>Change the search or create a new {config.singular}.</span></div> : null}{visible.map((record) => <button type="button" key={record.id} aria-pressed={record.id === selectedId} onClick={() => selectRecord(record)}><span><strong>{recordTitle(record, kind)}</strong><small>{record.slug}</small></span><span className={`programme-status ${record.status}`}>{record.status}</span><small>{locales.map((item) => `${item.toUpperCase()} ${translations(record, kind).find((translation) => translation.language_code === item)?.translation_status ?? 'missing'}`).join(' · ')}</small></button>)}</aside>
      {recordEditor ? <section className="programme-admin-editor"><div className="programme-editor-heading"><div><p>{creating ? 'New record' : recordEditor.slug}</p><h2>{creating ? `Create programme ${config.singular}` : recordTitle(selected as TaxonomyRecord, kind)}</h2></div>{!creating ? <span className={`programme-status ${recordEditor.status}`}>{recordEditor.status}</span> : null}</div><nav className="programme-editor-tabs" aria-label={`${config.singular} editor sections`}>{(['record', 'copy', 'sections', 'seo'] as const).map((item) => <button type="button" key={item} disabled={creating && item !== 'record'} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item === 'record' ? 'Record' : item === 'copy' ? 'Page copy' : item === 'sections' ? 'Landing sections' : 'SEO'}</button>)}</nav>
        {tab !== 'record' && !creating ? <div className="programme-locale-bar"><span>Website language</span>{locales.map((item) => <button type="button" key={item} aria-pressed={locale === item} onClick={() => changeLocale(item)}>{item.toUpperCase()}<small>{selected ? translations(selected, kind).find((translation) => translation.language_code === item)?.translation_status ?? 'missing' : 'missing'}</small></button>)}</div> : null}
        {tab === 'record' ? <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void submit('record'); }}><div className="programme-form-grid"><label><span>Slug</span><input value={recordEditor.slug} onChange={(event) => setRecordEditor({ ...recordEditor, slug: event.target.value })} /></label><label><span>Status</span><select value={recordEditor.status} onChange={(event) => setRecordEditor({ ...recordEditor, status: event.target.value as RecordStatus })}><option value="draft">Draft</option><option value="published" disabled={creating}>Published</option><option value="archived">Archived</option></select></label><label><span>Sort order</span><input type="number" min="0" step="1" value={recordEditor.sortOrder} onChange={(event) => setRecordEditor({ ...recordEditor, sortOrder: event.target.value })} /></label></div><p className="programme-operation-note">Changing a published slug creates a permanent redirect from the previous address.</p><div className="programme-save-row"><span>Archive records that should no longer appear publicly.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : creating ? `Create ${config.singular}` : 'Save record'}</button></div></form> : null}
        {tab !== 'record' && translationEditor ? <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void submit('translation'); }}><div className="programme-translation-status"><label><span>Translation status</span><select value={translationEditor.translationStatus} onChange={(event) => setTranslationEditor({ ...translationEditor, translationStatus: event.target.value as TranslationStatus })}><option value="missing">Missing</option><option value="draft">Draft</option><option value="published">Published</option></select></label><p>Published translations require complete landing and SEO fields.</p></div>
          {tab === 'copy' ? <div className="programme-copy-fields"><TextField label={kind === 'type' ? 'Internal singular label' : 'Title'} value={translationEditor.title} onChange={(value) => setTranslationEditor({ ...translationEditor, title: value })} />{kind === 'type' ? <TextField label="Landing page title" value={translationEditor.landingTitle} onChange={(value) => setTranslationEditor({ ...translationEditor, landingTitle: value })} /> : null}<TextField label="Short description" rows={3} value={translationEditor.shortDescription} onChange={(value) => setTranslationEditor({ ...translationEditor, shortDescription: value })} /><TextField label="Introduction" rows={7} value={translationEditor.introContent} onChange={(value) => setTranslationEditor({ ...translationEditor, introContent: value })} /></div> : null}
          {tab === 'sections' ? <TaxonomySections kind={kind} sections={translationEditor.sections} onChange={(sections) => setTranslationEditor({ ...translationEditor, sections })} /> : null}
          {tab === 'seo' ? <div className="programme-copy-fields"><TextField label="SEO title" value={translationEditor.seoTitle} onChange={(value) => setTranslationEditor({ ...translationEditor, seoTitle: value })} /><TextField label="SEO description" rows={3} value={translationEditor.seoDescription} onChange={(value) => setTranslationEditor({ ...translationEditor, seoDescription: value })} /><TextField label="Open Graph title" value={translationEditor.ogTitle} onChange={(value) => setTranslationEditor({ ...translationEditor, ogTitle: value })} /><TextField label="Open Graph description" rows={3} value={translationEditor.ogDescription} onChange={(value) => setTranslationEditor({ ...translationEditor, ogDescription: value })} /></div> : null}
          <div className="programme-save-row"><span>Editing {locale.toUpperCase()} independently.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : `Save ${locale.toUpperCase()} translation`}</button></div></form> : null}
      </section> : <div className="programme-admin-empty editor"><strong>Select a record</strong><span>Choose an item or create a new {config.singular}.</span></div>}
    </section>
  </main>;
}
