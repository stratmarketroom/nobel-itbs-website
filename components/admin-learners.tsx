'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { LearnerAdminItem, LearnerConflictReference, LearnerEmail, LearnerPhone } from '@/lib/learners/types';

type ArchiveFilter = 'active' | 'archived' | 'all';
type EditorTab = 'profile' | 'contacts' | 'credentials';
type Notice = { kind: 'success' | 'error'; message: string; conflict?: LearnerConflictReference } | null;

class RequestError extends Error {
  conflict?: LearnerConflictReference;
  constructor(message: string, conflict?: LearnerConflictReference) { super(message); this.conflict = conflict; }
}

function displayName(learner: LearnerAdminItem): string {
  return `${learner.latinFirstName} ${learner.latinLastName}`;
}

function apiError(payload: unknown, fallback: string): RequestError {
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object') {
    const error = payload.error as { message?: unknown; details?: { learner?: LearnerConflictReference } };
    return new RequestError(typeof error.message === 'string' ? error.message : fallback, error.details?.learner);
  }
  return new RequestError(fallback);
}

function contactSummary(learner: LearnerAdminItem): string {
  const email = learner.emails.find(({ isPrimary }) => isPrimary)?.email ?? learner.emails[0]?.email;
  const phone = learner.phones.find(({ isPrimary }) => isPrimary)?.phone ?? learner.phones[0]?.phone;
  return [email, phone].filter(Boolean).join(' · ') || 'No contact details';
}

