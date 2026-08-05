'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { SiteSetting } from '@/lib/content/site-settings';

export function AdminSiteSettings() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [setting, setSetting] = useState<SiteSetting | null>(null);
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const token = useCallback(async () => { const { data } = await supabase.auth.getSession(); if (!data.session?.access_token) throw new Error('Sign in with MFA to manage site settings.'); return data.session.access_token; }, [supabase]);
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/admin/site-settings', { headers: { Authorization: `Bearer ${await token()}` }, cache: 'no-store' });
      const payload = await response.json() as { setting?: SiteSetting; error?: { message?: string } };
      if (!response.ok || !payload.setting) throw new Error(payload.error?.message || 'Site setting could not be loaded.');
      setSetting(payload.setting); setValue(payload.setting.value_text ?? '');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Site setting could not be loaded.'); }
  }, [token]);
  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);
  async function save() {
    setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/v1/admin/site-settings', { method: 'PATCH', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ value: value.trim() || null }) });
      const payload = await response.json() as { setting?: SiteSetting; error?: { message?: string } };
      if (!response.ok || !payload.setting) throw new Error(payload.error?.message || 'Site setting could not be saved.');
      setSetting(payload.setting); setValue(payload.setting.value_text ?? ''); setMessage('Saved and recorded in the audit log.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Site setting could not be saved.'); }
    finally { setSaving(false); }
  }
  return <main className="contact-admin-shell">
    <header className="contact-admin-header"><div><p className="admin-kicker">Nobel ITBS admin</p><h1>Site settings</h1><p>Owner/Super Admin · MFA required</p></div><nav><Link href="/admin/content-pages">Content pages</Link><Link href="/admin/users">Users</Link></nav></header>
    {message ? <p className="contact-admin-error" role="status">{message}</p> : null}
    <form className="contact-admin-detail" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <label htmlFor="for-organisations-url">For Organisations application URL</label>
      <input id="for-organisations-url" type="url" placeholder="https://..." value={value} onChange={(event) => setValue(event.target.value)} />
      <p>{setting?.description ?? 'Dedicated Leeloo URL. Leave empty to use the contact fallback.'}</p>
      <button className="button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save setting'}</button>
    </form>
  </main>;
}
