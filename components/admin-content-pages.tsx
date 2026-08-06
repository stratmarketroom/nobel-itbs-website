'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { AdminContentPage, PageRecordStatus } from '@/lib/content/admin';
import { contentLocales, type ContentLocale, type TranslationStatus } from '@/lib/content/localization';

type EditorState = {
  pageStatus: PageRecordStatus;
  translationStatus: TranslationStatus;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  sections: string;
};

function apiMessage(payload: unknown): string | null {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return null;
}

function editorFor(page: AdminContentPage, locale: ContentLocale): EditorState {
  const translation = page.content_page_translations.find((item) => item.language_code === locale);
  return {
    pageStatus: page.status,
    translationStatus: translation?.translation_status ?? 'missing',
    seoTitle: translation?.seo_title ?? '',
    seoDescription: translation?.seo_description ?? '',
    h1: translation?.h1 ?? '',
    sections: JSON.stringify(translation?.sections ?? {}, null, 2),
  };
}

export function AdminContentPages() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pages, setPages] = useState<AdminContentPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locale, setLocale] = useState<ContentLocale>('en');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const token = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error('Sign in to manage content.');
    return data.session.access_token;
  }, [supabase]);

  const selectPage = useCallback((allPages: AdminContentPage[], id: string | null, selectedLocale: ContentLocale) => {
    const page = allPages.find((item) => item.id === id) ?? allPages[0] ?? null;
    setSelectedId(page?.id ?? null);
    setEditor(page ? editorFor(page, selectedLocale) : null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/admin/content-pages', {
        headers: { Authorization: `Bearer ${await token()}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as { pages?: AdminContentPage[] } | null;
      if (!response.ok || !payload?.pages) throw new Error(apiMessage(payload) ?? 'Content pages could not be loaded.');
      setPages(payload.pages);
      selectPage(payload.pages, selectedId, locale);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Content pages could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [locale, selectPage, selectedId, token]);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  function changeLocale(nextLocale: ContentLocale) {
    setLocale(nextLocale);
    const page = pages.find((item) => item.id === selectedId);
    if (page) setEditor(editorFor(page, nextLocale));
  }

  async function save() {
    if (!selectedId || !editor) return;
    setSaving(true);
    setMessage('');
    try {
      let sections: Record<string, unknown>;
      try {
        sections = JSON.parse(editor.sections) as Record<string, unknown>;
        if (!sections || typeof sections !== 'object' || Array.isArray(sections)) throw new Error();
      } catch {
        throw new Error('Sections must contain a valid JSON object.');
      }
      const response = await fetch(`/api/v1/admin/content-pages/${selectedId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageStatus: editor.pageStatus,
          languageCode: locale,
          translationStatus: editor.translationStatus,
          seoTitle: editor.seoTitle,
          seoDescription: editor.seoDescription,
          h1: editor.h1,
          sections,
        }),
      });
      const payload = await response.json().catch(() => null) as { page?: AdminContentPage } | null;
      if (!response.ok || !payload?.page) throw new Error(apiMessage(payload) ?? 'Content page could not be saved.');
      const updated = pages.map((page) => page.id === payload.page?.id ? payload.page : page);
      setPages(updated);
      setEditor(editorFor(payload.page, locale));
      setMessage('Saved. The change is recorded in the audit log.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Content page could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="contact-admin-shell">
      <header className="admin-module-header">
        <div>
          <p className="admin-kicker">Content</p>
          <h1>Content pages</h1>
          <p>Manage controlled page fields and translation publication states.</p>
        </div>
      </header>

      {message ? <p className="contact-admin-error" role="status">{message}</p> : null}
      <section className="contact-admin-layout">
        <aside className="contact-admin-list" aria-label="Content pages">
          {loading ? <p>Loading pages…</p> : pages.map((page) => (
            <button key={page.id} type="button" aria-pressed={page.id === selectedId} onClick={() => {
              setSelectedId(page.id);
              setEditor(editorFor(page, locale));
            }}>
              <strong>{page.page_key.replaceAll('_', ' ')}</strong>
              <span>{page.status}</span>
            </button>
          ))}
        </aside>

        {editor ? (
          <form className="contact-admin-detail" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <div className="contact-admin-filter">
              <label htmlFor="content-language">Language</label>
              <select id="content-language" value={locale} onChange={(event) => changeLocale(event.target.value as ContentLocale)}>
                {contentLocales.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="contact-admin-filter">
              <label htmlFor="content-page-status">Page status</label>
              <select id="content-page-status" value={editor.pageStatus} onChange={(event) => setEditor({ ...editor, pageStatus: event.target.value as PageRecordStatus })}>
                <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
            </div>
            <div className="contact-admin-filter">
              <label htmlFor="content-translation-status">Translation status</label>
              <select id="content-translation-status" value={editor.translationStatus} onChange={(event) => setEditor({ ...editor, translationStatus: event.target.value as TranslationStatus })}>
                <option value="missing">Missing</option><option value="draft">Draft</option><option value="published">Published</option>
              </select>
            </div>
            <label>SEO title<input value={editor.seoTitle} onChange={(event) => setEditor({ ...editor, seoTitle: event.target.value })} /></label>
            <label>SEO description<textarea value={editor.seoDescription} onChange={(event) => setEditor({ ...editor, seoDescription: event.target.value })} /></label>
            <label>H1<input value={editor.h1} onChange={(event) => setEditor({ ...editor, h1: event.target.value })} /></label>
            <label>Controlled sections (JSON object)<textarea rows={18} spellCheck={false} value={editor.sections} onChange={(event) => setEditor({ ...editor, sections: event.target.value })} /></label>
            <button className="button primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save translation'}</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