export function AdminLearners() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [learners, setLearners] = useState<LearnerAdminItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<EditorTab>('profile');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const selected = learners.find(({ id }) => id === selectedId) ?? null;

  const token = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new RequestError('Sign in to manage learners.');
    return data.session.access_token;
  }, [supabase]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const accessToken = await token();
    const response = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null) as T | null;
    if (!response.ok || !payload) throw apiError(payload, 'Learner operation could not be completed.');
    return payload;
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const params = new URLSearchParams({ archived: archiveFilter });
      if (appliedSearch) params.set('query', appliedSearch);
      const payload = await request<{ learners: LearnerAdminItem[]; total: number }>(`/api/v1/admin/learners?${params}`);
      setLearners(payload.learners);
      setSelectedId((current) => current && payload.learners.some(({ id }) => id === current) ? current : null);
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Learners could not be loaded.' });
    } finally { setLoading(false); }
  }, [appliedSearch, archiveFilter, request]);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  function replaceLearner(learner: LearnerAdminItem) {
    setLearners((current) => current.some(({ id }) => id === learner.id)
      ? current.map((item) => item.id === learner.id ? learner : item)
      : [learner, ...current]);
    setSelectedId(learner.id);
    setCreating(false);
  }

  async function mutation(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>, success = 'Changes saved.') {
    setSaving(true);
    setNotice(null);
    try {
      const payload = await request<{ learner: LearnerAdminItem }>(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      replaceLearner(payload.learner);
      setNotice({ kind: 'success', message: success });
      return true;
    } catch (error) {
      const requestError = error instanceof RequestError ? error : new RequestError('Changes could not be saved.');
      setNotice({ kind: 'error', message: requestError.message, conflict: requestError.conflict });
      return false;
    } finally { setSaving(false); }
  }

  async function openConflict(reference: LearnerConflictReference) {
    setSaving(true);
    try {
      const payload = await request<{ learner: LearnerAdminItem }>(`/api/v1/admin/learners/${reference.id}`);
      replaceLearner(payload.learner);
      setTab('contacts');
      setNotice({ kind: 'success', message: `Opened ${reference.displayName}.` });
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Existing learner could not be opened.' });
    } finally { setSaving(false); }
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>, learner?: LearnerAdminItem) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      latinFirstName: String(form.get('latinFirstName') ?? ''),
      latinLastName: String(form.get('latinLastName') ?? ''),
      ukrainianFullName: String(form.get('ukrainianFullName') ?? ''),
      internalNote: String(form.get('internalNote') ?? ''),
    };
    const ok = await mutation(learner ? `/api/v1/admin/learners/${learner.id}` : '/api/v1/admin/learners', learner ? 'PATCH' : 'POST', body, learner ? 'Learner profile saved.' : 'Learner created. Add contact details next.');
    if (ok && !learner) setTab('contacts');
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>, email?: LearnerEmail) {
    event.preventDefault();
    if (!selected) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await mutation(
      `/api/v1/admin/learners/${selected.id}/emails${email ? `/${email.id}` : ''}`,
      email ? 'PATCH' : 'POST',
      { email: String(form.get('email') ?? ''), isPrimary: form.get('isPrimary') === 'on' },
      email ? 'Email updated.' : 'Email added.',
    );
    if (ok && !email) formElement.reset();
  }

  async function submitPhone(event: React.FormEvent<HTMLFormElement>, phone?: LearnerPhone) {
    event.preventDefault();
    if (!selected) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await mutation(
      `/api/v1/admin/learners/${selected.id}/phones${phone ? `/${phone.id}` : ''}`,
      phone ? 'PATCH' : 'POST',
      {
        phone: String(form.get('phone') ?? ''),
        hasTelegram: form.get('hasTelegram') === 'on',
        telegramUsername: String(form.get('telegramUsername') ?? ''),
        hasViber: form.get('hasViber') === 'on',
        hasWhatsapp: form.get('hasWhatsapp') === 'on',
        isPrimary: form.get('isPrimary') === 'on',
      },
      phone ? 'Phone updated.' : 'Phone added.',
    );
    if (ok && !phone) formElement.reset();
  }

  async function removeContact(kind: 'emails' | 'phones', id: string) {
    if (!selected || !window.confirm(`Remove this ${kind === 'emails' ? 'email' : 'phone'} from the learner?`)) return;
    await mutation(`/api/v1/admin/learners/${selected.id}/${kind}/${id}`, 'DELETE', undefined, 'Contact removed.');
  }

  async function toggleArchive(learner: LearnerAdminItem) {
    const message = learner.archivedAt ? 'Learner restored.' : 'Learner archived.';
    const ok = await mutation(
      `/api/v1/admin/learners/${learner.id}`,
      'PATCH',
      { archived: !learner.archivedAt },
      message,
    );
    if (ok && archiveFilter !== 'all') {
      await load();
      setNotice({ kind: 'success', message });
    }
  }

  return (
    <main className="learner-admin-shell">
      <header className="admin-module-header">
        <div><p className="admin-kicker">Credential registry</p><h1>Learners</h1><p>Maintain private learner identity and contact records before issuing credentials.</p></div>
      </header>

      <form className="learner-admin-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(search.trim()); }}>
        <label><span>Search learners</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or phone" /></label>
        <label><span>Status</span><select value={archiveFilter} onChange={(event) => setArchiveFilter(event.target.value as ArchiveFilter)}><option value="active">Active learners</option><option value="archived">Archived learners</option><option value="all">All learners</option></select></label>
        <button type="submit">Search</button>
        <button className="secondary" type="button" onClick={() => { setCreating(true); setSelectedId(null); setTab('profile'); setNotice(null); }}>Add learner</button>
        <span aria-live="polite">{loading ? 'Loading learners' : `${learners.length} learner${learners.length === 1 ? '' : 's'}`}</span>
      </form>

      {notice ? <div className={`learner-admin-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}><span>{notice.message}</span>{notice.conflict ? <button disabled={saving} type="button" onClick={() => void openConflict(notice.conflict!)}>Open {notice.conflict.displayName}</button> : null}</div> : null}

      <section className="learner-admin-workspace">
        <nav className="learner-admin-list" aria-label="Learner list">
          {loading ? Array.from({ length: 5 }, (_, index) => <span className="learner-list-skeleton" key={index} />) : null}
          {!loading && learners.length === 0 ? <div className="learner-empty"><strong>No learners found</strong><span>Change the search or add the first learner.</span></div> : null}
          {!loading ? learners.map((learner) => <button type="button" key={learner.id} aria-pressed={learner.id === selectedId} onClick={() => { setSelectedId(learner.id); setCreating(false); setNotice(null); }}><span><strong>{displayName(learner)}</strong><small>{learner.ukrainianFullName}</small><small>{contactSummary(learner)}</small></span><em className={learner.archivedAt ? 'archived' : 'active'}>{learner.archivedAt ? 'Archived' : 'Active'}</em></button>) : null}
        </nav>

        <section className="learner-admin-editor">
          {creating ? <ProfileForm saving={saving} onSubmit={(event) => void submitProfile(event)} /> : selected ? <>
            <header className="learner-editor-heading"><div><small>Private learner record</small><h2>{displayName(selected)}</h2></div><span className={selected.archivedAt ? 'archived' : 'active'}>{selected.archivedAt ? 'Archived' : 'Active'}</span></header>
            <nav className="learner-editor-tabs" aria-label="Learner record sections">{(['profile', 'contacts', 'credentials'] as EditorTab[]).map((item) => <button type="button" key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item === 'contacts' ? `Contacts (${selected.emails.length + selected.phones.length})` : item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
            {tab === 'profile' ? <ProfileForm learner={selected} saving={saving} onSubmit={(event) => void submitProfile(event, selected)} onArchive={() => void toggleArchive(selected)} /> : null}
            {tab === 'contacts' ? <ContactEditor learner={selected} saving={saving} onEmail={submitEmail} onPhone={submitPhone} onRemove={removeContact} /> : null}
            {tab === 'credentials' ? <section className="learner-credentials"><header><div><small>Credential registry</small><h3>{selected.credentials.length} document{selected.credentials.length === 1 ? '' : 's'}</h3></div><Link href={`/admin/credentials?learner=${selected.id}`}>Open credential workspace</Link></header>{selected.credentials.length === 0 ? <div className="learner-credential-placeholder"><span>Credential records</span><h3>No credentials yet</h3><p>Create the first pending credential from the protected credential workspace.</p></div> : <div>{selected.credentials.map((credential) => <Link key={credential.id} href={`/admin/credentials?credential=${credential.id}`}><span><strong>{credential.documentNumber}</strong><small>{credential.programmeTitle} · {credential.credentialType}</small><small>Issued {credential.issueDate}</small></span><em className={credential.status}>{credential.status}</em></Link>)}</div>}</section> : null}
          </> : <div className="learner-empty editor"><strong>Select a learner</strong><span>Choose a record to manage profile, contacts, and future credentials.</span></div>}
        </section>
      </section>
    </main>
  );
}

function ProfileForm({ learner, saving, onSubmit, onArchive }: { learner?: LearnerAdminItem; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onArchive?: () => void }) {
  return <form className="learner-profile-form" key={learner?.updatedAt ?? 'new'} onSubmit={onSubmit}><header><div><small>{learner ? 'Identity' : 'New learner'}</small><h2>{learner ? 'Profile details' : 'Create learner profile'}</h2></div>{learner && onArchive ? <button className="quiet-danger" type="button" disabled={saving} onClick={onArchive}>{learner.archivedAt ? 'Restore learner' : 'Archive learner'}</button> : null}</header><div className="learner-form-grid"><label><span>Latin first name</span><input name="latinFirstName" required defaultValue={learner?.latinFirstName} autoComplete="off" /></label><label><span>Latin last name</span><input name="latinLastName" required defaultValue={learner?.latinLastName} autoComplete="off" /></label><label className="wide"><span>Ukrainian full name</span><input name="ukrainianFullName" required defaultValue={learner?.ukrainianFullName} autoComplete="off" /></label><label className="wide"><span>Internal note <small>Private, never shown publicly</small></span><textarea name="internalNote" defaultValue={learner?.internalNote ?? ''} /></label></div><footer><span>{learner ? 'Contact details are managed in the Contacts tab.' : 'Create the profile first, then add contacts.'}</span><button disabled={saving} type="submit">{saving ? 'Saving…' : learner ? 'Save profile' : 'Create learner'}</button></footer></form>;
}

function ContactEditor({ learner, saving, onEmail, onPhone, onRemove }: { learner: LearnerAdminItem; saving: boolean; onEmail: (event: React.FormEvent<HTMLFormElement>, email?: LearnerEmail) => void; onPhone: (event: React.FormEvent<HTMLFormElement>, phone?: LearnerPhone) => void; onRemove: (kind: 'emails' | 'phones', id: string) => void }) {
  return <div className="learner-contacts"><section><header><div><small>Email addresses</small><h3>{learner.emails.length} saved</h3></div></header>{learner.emails.map((email) => <form className="learner-contact-row email" key={`${email.id}-${email.updatedAt}`} onSubmit={(event) => onEmail(event, email)}><label><span>Email</span><input name="email" type="email" required defaultValue={email.email} /></label><label className="contact-check"><input name="isPrimary" type="checkbox" defaultChecked={email.isPrimary} /><span>Primary</span></label><div><button disabled={saving} type="submit">Save</button><button className="remove" disabled={saving} type="button" onClick={() => onRemove('emails', email.id)}>Remove</button></div></form>)}<form className="learner-contact-add" onSubmit={(event) => onEmail(event)}><label><span>Add email</span><input name="email" type="email" required placeholder="learner@example.com" /></label><label className="contact-check"><input name="isPrimary" type="checkbox" defaultChecked={learner.emails.length === 0} /><span>Primary</span></label><button disabled={saving} type="submit">Add email</button></form></section>
    <section><header><div><small>Phone numbers</small><h3>{learner.phones.length} saved</h3></div></header>{learner.phones.map((phone) => <form className="learner-contact-row phone" key={`${phone.id}-${phone.updatedAt}`} onSubmit={(event) => onPhone(event, phone)}><label><span>Phone</span><input name="phone" type="tel" required defaultValue={phone.phone} /></label><label><span>Telegram username</span><input name="telegramUsername" defaultValue={phone.telegramUsername ?? ''} placeholder="username" /></label><div className="learner-messenger-flags"><label><input name="hasTelegram" type="checkbox" defaultChecked={phone.hasTelegram} /><span>Telegram</span></label><label><input name="hasViber" type="checkbox" defaultChecked={phone.hasViber} /><span>Viber</span></label><label><input name="hasWhatsapp" type="checkbox" defaultChecked={phone.hasWhatsapp} /><span>WhatsApp</span></label><label><input name="isPrimary" type="checkbox" defaultChecked={phone.isPrimary} /><span>Primary</span></label></div><div className="contact-actions"><button disabled={saving} type="submit">Save</button><button className="remove" disabled={saving} type="button" onClick={() => onRemove('phones', phone.id)}>Remove</button></div></form>)}<form className="learner-contact-add phone" onSubmit={(event) => onPhone(event)}><label><span>Add phone</span><input name="phone" type="tel" required placeholder="+420123456789" /></label><label><span>Telegram username</span><input name="telegramUsername" placeholder="username" /></label><div className="learner-messenger-flags"><label><input name="hasTelegram" type="checkbox" /><span>Telegram</span></label><label><input name="hasViber" type="checkbox" /><span>Viber</span></label><label><input name="hasWhatsapp" type="checkbox" /><span>WhatsApp</span></label><label><input name="isPrimary" type="checkbox" defaultChecked={learner.phones.length === 0} /><span>Primary</span></label></div><button disabled={saving} type="submit">Add phone</button></form></section></div>;
}
