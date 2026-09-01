'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminEmailTemplate } from '@/lib/email-templates/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAdminUnsavedChanges } from '@/components/admin-dirty-guard';

type Draft = { subject: string; body: string };
type LoadState = 'loading' | 'ready' | 'error';
type Notice = { kind: 'success' | 'error'; text: string } | null;

const languageLabels = {
  en: { short: 'EN', name: 'English' },
  ua: { short: 'UA', name: 'Ukrainian' },
} as const;

const placeholders = [
  '{{holder_name}}',
  '{{credential_type}}',
  '{{programme_title}}',
  '{{document_number}}',
  '{{verification_url}}',
];

function message(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return fallback;
}

function updatedLabel(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AdminEmailTemplates() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [templates, setTemplates] = useState<AdminEmailTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedId, setSelectedId] = useState('');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);

  const accessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      throw new Error('Sign in with MFA to manage email templates.');
    }
    return data.session.access_token;
  }, [supabase]);

  const load = useCallback(async () => {
    setLoadState('loading');
    setNotice(null);
    try {
      const response = await fetch('/api/v1/admin/email-templates', {
        headers: { Authorization: `Bearer ${await accessToken()}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as { templates?: AdminEmailTemplate[] } | null;
      if (!response.ok || !payload?.templates) {
        throw new Error(message(payload, 'Email templates could not be loaded.'));
      }

      const nextDrafts = Object.fromEntries(
        payload.templates.map((template) => [template.id, { subject: template.subject, body: template.body }]),
      );
      setTemplates(payload.templates);
      setDrafts(nextDrafts);
      setSelectedId((current) => (
        payload.templates?.some((template) => template.id === current)
          ? current
          : payload.templates?.find((template) => template.languageCode === 'en')?.id ?? payload.templates?.[0]?.id ?? ''
      ));
      setLoadState('ready');
    } catch (error) {
      setLoadState('error');
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Email templates could not be loaded.' });
    }
  }, [accessToken]);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const selected = templates.find((template) => template.id === selectedId) ?? null;
  const draft = selected ? drafts[selected.id] : undefined;
  const dirty = Boolean(selected && draft && (
    draft.subject.trim() !== selected.subject || draft.body.trim() !== selected.body
  ));
  const hasDirtyDrafts = templates.some((template) => (
    drafts[template.id]?.subject.trim() !== template.subject
    || drafts[template.id]?.body.trim() !== template.body
  ));
  useAdminUnsavedChanges(hasDirtyDrafts, 'Email template draft');

  function setDraft(field: keyof Draft, value: string) {
    if (!selected) return;
    setDrafts((current) => ({
      ...current,
      [selected.id]: { ...current[selected.id], [field]: value },
    }));
    setNotice(null);
  }

  function resetDraft() {
    if (!selected) return;
    setDrafts((current) => ({
      ...current,
      [selected.id]: { subject: selected.subject, body: selected.body },
    }));
    setNotice(null);
  }

  async function save() {
    if (!selected || !draft || !dirty) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/v1/admin/email-templates/${selected.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${await accessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: draft.subject, body: draft.body }),
      });
      const payload = await response.json().catch(() => null) as { template?: AdminEmailTemplate } | null;
      if (!response.ok || !payload?.template) {
        throw new Error(message(payload, 'Email template could not be saved.'));
      }

      const updatedTemplate = payload.template;

      setTemplates((current) => current.map((template) => (
        template.id === updatedTemplate.id ? updatedTemplate : template
      )));
      setDrafts((current) => ({
        ...current,
        [updatedTemplate.id]: { subject: updatedTemplate.subject, body: updatedTemplate.body },
      }));
      setNotice({ kind: 'success', text: `${languageLabels[updatedTemplate.languageCode].name} template saved. Audit log updated.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Email template could not be saved.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="email-template-admin-shell">
      <header className="admin-module-header">
        <div>
          <p className="admin-kicker">Credential delivery</p>
          <h1>Email templates</h1>
          <p>Owner, Super Admin, Credential Manager. MFA required.</p>
        </div>
      </header>

      {notice ? (
        <div className={`email-template-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
          <span>{notice.text}</span>
          {loadState === 'error' ? <button type="button" onClick={() => void load()}>Retry</button> : null}
        </div>
      ) : null}

      {loadState === 'loading' ? (
        <section className="email-template-loading" aria-busy="true" aria-label="Loading email templates">
          <span /><span /><span />
        </section>
      ) : null}

      {loadState === 'ready' && selected && draft ? (
        <section className="email-template-workspace">
          <div className="email-template-language-bar" role="tablist" aria-label="Credential email language">
            <span>Template language</span>
            <div>
              {templates.map((template, index) => {
                const active = template.id === selected.id;
                const changed = drafts[template.id]?.subject.trim() !== template.subject
                  || drafts[template.id]?.body.trim() !== template.body;
                return (
                  <button
                    id={`email-template-tab-${template.languageCode}`}
                    key={template.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls="email-template-editor"
                    tabIndex={active ? 0 : -1}
                    onClick={() => { setSelectedId(template.id); setNotice(null); }}
                    onKeyDown={(event) => {
                      let targetIndex = index;
                      if (event.key === 'ArrowRight') targetIndex = (index + 1) % templates.length;
                      else if (event.key === 'ArrowLeft') targetIndex = (index - 1 + templates.length) % templates.length;
                      else if (event.key === 'Home') targetIndex = 0;
                      else if (event.key === 'End') targetIndex = templates.length - 1;
                      else return;

                      event.preventDefault();
                      const target = templates[targetIndex];
                      setSelectedId(target.id);
                      setNotice(null);
                      window.requestAnimationFrame(() => {
                        document.getElementById(`email-template-tab-${target.languageCode}`)?.focus();
                      });
                    }}
                  >
                    <strong>{languageLabels[template.languageCode].short}</strong>
                    <span>{languageLabels[template.languageCode].name}</span>
                    {changed ? <small>Unsaved</small> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <form
            id="email-template-editor"
            className="email-template-editor"
            role="tabpanel"
            aria-labelledby={`email-template-tab-${selected.languageCode}`}
            onSubmit={(event) => { event.preventDefault(); void save(); }}
          >
            <div className="email-template-editor-heading">
              <div>
                <small>{languageLabels[selected.languageCode].name}</small>
                <h2>Credential delivery</h2>
                <p>Used as the default for activation and resend. The message remains editable for each individual send.</p>
              </div>
              <dl>
                <div><dt>Last saved</dt><dd>{updatedLabel(selected.updatedAt)}</dd></div>
                <div><dt>Audit</dt><dd>Subject/body change flags only</dd></div>
              </dl>
            </div>

            <label className="email-template-subject" htmlFor={`email-template-subject-${selected.id}`}>
              <span>Email subject <small>{draft.subject.length}/180</small></span>
              <input
                id={`email-template-subject-${selected.id}`}
                value={draft.subject}
                maxLength={180}
                required
                onChange={(event) => setDraft('subject', event.target.value.replace(/[\r\n]+/g, ' '))}
              />
            </label>

            <label className="email-template-body" htmlFor={`email-template-body-${selected.id}`}>
              <span>Email body <small>{draft.body.length}/20,000</small></span>
              <textarea
                id={`email-template-body-${selected.id}`}
                value={draft.body}
                maxLength={20000}
                required
                spellCheck
                onChange={(event) => setDraft('body', event.target.value)}
              />
            </label>

            <div className="email-template-placeholders" aria-label="Available placeholders">
              <span>Available placeholders</span>
              <div>{placeholders.map((placeholder) => <code key={placeholder}>{placeholder}</code>)}</div>
            </div>

            <footer className="email-template-actions">
              <p>{dirty ? 'Unsaved changes' : 'Saved version is active for future sends'}</p>
              <div>
                <button type="button" disabled={!dirty || saving} onClick={resetDraft}>Reset changes</button>
                <button className="primary" type="submit" disabled={!dirty || saving}>
                  {saving ? 'Saving…' : 'Save template'}
                </button>
              </div>
            </footer>
          </form>
        </section>
      ) : null}
    </main>
  );
}
