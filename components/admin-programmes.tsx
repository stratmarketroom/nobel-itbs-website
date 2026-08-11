'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AdminProgrammeOperations } from '@/components/admin-programme-operations';

type Locale = 'en' | 'ua' | 'cz';
type PublicationStatus = 'draft' | 'published' | 'archived';
type TranslationStatus = 'missing' | 'draft' | 'published';
type ProgrammeFormat = 'distance' | 'blended_distance';
type ApplicationProvider = 'leeloo' | 'partner_site';
type BadgeOverride = '' | 'open' | 'ongoing' | 'coming_soon' | 'inactive';
type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type ProgrammeTranslation = {
  language_code: Locale;
  translation_status: TranslationStatus;
  title: string | null;
  summary: string | null;
  hero_copy: string | null;
  catalogue_description: string | null;
  catalogue_facts: string | null;
  catalogue_document_summary: string | null;
  sections: JsonObject;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  updated_at: string;
};

export type ProgrammeRun = {
  id: string;
  status: 'upcoming' | 'open' | 'ongoing' | 'closed';
  starts_at: string | null;
  ends_at: string | null;
  application_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PricingTranslation = {
  language_code: Locale;
  translation_status: TranslationStatus;
  title: string | null;
  description: string | null;
  cta_label: string | null;
  updated_at: string;
};

export type PricingOption = {
  id: string;
  price: number | null;
  currency_code: string | null;
  application_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  programme_pricing_option_translations: PricingTranslation[];
};

export type Programme = {
  id: string;
  area_id: string;
  type_id: string;
  slug: string;
  publication_status: PublicationStatus;
  format: ProgrammeFormat;
  application_provider: ApplicationProvider;
  application_url: string | null;
  enrolment_badge_override: Exclude<BadgeOverride, ''> | null;
  featured: boolean;
  catalogue_sort_order: number;
  instruction_language_codes: string[];
  updated_at: string;
  programme_translations: ProgrammeTranslation[];
  programme_runs: ProgrammeRun[];
  programme_pricing_options: PricingOption[];
};

type EditorTab = 'programme' | 'copy' | 'sections' | 'seo' | 'runs' | 'pricing';

type Taxonomy = {
  id: string;
  slug: string;
  status: PublicationStatus;
  programme_area_translations?: Array<{ language_code: Locale; title: string | null }>;
  programme_type_translations?: Array<{ language_code: Locale; title: string | null }>;
};

type CoreEditor = {
  slug: string;
  areaId: string;
  typeId: string;
  publicationStatus: PublicationStatus;
  format: ProgrammeFormat;
  applicationProvider: ApplicationProvider;
  applicationUrl: string;
  enrolmentBadgeOverride: BadgeOverride;
  featured: boolean;
  catalogueSortOrder: string;
  instructionLanguageCodes: string[];
};

type TranslationEditor = {
  translationStatus: TranslationStatus;
  title: string;
  summary: string;
  heroCopy: string;
  catalogueDescription: string;
  catalogueFacts: string;
  catalogueDocumentSummary: string;
  sections: JsonObject;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
};

const locales: Locale[] = ['en', 'ua', 'cz'];
const instructionLanguages = [
  { code: 'uk', label: 'Ukrainian' },
  { code: 'en', label: 'English' },
  { code: 'cs', label: 'Czech' },
];

const emptySections: JsonObject = {
  eyebrow: '', primary_cta_label: '', facts: { content: '' },
  value: { heading: '', fields: { body: '', proof_line: '' } },
  audience: { heading: '', content: '' }, outcomes: { heading: '', content: '' },
  curriculum: { heading: '', content: '' },
  learning_experience: { heading: '', fields: { body: '', platforms: '' } },
  assessment_document: { heading: '', fields: { intro: '' }, content: '' },
  faq: { items: [] }, closing_cta: { heading: '', fields: { body: '', primary_cta: '' } },
};

function cloneObject<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

function titleFor(programme: Programme): string {
  return programme.programme_translations.find((item) => item.language_code === 'en')?.title
    ?? programme.programme_translations.find((item) => item.title)?.title
    ?? programme.slug;
}

function taxonomyTitle(item: Taxonomy): string {
  const translations = item.programme_area_translations ?? item.programme_type_translations ?? [];
  return translations.find((translation) => translation.language_code === 'en')?.title
    ?? translations.find((translation) => translation.title)?.title
    ?? item.slug;
}

function coreEditor(programme: Programme): CoreEditor {
  return {
    slug: programme.slug, areaId: programme.area_id, typeId: programme.type_id,
    publicationStatus: programme.publication_status, format: programme.format,
    applicationProvider: programme.application_provider, applicationUrl: programme.application_url ?? '',
    enrolmentBadgeOverride: programme.enrolment_badge_override ?? '', featured: programme.featured,
    catalogueSortOrder: String(programme.catalogue_sort_order),
    instructionLanguageCodes: [...programme.instruction_language_codes],
  };
}

function translationEditor(programme: Programme, locale: Locale): TranslationEditor {
  const translation = programme.programme_translations.find((item) => item.language_code === locale);
  return {
    translationStatus: translation?.translation_status ?? 'missing', title: translation?.title ?? '',
    summary: translation?.summary ?? '', heroCopy: translation?.hero_copy ?? '',
    catalogueDescription: translation?.catalogue_description ?? '', catalogueFacts: translation?.catalogue_facts ?? '',
    catalogueDocumentSummary: translation?.catalogue_document_summary ?? '',
    sections: cloneObject(translation?.sections && Object.keys(translation.sections).length ? translation.sections : emptySections),
    seoTitle: translation?.seo_title ?? '', seoDescription: translation?.seo_description ?? '',
    ogTitle: translation?.og_title ?? '', ogDescription: translation?.og_description ?? '',
  };
}

function readableKey(key: string): string {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function updatePath(root: JsonObject, path: Array<string | number>, value: JsonValue): JsonObject {
  const next = cloneObject(root);
  let cursor: JsonObject | JsonValue[] = next;
  path.slice(0, -1).forEach((part) => { cursor = cursor[part as never] as JsonObject | JsonValue[]; });
  cursor[path[path.length - 1] as never] = value as never;
  return next;
}

function SectionValue({ label, value, path, onChange }: { label: string; value: JsonValue; path: Array<string | number>; onChange: (path: Array<string | number>, value: JsonValue) => void }) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string')) {
      return <label className="programme-array-field"><span>{label}</span><small>One item per line</small><textarea rows={Math.max(4, value.length + 1)} value={value.join('\n')} onChange={(event) => onChange(path, event.target.value.split('\n').filter(Boolean))} /></label>;
    }
    return (
      <fieldset className="programme-repeat-field"><legend>{label}</legend>
        {value.map((item, index) => (
          <div className="programme-repeat-item" key={`${path.join('.')}-${index}`}>
            {item && typeof item === 'object' && !Array.isArray(item) ? Object.entries(item).map(([key, nested]) => <SectionValue key={key} label={readableKey(key)} value={nested} path={[...path, index, key]} onChange={onChange} />) : null}
            <button type="button" className="programme-text-action" onClick={() => onChange(path, value.filter((_, itemIndex) => itemIndex !== index))}>Remove item</button>
          </div>
        ))}
        <button type="button" className="programme-secondary-action" onClick={() => onChange(path, [...value, { question: '', answer: '' }])}>Add item</button>
      </fieldset>
    );
  }
  if (value && typeof value === 'object') {
    return <fieldset className="programme-section-group"><legend>{label}</legend>{Object.entries(value).map(([key, nested]) => <SectionValue key={key} label={readableKey(key)} value={nested} path={[...path, key]} onChange={onChange} />)}</fieldset>;
  }
  if (typeof value === 'boolean') return <label className="programme-check-field"><input type="checkbox" checked={value} onChange={(event) => onChange(path, event.target.checked)} /><span>{label}</span></label>;
  const text = value === null ? '' : String(value);
  const multiline = text.length > 100 || text.includes('\n') || ['content', 'body', 'description', 'intro'].some((key) => label.toLowerCase().includes(key));
  return <label><span>{label}</span>{multiline ? <textarea rows={5} value={text} onChange={(event) => onChange(path, event.target.value)} /> : <input value={text} onChange={(event) => onChange(path, event.target.value)} />}</label>;
}

