'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAdminUnsavedChanges } from '@/components/admin-dirty-guard';

type EntityKind = 'partner' | 'expert';
type Locale = 'en' | 'ua' | 'cz';
type RecordStatus = 'draft' | 'published' | 'archived';
type TranslationStatus = 'missing' | 'draft' | 'published';
type PartnerType = 'exclusive_academic_partner' | 'partner_organisation';

type Translation = {
  language_code: Locale;
  translation_status: TranslationStatus;
  name: string | null;
  role_label?: string | null;
  location?: string | null;
  logo_alt?: string | null;
  public_category?: string | null;
  expert_role?: string | null;
  photo_alt?: string | null;
};

type EntityRecord = {
  id: string;
  slug: string;
  status: RecordStatus;
  sort_order: number;
  partner_type?: PartnerType;
  official_url?: string;
  logo_path?: string;
  photo_path?: string | null;
  partner_translations?: Translation[];
  expert_translations?: Translation[];
};

type RecordEditor = {
  slug: string;
  status: RecordStatus;
  sortOrder: string;
  partnerType: PartnerType;
  officialUrl: string;
  assetPath: string;
};

type TranslationEditor = {
  translationStatus: TranslationStatus;
  name: string;
  roleLabel: string;
  location: string;
  logoAlt: string;
  publicCategory: string;
  expertRole: string;
  photoAlt: string;
};

const locales: Locale[] = ['en', 'ua', 'cz'];
const configs = {
  partner: { endpoint: '/api/v1/admin/partners', responseKey: 'partners', plural: 'Partners', kicker: 'Public trust network', directory: 'partners', assetLabel: 'Logo' },
  expert: { endpoint: '/api/v1/admin/experts', responseKey: 'experts', plural: 'Experts', kicker: 'Public teaching team', directory: 'experts', assetLabel: 'Photo' },
} as const;

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

function entityTranslations(record: EntityRecord, kind: EntityKind): Translation[] {
  return kind === 'partner' ? record.partner_translations ?? [] : record.expert_translations ?? [];
}

function entityTitle(record: EntityRecord, kind: EntityKind): string {
  const values = entityTranslations(record, kind);
  return values.find((item) => item.language_code === 'en')?.name ?? values.find((item) => item.name)?.name ?? record.slug;
}

function makeRecordEditor(record: EntityRecord): RecordEditor {
  return {
    slug: record.slug,
    status: record.status,
    sortOrder: String(record.sort_order),
    partnerType: record.partner_type ?? 'partner_organisation',
    officialUrl: record.official_url ?? '',
    assetPath: record.logo_path ?? record.photo_path ?? '',
  };
}

function makeTranslationEditor(record: EntityRecord, kind: EntityKind, locale: Locale): TranslationEditor {
  const item = entityTranslations(record, kind).find((translation) => translation.language_code === locale);
  return {
    translationStatus: item?.translation_status ?? 'missing',
    name: item?.name ?? '',
    roleLabel: item?.role_label ?? '',
    location: item?.location ?? '',
    logoAlt: item?.logo_alt ?? '',
    publicCategory: item?.public_category ?? '',
    expertRole: item?.expert_role ?? '',
    photoAlt: item?.photo_alt ?? '',
  };
}

