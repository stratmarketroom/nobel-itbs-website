'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { AdminContentPage, PageRecordStatus } from '@/lib/content/admin';
import { contentLocales, type ContentLocale, type TranslationStatus } from '@/lib/content/localization';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonPath = Array<string | number>;

type EditorState = {
  pageStatus: PageRecordStatus;
  translationStatus: TranslationStatus;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  sections: JsonObject;
};

const structuralKeys = new Set(['key', 'slug']);
const longTextKeys = new Set(['body', 'copy', 'content', 'description', 'intro', 'lead', 'supporting_copy', 'supporting_text']);
const stringListKeys = new Set(['items', 'paragraphs']);
const structuredListKeys = new Set(['blocks', 'cards']);

function isObject(value: JsonValue | unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function apiMessage(payload: unknown): string | null {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return null;
}

function readableKey(key: string): string {
  const labels: Record<string, string> = {
    h1: 'Hero heading in section', h2: 'Section heading', cta: 'CTA label', primary_cta: 'Primary CTA label',
    primary_cta_target: 'Primary CTA path', secondary_cta: 'Secondary CTA label', secondary_cta_target: 'Secondary CTA path',
    section_cta: 'Section CTA label', cta_target: 'CTA path', official_url: 'Official URL', input_label: 'Input label',
    input_placeholder: 'Input placeholder', submit_label: 'Submit label', link_label: 'Link label', link_target: 'Link path',
  };
  if (labels[key]) return labels[key];
  return key.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function blankStructure(value: JsonValue, key = ''): JsonValue {
  if (typeof value === 'string') return structuralKeys.has(key) ? value : '';
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  if (value === null) return '';
  if (Array.isArray(value)) return value.map((item) => blankStructure(item));
  return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, blankStructure(child, childKey)]));
}

function translationFor(page: AdminContentPage, locale: ContentLocale) {
  return page.content_page_translations.find((item) => item.language_code === locale);
}

function editorFor(page: AdminContentPage, locale: ContentLocale): EditorState {
  const translation = translationFor(page, locale);
  const english = translationFor(page, 'en');
  const stored = translation?.sections ?? {};
  const sections = Object.keys(stored).length
    ? clone(stored) as JsonObject
    : blankStructure((english?.sections ?? {}) as JsonObject) as JsonObject;
  return {
    pageStatus: page.status,
    translationStatus: translation?.translation_status ?? 'missing',
    seoTitle: translation?.seo_title ?? '',
    seoDescription: translation?.seo_description ?? '',
    h1: translation?.h1 ?? '',
    sections,
  };
}

function setAtPath(root: JsonObject, path: JsonPath, value: JsonValue): JsonObject {
  const next = clone(root);
  let cursor: JsonValue = next;
  path.slice(0, -1).forEach((part) => {
    cursor = Array.isArray(cursor) ? cursor[part as number] : (cursor as JsonObject)[part as string];
  });
  const final = path[path.length - 1];
  if (Array.isArray(cursor)) cursor[final as number] = value;
  else (cursor as JsonObject)[final as string] = value;
  return next;
}

function ControlledValue({ fieldKey, value, path, sections, onChange }: {
  fieldKey: string;
  value: JsonValue;
  path: JsonPath;
  sections: JsonObject;
  onChange: (sections: JsonObject) => void;
}) {
  if (structuralKeys.has(fieldKey)) {
    return <div className="content-structure-identifier"><span>{readableKey(fieldKey)}</span><code>{String(value)}</code></div>;
  }
  if (typeof value === 'boolean') {
    return <label className="programme-check-field"><input type="checkbox" checked={value} onChange={(event) => onChange(setAtPath(sections, path, event.target.checked))} /><span>{readableKey(fieldKey)}</span></label>;
  }
  if (typeof value === 'number') {
    return <label><span>{readableKey(fieldKey)}</span><input type="number" value={value} onChange={(event) => onChange(setAtPath(sections, path, Number(event.target.value)))} /></label>;
  }
  if (typeof value === 'string' || value === null) {
    const text = value ?? '';
    const multiline = longTextKeys.has(fieldKey) || text.length > 120;
    return <label><span>{readableKey(fieldKey)}</span>{multiline ? <textarea rows={Math.min(8, Math.max(3, Math.ceil(text.length / 90)))} value={text} onChange={(event) => onChange(setAtPath(sections, path, event.target.value))} /> : <input value={text} onChange={(event) => onChange(setAtPath(sections, path, event.target.value))} />}</label>;
  }
  if (Array.isArray(value)) {
    const isStringList = stringListKeys.has(fieldKey)
      || (!structuredListKeys.has(fieldKey) && value.length > 0 && value.every((item) => typeof item === 'string'));
    if (isStringList) {
      return <label className="content-string-list"><span>{readableKey(fieldKey)}</span><small>One item or paragraph per line</small><textarea rows={Math.min(14, Math.max(5, value.length + 1))} value={value.join('\n')} onChange={(event) => onChange(setAtPath(sections, path, event.target.value.split('\n').filter((line) => line.trim() !== '')))} /></label>;
    }
    return <fieldset className="content-repeat-group"><legend>{readableKey(fieldKey)}</legend>{value.length === 0 ? <p className="content-structured-empty">No {readableKey(fieldKey).toLowerCase()} are configured in this approved section.</p> : value.map((item, index) => isObject(item) ? <ControlledObject key={index} object={item} path={[...path, index]} sections={sections} onChange={onChange} label={`${readableKey(fieldKey).replace(/s$/, '')} ${index + 1}`} /> : null)}</fieldset>;
  }
  return <ControlledObject object={value} path={path} sections={sections} onChange={onChange} label={readableKey(fieldKey)} />;
}