export function AdminProgrammes() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [areas, setAreas] = useState<Taxonomy[]>([]);
  const [types, setTypes] = useState<Taxonomy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [core, setCore] = useState<CoreEditor | null>(null);
  const [translation, setTranslation] = useState<TranslationEditor | null>(null);
  const [locale, setLocale] = useState<Locale>('en');
  const [tab, setTab] = useState<EditorTab>('programme');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'error' | 'success'>('error');

  const accessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Sign in to manage programmes.');
    return data.session.access_token;
  }, [supabase]);

  const chooseProgramme = useCallback((all: Programme[], id: string | null, activeLocale: Locale) => {
    const programme = all.find((item) => item.id === id) ?? all[0] ?? null;
    selectedIdRef.current = programme?.id ?? null; setSelectedId(programme?.id ?? null);
    setCore(programme ? coreEditor(programme) : null); setTranslation(programme ? translationEditor(programme, activeLocale) : null);
    setCreating(false);
  }, []);

  const load = useCallback(async (preferredId?: string | null) => {
    setLoading(true); setMessage('');
    try {
      const headers = { Authorization: `Bearer ${await accessToken()}` };
      const [programmeResponse, areaResponse, typeResponse] = await Promise.all([
        fetch('/api/v1/admin/programmes', { headers, cache: 'no-store' }),
        fetch('/api/v1/admin/programme-areas', { headers, cache: 'no-store' }),
        fetch('/api/v1/admin/programme-types', { headers, cache: 'no-store' }),
      ]);
      const programmePayload = await programmeResponse.json().catch(() => null) as { programmes?: Programme[] } | null;
      const areaPayload = await areaResponse.json().catch(() => null) as { areas?: Taxonomy[] } | null;
      const typePayload = await typeResponse.json().catch(() => null) as { types?: Taxonomy[] } | null;
      if (!programmeResponse.ok || !programmePayload?.programmes) throw new Error(apiMessage(programmePayload, 'Programmes could not be loaded.'));
      if (!areaResponse.ok || !areaPayload?.areas) throw new Error(apiMessage(areaPayload, 'Programme areas could not be loaded.'));
      if (!typeResponse.ok || !typePayload?.types) throw new Error(apiMessage(typePayload, 'Programme types could not be loaded.'));
      setProgrammes(programmePayload.programmes); setAreas(areaPayload.areas); setTypes(typePayload.types);
      chooseProgramme(programmePayload.programmes, preferredId ?? selectedIdRef.current, locale);
    } catch (error) { setMessageKind('error'); setMessage(error instanceof Error ? error.message : 'Programmes could not be loaded.'); }
    finally { setLoading(false); }
  }, [accessToken, chooseProgramme, locale]);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  const selected = programmes.find((item) => item.id === selectedId) ?? null;
  const visibleProgrammes = programmes.filter((item) => `${titleFor(item)} ${item.slug}`.toLowerCase().includes(query.trim().toLowerCase()));

  function selectProgramme(programme: Programme) {
    selectedIdRef.current = programme.id; setSelectedId(programme.id); setCore(coreEditor(programme));
    setTranslation(translationEditor(programme, locale)); setCreating(false); setMessage('');
  }

  function changeLocale(next: Locale) {
    setLocale(next); if (selected) setTranslation(translationEditor(selected, next));
  }

  function beginCreate() {
    const order = programmes.reduce((highest, item) => Math.max(highest, item.catalogue_sort_order), 0) + 10;
    selectedIdRef.current = null; setSelectedId(null); setCreating(true); setTab('programme'); setMessage('');
    setCore({ slug: '', areaId: areas[0]?.id ?? '', typeId: types[0]?.id ?? '', publicationStatus: 'draft', format: 'distance', applicationProvider: 'leeloo', applicationUrl: '', enrolmentBadgeOverride: '', featured: false, catalogueSortOrder: String(order), instructionLanguageCodes: ['uk'] });
    setTranslation(null);
  }

  function toggleInstructionLanguage(code: string) {
    if (!core) return;
    const next = core.instructionLanguageCodes.includes(code) ? core.instructionLanguageCodes.filter((item) => item !== code) : [...core.instructionLanguageCodes, code];
    setCore({ ...core, instructionLanguageCodes: next });
  }

  function validateCore(): CoreEditor {
    if (!core) throw new Error('Programme form is not ready.');
    if (!core.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(core.slug)) throw new Error('Slug must use lowercase letters, numbers, and hyphens.');
    if (!core.areaId || !core.typeId) throw new Error('Choose a programme area and type.');
    if (!Number.isInteger(Number(core.catalogueSortOrder)) || Number(core.catalogueSortOrder) < 0) throw new Error('Catalogue order must be a non-negative integer.');
    if (core.instructionLanguageCodes.length === 0) throw new Error('Select at least one instruction language.');
    if (core.applicationUrl && !core.applicationUrl.startsWith('https://')) throw new Error('Application URL must start with https://.');
    if (core.publicationStatus === 'published' && creating) throw new Error('Create the programme as a draft, then complete and publish its English translation.');
    if (core.publicationStatus === 'published' && selected?.programme_translations.find((item) => item.language_code === 'en')?.translation_status !== 'published') {
      throw new Error('Publish the English translation before publishing the programme.');
    }
    return core;
  }

  function corePayload(editor: CoreEditor) {
    return { slug: editor.slug.trim(), areaId: editor.areaId, typeId: editor.typeId, publicationStatus: editor.publicationStatus, format: editor.format, applicationProvider: editor.applicationProvider, applicationUrl: editor.applicationUrl.trim() || null, enrolmentBadgeOverride: editor.enrolmentBadgeOverride || null, featured: editor.featured, catalogueSortOrder: Number(editor.catalogueSortOrder), instructionLanguageCodes: editor.instructionLanguageCodes };
  }

  async function saveCore() {
    const editor = validateCore(); const token = await accessToken();
    const response = await fetch(creating ? '/api/v1/admin/programmes' : `/api/v1/admin/programmes/${selectedId}`, {
      method: creating ? 'POST' : 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(creating ? corePayload(editor) : { record: corePayload(editor) }),
    });
    const payload = await response.json().catch(() => null) as { programme?: Programme } | null;
    if (!response.ok || !payload?.programme) throw new Error(apiMessage(payload, 'Programme could not be saved.'));
    await load(payload.programme.id); setMessageKind('success'); setMessage(creating ? 'Programme created as a draft. Add and review each translation before publishing.' : 'Programme settings saved.');
  }

  async function saveTranslation() {
    if (!selectedId || !translation) throw new Error('Choose a programme before editing translations.');
    const response = await fetch(`/api/v1/admin/programmes/${selectedId}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ translation: { languageCode: locale, ...translation } }),
    });
    const payload = await response.json().catch(() => null) as { programme?: Programme } | null;
    if (!response.ok || !payload?.programme) throw new Error(apiMessage(payload, 'Translation could not be saved.'));
    setProgrammes((current) => current.map((item) => item.id === payload.programme?.id ? payload.programme : item));
    setTranslation(translationEditor(payload.programme, locale)); setMessageKind('success'); setMessage(`${locale.toUpperCase()} translation saved.`);
  }

  async function submit(action: 'core' | 'translation') {
    setSaving(true); setMessage('');
    try { if (action === 'core') await saveCore(); else await saveTranslation(); }
    catch (error) { setMessageKind('error'); setMessage(error instanceof Error ? error.message : 'The change could not be saved.'); }
    finally { setSaving(false); }
  }

  return (
    <main className="programme-admin-shell">
      <header className="admin-module-header"><div><p className="admin-kicker">Catalogue operations</p><h1>Programmes</h1><p>Manage programme identity, publication, localized sales copy, and catalogue presentation.</p></div></header>
      <section className="programme-admin-toolbar" aria-label="Programme controls">
        <label><span>Search programmes</span><input type="search" placeholder="Title or slug" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <span>{programmes.length} programmes</span><button type="button" disabled={loading} onClick={beginCreate}>{loading ? 'Loading programmes…' : 'New programme'}</button>
      </section>
      {message ? <p className={`programme-admin-message ${messageKind}`} role="status">{message}</p> : null}
      <section className="programme-admin-layout">
        <aside className="programme-admin-list" aria-label="Programme list">
          {loading ? Array.from({ length: 5 }, (_, index) => <div className="programme-admin-skeleton" key={index} />) : null}
          {!loading && visibleProgrammes.length === 0 ? <div className="programme-admin-empty"><strong>No programmes found</strong><span>Change the search or create a new programme.</span></div> : null}
          {visibleProgrammes.map((programme) => <button type="button" key={programme.id} aria-pressed={programme.id === selectedId} onClick={() => selectProgramme(programme)}><span><strong>{titleFor(programme)}</strong><small>{programme.slug}</small></span><span className={`programme-status ${programme.publication_status}`}>{programme.publication_status}</span><small>{locales.map((item) => `${item.toUpperCase()} ${programme.programme_translations.find((translationItem) => translationItem.language_code === item)?.translation_status ?? 'missing'}`).join(' · ')}</small></button>)}
        </aside>
        {core ? <section className="programme-admin-editor" aria-label={creating ? 'Create programme' : `Edit ${selected ? titleFor(selected) : 'programme'}`}>
          <div className="programme-editor-heading"><div><p>{creating ? 'New record' : core.slug}</p><h2>{creating ? 'Create programme' : titleFor(selected as Programme)}</h2></div>{!creating ? <span className={`programme-status ${core.publicationStatus}`}>{core.publicationStatus}</span> : null}</div>
          <nav className="programme-editor-tabs" aria-label="Programme editor sections">
            {(['programme', 'copy', 'sections', 'seo', 'runs', 'pricing'] as const).map((item) => <button type="button" key={item} aria-current={tab === item ? 'page' : undefined} disabled={creating && item !== 'programme'} onClick={() => setTab(item)}>{item === 'programme' ? 'Programme' : item === 'copy' ? 'Page copy' : item === 'sections' ? 'Sales sections' : item === 'seo' ? 'SEO' : item === 'runs' ? 'Runs' : 'Pricing'}</button>)}
          </nav>
          {(['copy', 'sections', 'seo'] as EditorTab[]).includes(tab) && !creating ? <div className="programme-locale-bar"><span>Website language</span>{locales.map((item) => <button type="button" key={item} aria-pressed={locale === item} onClick={() => changeLocale(item)}>{item.toUpperCase()}<small>{selected?.programme_translations.find((translationItem) => translationItem.language_code === item)?.translation_status ?? 'missing'}</small></button>)}</div> : null}
          {tab === 'programme' ? <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void submit('core'); }}>
            <div className="programme-form-grid"><label><span>Slug</span><input value={core.slug} onChange={(event) => setCore({ ...core, slug: event.target.value })} /></label><label><span>Publication status</span><select value={core.publicationStatus} onChange={(event) => setCore({ ...core, publicationStatus: event.target.value as PublicationStatus })}><option value="draft">Draft</option><option value="published" disabled={creating}>Published</option><option value="archived">Archived</option></select></label><label><span>Programme area</span><select value={core.areaId} onChange={(event) => setCore({ ...core, areaId: event.target.value })}>{areas.map((item) => <option key={item.id} value={item.id}>{taxonomyTitle(item)}</option>)}</select></label><label><span>Programme type</span><select value={core.typeId} onChange={(event) => setCore({ ...core, typeId: event.target.value })}>{types.map((item) => <option key={item.id} value={item.id}>{taxonomyTitle(item)}</option>)}</select></label><label><span>Learning format</span><select value={core.format} onChange={(event) => setCore({ ...core, format: event.target.value as ProgrammeFormat })}><option value="distance">Distance</option><option value="blended_distance">Blended distance</option></select></label><label><span>Catalogue order</span><input type="number" min="0" step="1" value={core.catalogueSortOrder} onChange={(event) => setCore({ ...core, catalogueSortOrder: event.target.value })} /></label></div>
            <fieldset className="programme-language-options"><legend>Instruction languages</legend>{instructionLanguages.map((item) => <label key={item.code}><input type="checkbox" checked={core.instructionLanguageCodes.includes(item.code)} onChange={() => toggleInstructionLanguage(item.code)} /><span>{item.label}</span></label>)}</fieldset>
            <div className="programme-form-grid"><label><span>Application provider</span><select value={core.applicationProvider} onChange={(event) => setCore({ ...core, applicationProvider: event.target.value as ApplicationProvider })}><option value="leeloo">Leeloo</option><option value="partner_site">Partner website</option></select></label><label><span>Application URL</span><input type="url" placeholder="https://" value={core.applicationUrl} onChange={(event) => setCore({ ...core, applicationUrl: event.target.value })} /></label><label><span>Badge correction</span><select value={core.enrolmentBadgeOverride} onChange={(event) => setCore({ ...core, enrolmentBadgeOverride: event.target.value as BadgeOverride })}><option value="">Automatic from runs</option><option value="open">Open</option><option value="ongoing">Ongoing</option><option value="coming_soon">Coming soon</option><option value="inactive">Inactive</option></select></label><label className="programme-check-field"><input type="checkbox" checked={core.featured} onChange={(event) => setCore({ ...core, featured: event.target.checked })} /><span>Featured in public presentation</span></label></div>
            <div className="programme-save-row"><span>{creating ? 'The programme starts as a controlled catalogue record.' : `${selected?.programme_runs.length ?? 0} runs · ${selected?.programme_pricing_options.length ?? 0} pricing options`}</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : creating ? 'Create programme' : 'Save programme'}</button></div>
          </form> : null}
          {(['copy', 'sections', 'seo'] as EditorTab[]).includes(tab) && translation ? <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void submit('translation'); }}>
            <div className="programme-translation-status"><label><span>Translation status</span><select value={translation.translationStatus} onChange={(event) => setTranslation({ ...translation, translationStatus: event.target.value as TranslationStatus })}><option value="missing">Missing</option><option value="draft">Draft</option><option value="published">Published</option></select></label><p>Publishing is accepted only when all required fields for this language are complete.</p></div>
            {tab === 'copy' ? <div className="programme-copy-fields"><label><span>Title</span><input value={translation.title} onChange={(event) => setTranslation({ ...translation, title: event.target.value })} /></label><label><span>Summary</span><textarea rows={3} value={translation.summary} onChange={(event) => setTranslation({ ...translation, summary: event.target.value })} /></label><label><span>Hero copy</span><textarea rows={5} value={translation.heroCopy} onChange={(event) => setTranslation({ ...translation, heroCopy: event.target.value })} /></label><label><span>Catalogue description</span><textarea rows={3} value={translation.catalogueDescription} onChange={(event) => setTranslation({ ...translation, catalogueDescription: event.target.value })} /></label><label><span>Catalogue facts</span><textarea rows={3} value={translation.catalogueFacts} onChange={(event) => setTranslation({ ...translation, catalogueFacts: event.target.value })} /></label><label><span>Catalogue document summary</span><textarea rows={3} value={translation.catalogueDocumentSummary} onChange={(event) => setTranslation({ ...translation, catalogueDocumentSummary: event.target.value })} /></label></div> : null}
            {tab === 'sections' ? <div className="programme-sections-editor">{Object.entries(translation.sections).map(([key, value]) => <SectionValue key={key} label={readableKey(key)} value={value} path={[key]} onChange={(path, value) => setTranslation({ ...translation, sections: updatePath(translation.sections, path, value) })} />)}<div className="programme-optional-sections"><span>Optional sections</span>{!translation.sections.expert ? <button type="button" onClick={() => setTranslation({ ...translation, sections: { ...translation.sections, expert: { heading: '', fields: { name: '', bio: '', asset_status: '' } } } })}>Add expert</button> : null}{!translation.sections.final_project ? <button type="button" onClick={() => setTranslation({ ...translation, sections: { ...translation.sections, final_project: { heading: '', fields: { body: '' } } } })}>Add final project</button> : null}</div></div> : null}
            {tab === 'seo' ? <div className="programme-copy-fields"><label><span>SEO title</span><input value={translation.seoTitle} onChange={(event) => setTranslation({ ...translation, seoTitle: event.target.value })} /></label><label><span>SEO description</span><textarea rows={3} value={translation.seoDescription} onChange={(event) => setTranslation({ ...translation, seoDescription: event.target.value })} /></label><label><span>Open Graph title</span><input value={translation.ogTitle} onChange={(event) => setTranslation({ ...translation, ogTitle: event.target.value })} /></label><label><span>Open Graph description</span><textarea rows={3} value={translation.ogDescription} onChange={(event) => setTranslation({ ...translation, ogDescription: event.target.value })} /></label></div> : null}
            <div className="programme-save-row"><span>Editing {locale.toUpperCase()} independently from other languages.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : `Save ${locale.toUpperCase()} translation`}</button></div>
          </form> : null}
          {(tab === 'runs' || tab === 'pricing') && selected ? <AdminProgrammeOperations key={`${selected.id}-${tab}`} mode={tab} programme={selected} accessToken={accessToken} onRefresh={() => load(selected.id)} /> : null}
        </section> : <div className="programme-admin-empty editor"><strong>Select a programme</strong><span>Choose a record from the list or create a new programme.</span></div>}
      </section>
    </main>
  );
}