export function AdminPartnershipEntities({ kind }: { kind: EntityKind }) {
  const config = configs[kind];
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [recordEditor, setRecordEditor] = useState<RecordEditor | null>(null);
  const [translationEditor, setTranslationEditor] = useState<TranslationEditor | null>(null);
  const [locale, setLocale] = useState<Locale>('en');
  const [tab, setTab] = useState<'record' | 'content' | 'media'>('record');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'error' | 'success'>('error');

  const accessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error(`Sign in to manage ${config.plural.toLowerCase()}.`);
    return data.session.access_token;
  }, [config.plural, supabase]);

  const choose = useCallback((all: EntityRecord[], preferredId: string | null, activeLocale: Locale) => {
    const record = all.find((item) => item.id === preferredId) ?? all[0] ?? null;
    selectedRef.current = record?.id ?? null;
    setSelectedId(record?.id ?? null);
    setRecordEditor(record ? makeRecordEditor(record) : null);
    setTranslationEditor(record ? makeTranslationEditor(record, kind, activeLocale) : null);
    setCreating(false);
  }, [kind]);

  const load = useCallback(async (preferredId?: string | null) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(config.endpoint, { headers: { Authorization: `Bearer ${await accessToken()}` }, cache: 'no-store' });
      const payload = await response.json().catch(() => null) as Record<string, EntityRecord[]> | null;
      const items = payload?.[config.responseKey];
      if (!response.ok || !items) throw new Error(apiMessage(payload, `${config.plural} could not be loaded.`));
      setRecords(items);
      choose(items, preferredId ?? selectedRef.current, locale);
    } catch (error) {
      setMessageKind('error');
      setMessage(error instanceof Error ? error.message : `${config.plural} could not be loaded.`);
    } finally { setLoading(false); }
  }, [accessToken, choose, config, locale]);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  const selected = records.find((item) => item.id === selectedId) ?? null;
  const recordDirty = Boolean(creating || (recordEditor && selected && JSON.stringify(recordEditor) !== JSON.stringify(makeRecordEditor(selected))));
  const translationDirty = Boolean(translationEditor && selected && JSON.stringify(translationEditor) !== JSON.stringify(makeTranslationEditor(selected, kind, locale)));
  const { confirmDiscardChanges } = useAdminUnsavedChanges(recordDirty || translationDirty, `${kind === 'partner' ? 'Partner' : 'Expert'} draft`);
  const visible = records.filter((item) => `${entityTitle(item, kind)} ${item.slug}`.toLowerCase().includes(query.trim().toLowerCase()));

  function selectRecord(record: EntityRecord) {
    if (!confirmDiscardChanges()) return;
    selectedRef.current = record.id; setSelectedId(record.id); setRecordEditor(makeRecordEditor(record));
    setTranslationEditor(makeTranslationEditor(record, kind, locale)); setCreating(false); setMessage('');
  }

  function beginCreate() {
    if (!confirmDiscardChanges()) return;
    const order = records.reduce((maximum, item) => Math.max(maximum, item.sort_order), 0) + 10;
    selectedRef.current = null; setSelectedId(null); setCreating(true); setTab('record'); setMessage('');
    setRecordEditor({ slug: '', status: 'draft', sortOrder: String(order), partnerType: 'partner_organisation', officialUrl: '', assetPath: '' });
    setTranslationEditor(null);
  }

  function changeLocale(next: Locale) {
    if (next !== locale && translationDirty && !confirmDiscardChanges()) return;
    setLocale(next);
    if (selected) setTranslationEditor(makeTranslationEditor(selected, kind, next));
  }

  function validateRecord(editor: RecordEditor) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(editor.slug)) throw new Error('Slug must use lowercase letters, numbers, and hyphens.');
    if (!Number.isInteger(Number(editor.sortOrder)) || Number(editor.sortOrder) < 0) throw new Error('Sort order must be a non-negative integer.');
    const assetPattern = new RegExp(`^/${config.directory}/[a-z0-9-]+\\.webp$`);
    if ((kind === 'partner' || editor.assetPath) && !assetPattern.test(editor.assetPath)) throw new Error(`${config.assetLabel} path must use /${config.directory}/file-name.webp.`);
    if (kind === 'partner' && !editor.officialUrl.startsWith('https://')) throw new Error('Official URL must start with https://.');
    if (kind === 'partner' && editor.partnerType === 'exclusive_academic_partner' && editor.slug !== 'alfred-nobel-university') throw new Error('Only Alfred Nobel University may be the exclusive academic partner.');
    if (editor.status === 'published' && creating) throw new Error(`Create the ${kind} as a draft, then publish its English content.`);
    if (editor.status === 'published' && selected && entityTranslations(selected, kind).find((item) => item.language_code === 'en')?.translation_status !== 'published') throw new Error(`Publish the English content before publishing this ${kind}.`);
  }

  function recordPayload(editor: RecordEditor, mediaOnly = false) {
    if (mediaOnly) return kind === 'partner' ? { logoPath: editor.assetPath } : { photoPath: editor.assetPath };
    return kind === 'partner'
      ? { slug: editor.slug, status: editor.status, sortOrder: Number(editor.sortOrder), partnerType: editor.partnerType, officialUrl: editor.officialUrl, logoPath: editor.assetPath }
      : { slug: editor.slug, status: editor.status, sortOrder: Number(editor.sortOrder), photoPath: editor.assetPath };
  }

  async function saveRecord(mediaOnly = false) {
    if (!recordEditor) return;
    validateRecord(recordEditor);
    const response = await fetch(creating ? config.endpoint : `${config.endpoint}/${selectedId}`, {
      method: creating ? 'POST' : 'PATCH',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(creating ? recordPayload(recordEditor) : { record: recordPayload(recordEditor, mediaOnly) }),
    });
    const payload = await response.json().catch(() => null) as Record<string, EntityRecord> | null;
    const saved = payload?.[kind];
    if (!response.ok || !saved) throw new Error(apiMessage(payload, `${config.plural.slice(0, -1)} could not be saved.`));
    await load(saved.id);
    setMessageKind('success'); setMessage(creating ? `${kind[0].toUpperCase()}${kind.slice(1)} created as a draft.` : mediaOnly ? `${config.assetLabel} path saved.` : 'Record settings saved.');
  }

  async function saveTranslation() {
    if (!selectedId || !translationEditor) return;
    const translation = kind === 'partner'
      ? { languageCode: locale, translationStatus: translationEditor.translationStatus, name: translationEditor.name, roleLabel: translationEditor.roleLabel, location: translationEditor.location, logoAlt: translationEditor.logoAlt }
      : { languageCode: locale, translationStatus: translationEditor.translationStatus, name: translationEditor.name, publicCategory: translationEditor.publicCategory, expertRole: translationEditor.expertRole, photoAlt: translationEditor.photoAlt };
    const response = await fetch(`${config.endpoint}/${selectedId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ translation }) });
    const payload = await response.json().catch(() => null) as Record<string, EntityRecord> | null;
    const saved = payload?.[kind];
    if (!response.ok || !saved) throw new Error(apiMessage(payload, 'Translation could not be saved.'));
    setRecords((current) => current.map((item) => item.id === saved.id ? saved : item));
    setTranslationEditor(makeTranslationEditor(saved, kind, locale));
    setMessageKind('success'); setMessage(`${locale.toUpperCase()} public copy saved.`);
  }

  async function submit(action: 'record' | 'translation' | 'media') {
    setSaving(true); setMessage('');
    try { if (action === 'translation') await saveTranslation(); else await saveRecord(action === 'media'); }
    catch (error) { setMessageKind('error'); setMessage(error instanceof Error ? error.message : 'The change could not be saved.'); }
    finally { setSaving(false); }
  }

  return <main className="programme-admin-shell partnership-admin-shell">
    <header className="admin-module-header"><div><p className="admin-kicker">{config.kicker}</p><h1>{config.plural}</h1><p>Manage public cards, localized copy, approved destinations, and publication order.</p></div></header>
    <section className="programme-admin-toolbar" aria-label={`${config.plural} controls`}><label><span>Search {config.plural.toLowerCase()}</span><input type="search" placeholder="Name or slug" value={query} onChange={(event) => setQuery(event.target.value)} /></label><span>{records.length} records</span><button type="button" onClick={beginCreate}>New {kind}</button></section>
    {message ? <p className={`programme-admin-message ${messageKind}`} role="status">{message}</p> : null}
    <section className="programme-admin-layout"><aside className="programme-admin-list" aria-label={config.plural}>{loading ? Array.from({ length: 3 }, (_, index) => <div className="programme-admin-skeleton" key={index} />) : null}{!loading && visible.length === 0 ? <div className="programme-admin-empty"><strong>No records found</strong><span>Change the search or create a new {kind}.</span></div> : null}{visible.map((record) => <button type="button" key={record.id} aria-pressed={record.id === selectedId} onClick={() => selectRecord(record)}><span><strong>{entityTitle(record, kind)}</strong><small>{record.slug}</small></span><span className={`programme-status ${record.status}`}>{record.status}</span><small>{locales.map((item) => `${item.toUpperCase()} ${entityTranslations(record, kind).find((translation) => translation.language_code === item)?.translation_status ?? 'missing'}`).join(' · ')}</small></button>)}</aside>
      {recordEditor ? <section className="programme-admin-editor"><div className="programme-editor-heading"><div><p>{creating ? 'New record' : recordEditor.slug}</p><h2>{creating ? `Create ${kind}` : entityTitle(selected as EntityRecord, kind)}</h2></div>{!creating ? <span className={`programme-status ${recordEditor.status}`}>{recordEditor.status}</span> : null}</div><nav className="programme-editor-tabs" aria-label={`${kind} editor sections`}>{(['record', 'content', 'media'] as const).map((item) => <button type="button" key={item} disabled={creating && item !== 'record'} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item === 'record' ? 'Record' : item === 'content' ? 'Public copy' : 'Media'}</button>)}</nav>
        {tab === 'content' && !creating ? <div className="programme-locale-bar"><span>Website language</span>{locales.map((item) => <button type="button" key={item} aria-pressed={locale === item} onClick={() => changeLocale(item)}>{item.toUpperCase()}<small>{selected ? entityTranslations(selected, kind).find((translation) => translation.language_code === item)?.translation_status ?? 'missing' : 'missing'}</small></button>)}</div> : null}
        {tab === 'record' ? <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void submit('record'); }}><div className="programme-form-grid"><label><span>Slug</span><input value={recordEditor.slug} onChange={(event) => setRecordEditor({ ...recordEditor, slug: event.target.value })} /></label><label><span>Status</span><select value={recordEditor.status} onChange={(event) => setRecordEditor({ ...recordEditor, status: event.target.value as RecordStatus })}><option value="draft">Draft</option><option value="published" disabled={creating}>Published</option><option value="archived">Archived</option></select></label><label><span>Sort order</span><input type="number" min="0" step="1" value={recordEditor.sortOrder} onChange={(event) => setRecordEditor({ ...recordEditor, sortOrder: event.target.value })} /></label>{kind === 'partner' ? <><label><span>Partner classification</span><select value={recordEditor.partnerType} onChange={(event) => setRecordEditor({ ...recordEditor, partnerType: event.target.value as PartnerType })}><option value="partner_organisation">Partner organisation</option><option value="exclusive_academic_partner">Exclusive academic partner</option></select></label><label className="programme-span-two"><span>Official HTTPS URL</span><input type="url" placeholder="https://" value={recordEditor.officialUrl} onChange={(event) => setRecordEditor({ ...recordEditor, officialUrl: event.target.value })} /></label></> : null}</div>{creating ? <label><span>{config.assetLabel} path{kind === 'expert' ? ' (optional)' : ''}</span><input placeholder={`/${config.directory}/file-name.webp`} value={recordEditor.assetPath} onChange={(event) => setRecordEditor({ ...recordEditor, assetPath: event.target.value })} /></label> : null}<p className="programme-operation-note">Only Alfred Nobel University may use the exclusive academic partner classification. Archive records that should disappear publicly.</p><div className="programme-save-row"><span>English public copy must be published before the record.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : creating ? `Create ${kind}` : 'Save record'}</button></div></form> : null}
        {tab === 'content' && translationEditor ? <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void submit('translation'); }}><div className="programme-translation-status"><label><span>Translation status</span><select value={translationEditor.translationStatus} onChange={(event) => setTranslationEditor({ ...translationEditor, translationStatus: event.target.value as TranslationStatus })}><option value="missing">Missing</option><option value="draft">Draft</option><option value="published">Published</option></select></label><p>Complete every required public-card field before publishing.</p></div><div className="programme-copy-fields"><label><span>Public name</span><input value={translationEditor.name} onChange={(event) => setTranslationEditor({ ...translationEditor, name: event.target.value })} /></label>{kind === 'partner' ? <><label><span>Partnership role</span><input value={translationEditor.roleLabel} onChange={(event) => setTranslationEditor({ ...translationEditor, roleLabel: event.target.value })} /></label><label><span>Location (optional)</span><input value={translationEditor.location} onChange={(event) => setTranslationEditor({ ...translationEditor, location: event.target.value })} /></label><label><span>Logo alternative text</span><input value={translationEditor.logoAlt} onChange={(event) => setTranslationEditor({ ...translationEditor, logoAlt: event.target.value })} /></label></> : <><label><span>Public category</span><textarea rows={3} value={translationEditor.publicCategory} onChange={(event) => setTranslationEditor({ ...translationEditor, publicCategory: event.target.value })} /></label><label><span>Programme or public role</span><textarea rows={3} value={translationEditor.expertRole} onChange={(event) => setTranslationEditor({ ...translationEditor, expertRole: event.target.value })} /></label><label><span>Photo alternative text (recommended)</span><input value={translationEditor.photoAlt} onChange={(event) => setTranslationEditor({ ...translationEditor, photoAlt: event.target.value })} /></label></>}</div><div className="programme-save-row"><span>Editing {locale.toUpperCase()} independently.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : `Save ${locale.toUpperCase()} copy`}</button></div></form> : null}
        {tab === 'media' && !creating ? <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void submit('media'); }}><div className="partnership-media-editor"><div><label><span>{config.assetLabel} path{kind === 'expert' ? ' (optional)' : ''}</span><input placeholder={`/${config.directory}/file-name.webp`} value={recordEditor.assetPath} onChange={(event) => setRecordEditor({ ...recordEditor, assetPath: event.target.value })} /></label><p className="programme-operation-note">Use an approved WebP file placed in public/{config.directory}. The stored website path begins with /{config.directory}/.</p></div><div className={`partnership-media-preview ${kind}`}>{recordEditor.assetPath ? <Image src={recordEditor.assetPath} alt="Asset preview" fill sizes="(max-width: 760px) 90vw, 320px" /> : <span>{kind === 'expert' ? 'No public photo' : 'Logo path required'}</span>}</div></div><div className="programme-save-row"><span>Save public copy separately for each language.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : `Save ${config.assetLabel.toLowerCase()} path`}</button></div></form> : null}
      </section> : <div className="programme-admin-empty editor"><strong>Select a record</strong><span>Choose an item or create a new {kind}.</span></div>}
    </section>
  </main>;
}