function ControlledObject({ object, path, sections, onChange, label }: {
  object: JsonObject;
  path: JsonPath;
  sections: JsonObject;
  onChange: (sections: JsonObject) => void;
  label: string;
}) {
  const identifier = typeof object.key === 'string' ? readableKey(object.key) : typeof object.title === 'string' && object.title ? object.title : label;
  return <fieldset className="content-structure-group"><legend>{identifier}</legend><div className="content-controlled-grid">{Object.entries(object).map(([key, value]) => <ControlledValue key={key} fieldKey={key} value={value} path={[...path, key]} sections={sections} onChange={onChange} />)}</div></fieldset>;
}

function ControlledSections({ sections, onChange }: { sections: JsonObject; onChange: (sections: JsonObject) => void }) {
  if (Object.keys(sections).length === 0) return <div className="programme-admin-empty editor"><strong>No section structure</strong><span>This translation has no stored structure and the English template is unavailable.</span></div>;
  return <div className="content-controlled-sections">{Object.entries(sections).map(([key, value]) => <ControlledValue key={key} fieldKey={key} value={value} path={[key]} sections={sections} onChange={onChange} />)}</div>;
}

export function AdminContentPages() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pages, setPages] = useState<AdminContentPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [locale, setLocale] = useState<ContentLocale>('en');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [tab, setTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'error' | 'success'>('error');

  const token = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error('Sign in to manage content.');
    return data.session.access_token;
  }, [supabase]);

  const choose = useCallback((allPages: AdminContentPage[], id: string | null, selectedLocale: ContentLocale) => {
    const page = allPages.find((item) => item.id === id) ?? allPages[0] ?? null;
    selectedRef.current = page?.id ?? null;
    setSelectedId(page?.id ?? null);
    setEditor(page ? editorFor(page, selectedLocale) : null);
  }, []);

  const load = useCallback(async (preferredId?: string | null) => {
    setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/v1/admin/content-pages', { headers: { Authorization: `Bearer ${await token()}` }, cache: 'no-store' });
      const payload = await response.json().catch(() => null) as { pages?: AdminContentPage[] } | null;
      if (!response.ok || !payload?.pages) throw new Error(apiMessage(payload) ?? 'Content pages could not be loaded.');
      setPages(payload.pages); choose(payload.pages, preferredId ?? selectedRef.current, locale);
    } catch (error) {
      setMessageKind('error'); setMessage(error instanceof Error ? error.message : 'Content pages could not be loaded.');
    } finally { setLoading(false); }
  }, [choose, locale, token]);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  const selected = pages.find((page) => page.id === selectedId) ?? null;

  function selectPage(page: AdminContentPage) {
    selectedRef.current = page.id; setSelectedId(page.id); setEditor(editorFor(page, locale)); setMessage('');
  }

  function changeLocale(nextLocale: ContentLocale) {
    setMessage('');
    setLocale(nextLocale);
    if (selected) setEditor(editorFor(selected, nextLocale));
  }

  function changeEditor(nextEditor: EditorState) {
    setMessage('');
    setEditor(nextEditor);
  }

  async function save() {
    if (!selectedId || !editor || !selected) return;
    setSaving(true); setMessage('');
    try {
      const englishPublished = translationFor(selected, 'en')?.translation_status === 'published';
      if (editor.pageStatus === 'published' && !englishPublished && !(locale === 'en' && editor.translationStatus === 'published')) {
        throw new Error('Publish the English translation before publishing this page.');
      }
      if (editor.translationStatus === 'published' && (!editor.h1.trim() || !editor.seoTitle.trim() || !editor.seoDescription.trim() || Object.keys(editor.sections).length === 0)) {
        throw new Error('Published translations require H1, SEO fields, and controlled page sections.');
      }
      const response = await fetch(`/api/v1/admin/content-pages/${selectedId}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageStatus: editor.pageStatus, languageCode: locale, translationStatus: editor.translationStatus, seoTitle: editor.seoTitle, seoDescription: editor.seoDescription, h1: editor.h1, sections: editor.sections }),
      });
      const payload = await response.json().catch(() => null) as { page?: AdminContentPage } | null;
      if (!response.ok || !payload?.page) throw new Error(apiMessage(payload) ?? 'Content page could not be saved.');
      const updated = pages.map((page) => page.id === payload.page?.id ? payload.page : page);
      setPages(updated); setEditor(editorFor(payload.page, locale)); setMessageKind('success'); setMessage('Saved. Audit log updated.');
    } catch (error) {
      setMessageKind('error'); setMessage(error instanceof Error ? error.message : 'Content page could not be saved.');
    } finally { setSaving(false); }
  }

  return <main className="programme-admin-shell content-page-admin-shell">
    <header className="admin-module-header"><div><p className="admin-kicker">Structured content</p><h1>Content pages</h1><p>Edit approved page sections and translation publication states without changing the page structure.</p></div></header>
    {message && !editor ? <p className={`programme-admin-message ${messageKind}`} role="status">{message}</p> : null}
    <section className="programme-admin-layout"><aside className="programme-admin-list" aria-label="Content pages">{loading ? Array.from({ length: 4 }, (_, index) => <div className="programme-admin-skeleton" key={index} />) : pages.map((page) => <button key={page.id} type="button" aria-pressed={page.id === selectedId} onClick={() => selectPage(page)}><span><strong>{readableKey(page.page_key)}</strong><small>{page.page_type}</small></span><span className={`programme-status ${page.status}`}>{page.status}</span><small>{contentLocales.map((item) => `${item.toUpperCase()} ${translationFor(page, item)?.translation_status ?? 'missing'}`).join(' · ')}</small></button>)}</aside>
      {editor && selected ? <section className="programme-admin-editor"><div className="programme-editor-heading"><div><p>{selected.page_type}</p><h2>{readableKey(selected.page_key)}</h2></div><span className={`programme-status ${editor.pageStatus}`}>{editor.pageStatus}</span></div><nav className="programme-editor-tabs" aria-label="Content editor sections">{(['content', 'seo', 'settings'] as const).map((item) => <button key={item} type="button" aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item === 'content' ? 'Page sections' : item === 'seo' ? 'H1 and SEO' : 'Publication'}</button>)}</nav><div className="programme-locale-bar"><span>Website language</span>{contentLocales.map((item) => <button type="button" key={item} aria-pressed={locale === item} onClick={() => changeLocale(item)}>{item.toUpperCase()}<small>{translationFor(selected, item)?.translation_status ?? 'missing'}</small></button>)}</div>
        <form className="programme-editor-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>{tab === 'content' ? <ControlledSections sections={editor.sections} onChange={(sections) => changeEditor({ ...editor, sections })} /> : null}{tab === 'seo' ? <div className="programme-copy-fields"><label><span>Page H1</span><input value={editor.h1} onChange={(event) => changeEditor({ ...editor, h1: event.target.value })} /></label><label><span>SEO title</span><input value={editor.seoTitle} onChange={(event) => changeEditor({ ...editor, seoTitle: event.target.value })} /></label><label><span>SEO description</span><textarea rows={4} value={editor.seoDescription} onChange={(event) => changeEditor({ ...editor, seoDescription: event.target.value })} /></label></div> : null}{tab === 'settings' ? <div className="programme-form-grid"><label><span>Page status</span><select value={editor.pageStatus} onChange={(event) => changeEditor({ ...editor, pageStatus: event.target.value as PageRecordStatus })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label><span>{locale.toUpperCase()} translation status</span><select value={editor.translationStatus} onChange={(event) => changeEditor({ ...editor, translationStatus: event.target.value as TranslationStatus })}><option value="missing">Missing</option><option value="draft">Draft</option><option value="published">Published</option></select></label><p className="programme-operation-note programme-span-two">English must be published before the page. Other languages fall back to English publicly until their translation is ready.</p></div> : null}<div className="programme-save-row"><div className="programme-save-context"><span>Editing {locale.toUpperCase()}. Fixed blocks and identifiers are preserved.</span><span className={`programme-save-feedback ${message ? messageKind : ''}`} role="status" aria-live="polite">{message}</span></div><button type="submit" disabled={saving}>{saving ? 'Saving…' : message && messageKind === 'success' ? `Saved ${locale.toUpperCase()} ✓` : `Save ${locale.toUpperCase()} page`}</button></div></form>
      </section> : <div className="programme-admin-empty editor"><strong>Select a page</strong><span>Choose a controlled page from the list.</span></div>}
    </section>
  </main>;
}
