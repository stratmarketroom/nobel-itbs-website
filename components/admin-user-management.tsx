'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { adminRoles, type AdminRole, type AdminUserSummary } from '@/lib/admin/types';

type AdminMe = {
  user: { id: string; email: string | null };
  profile: { full_name: string | null; is_owner: boolean; mfa_required: boolean };
  roles: AdminRole[];
  mfa: { required: boolean; aal: string | null; satisfied: boolean };
};

type EditState = {
  fullName: string;
  isActive: boolean;
  mfaRequired: boolean;
  roles: AdminRole[];
};

type CreateState = {
  email: string;
  fullName: string;
  temporaryPassword: string;
  roles: AdminRole[];
};

const roleLabels: Record<AdminRole, string> = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  content_manager: 'Content Manager',
  credential_manager: 'Credential Manager',
};

const roleDescriptions: Record<AdminRole, string> = {
  owner: 'Unique account with full system control.',
  super_admin: 'Broad administration, excluding Owner-only actions.',
  content_manager: 'Public content and programme management.',
  credential_manager: 'Learners, credentials, and contact submissions.',
};

function apiError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

function editState(user: AdminUserSummary): EditState {
  return {
    fullName: user.fullName ?? '',
    isActive: user.isActive,
    mfaRequired: user.mfaRequired,
    roles: [...user.roles],
  };
}

function readableDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value));
}

function sameRoles(left: AdminRole[], right: AdminRole[]): boolean {
  return left.length === right.length && left.every((role) => right.includes(role));
}

export function AdminUserManagement() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [editor, setEditor] = useState<EditState | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateState>({ email: '', fullName: '', temporaryPassword: '', roles: ['content_manager'] });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'error' | 'success'>('error');

  const accessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Sign in with MFA to manage users.');
    return data.session.access_token;
  }, [supabase]);

  const selectUser = useCallback((allUsers: AdminUserSummary[], id: string | null) => {
    const user = allUsers.find((candidate) => candidate.id === id) ?? allUsers[0] ?? null;
    selectedIdRef.current = user?.id ?? null;
    setSelectedId(user?.id ?? null);
    setEditor(user ? editState(user) : null);
    setCreating(false);
  }, []);

  const load = useCallback(async (preferredId?: string | null) => {
    setLoading(true);
    setMessage('');
    try {
      const token = await accessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [meResponse, usersResponse] = await Promise.all([
        fetch('/api/v1/admin/me', { headers, cache: 'no-store' }),
        fetch('/api/v1/admin/users', { headers, cache: 'no-store' }),
      ]);
      const mePayload = await meResponse.json().catch(() => null) as AdminMe | null;
      const usersPayload = await usersResponse.json().catch(() => null) as { users?: AdminUserSummary[] } | null;
      if (!meResponse.ok || !mePayload?.user) throw new Error(apiError(mePayload, 'Admin session could not be loaded.'));
      if (!usersResponse.ok || !usersPayload?.users) throw new Error(apiError(usersPayload, 'Users could not be loaded.'));
      setAdmin(mePayload);
      setUsers(usersPayload.users);
      selectUser(usersPayload.users, preferredId ?? selectedIdRef.current);
    } catch (error) {
      setMessageKind('error');
      setMessage(error instanceof Error ? error.message : 'Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectUser]);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const selected = users.find((user) => user.id === selectedId) ?? null;
  const actorIsOwner = admin?.roles.includes('owner') ?? false;
  const selectedNeedsOwner = selected?.isOwner || selected?.roles.some((role) => role === 'owner' || role === 'super_admin');
  const canEditSelected = Boolean(selected && (!selectedNeedsOwner || actorIsOwner));
  const visibleUsers = users.filter((user) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || [user.fullName, user.email, ...user.roles.map((role) => roleLabels[role])]
      .some((value) => value?.toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.isActive : !user.isActive);
    return matchesQuery && matchesStatus;
  });

  function beginCreate() {
    setCreating(true);
    selectedIdRef.current = null;
    setSelectedId(null);
    setEditor(null);
    setCreateForm({ email: '', fullName: '', temporaryPassword: '', roles: ['content_manager'] });
    setMessage('');
  }

  function chooseUser(user: AdminUserSummary) {
    setCreating(false);
    selectedIdRef.current = user.id;
    setSelectedId(user.id);
    setEditor(editState(user));
    setMessage('');
  }

  function toggleEditRole(role: AdminRole) {
    if (!editor || role === 'owner' || (role === 'super_admin' && !actorIsOwner)) return;
    const roles = editor.roles.includes(role) ? editor.roles.filter((item) => item !== role) : [...editor.roles, role];
    const requiresMfa = roles.some((item) => item === 'owner' || item === 'super_admin' || item === 'credential_manager');
    setEditor({ ...editor, roles, mfaRequired: requiresMfa ? true : editor.mfaRequired });
  }

  function toggleCreateRole(role: AdminRole) {
    if (role === 'owner' || (role === 'super_admin' && !actorIsOwner)) return;
    const roles = createForm.roles.includes(role) ? createForm.roles.filter((item) => item !== role) : [...createForm.roles, role];
    setCreateForm({ ...createForm, roles });
  }

  async function createUser() {
    if (!createForm.email.trim() || !createForm.email.includes('@')) throw new Error('Enter a valid email address.');
    if (createForm.temporaryPassword.length < 12) throw new Error('Temporary password must be at least 12 characters.');
    if (createForm.roles.length === 0) throw new Error('Select at least one role.');
    const response = await fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: createForm.email.trim().toLowerCase(),
        fullName: createForm.fullName.trim() || null,
        temporaryPassword: createForm.temporaryPassword,
        roles: createForm.roles,
      }),
    });
    const payload = await response.json().catch(() => null) as { user?: AdminUserSummary } | null;
    if (!response.ok || !payload?.user) throw new Error(apiError(payload, 'User could not be created.'));
    setCreateForm((current) => ({ ...current, temporaryPassword: '' }));
    await load(payload.user.id);
    setMessageKind('success');
    setMessage('User created. Their profile and roles were recorded in the audit log.');
  }

  async function saveUser() {
    if (!selected || !editor) return;
    if (!canEditSelected) throw new Error('Only Owner can change Owner or Super Admin accounts.');
    if (editor.roles.length === 0) throw new Error('At least one role is required.');
    const token = await accessToken();
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const added = editor.roles.filter((role) => !selected.roles.includes(role));
    const removed = selected.roles.filter((role) => !editor.roles.includes(role));
    if (added.length) {
      const response = await fetch(`/api/v1/admin/users/${selected.id}/roles`, { method: 'PUT', headers, body: JSON.stringify({ roles: added }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Roles could not be assigned.'));
    }
    if (removed.length) {
      const response = await fetch(`/api/v1/admin/users/${selected.id}/roles`, { method: 'DELETE', headers, body: JSON.stringify({ roles: removed }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Roles could not be removed.'));
    }
    const profileChanged = editor.fullName.trim() !== (selected.fullName ?? '')
      || editor.isActive !== selected.isActive
      || editor.mfaRequired !== selected.mfaRequired;
    if (profileChanged) {
      const response = await fetch(`/api/v1/admin/users/${selected.id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ fullName: editor.fullName.trim() || null, isActive: editor.isActive, mfaRequired: editor.mfaRequired }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'User profile could not be updated.'));
    }
    await load(selected.id);
    setMessageKind('success');
    setMessage('Changes saved and recorded in the audit log.');
  }

  async function submit(action: 'create' | 'save') {
    setSaving(true);
    setMessage('');
    try {
      if (action === 'create') await createUser();
      else await saveUser();
    } catch (error) {
      setMessageKind('error');
      setMessage(error instanceof Error ? error.message : 'The operation could not be completed.');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = Boolean(selected && editor && (
    editor.fullName.trim() !== (selected.fullName ?? '')
    || editor.isActive !== selected.isActive
    || editor.mfaRequired !== selected.mfaRequired
    || !sameRoles(editor.roles, selected.roles)
  ));

  return (
    <main className="user-admin-shell">
      <header className="admin-module-header">
        <div>
          <p className="admin-kicker">Access control</p>
          <h1>Users and roles</h1>
          <p>{admin ? `${admin.user.email ?? 'Admin'} · ${admin.mfa.satisfied ? 'MFA verified' : 'MFA required'}` : 'Owner / Super Admin · MFA required'}</p>
        </div>
      </header>

      <section className="user-admin-toolbar" aria-label="User controls">
        <label className="user-admin-search">
          <span>Search users</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, or role" />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">All users</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </label>
        <p>{loading ? 'Loading users' : `${visibleUsers.length} of ${users.length} users`}</p>
        <button className="user-admin-create" type="button" onClick={beginCreate}>Add user</button>
      </section>

      {message ? <p className={`user-admin-message user-admin-message-${messageKind}`} role={messageKind === 'error' ? 'alert' : 'status'}>{message}<button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">×</button></p> : null}

      <section className="user-admin-workspace">
        <div className="user-admin-list">
          <div className="user-admin-table-head" aria-hidden="true"><span>User</span><span>Roles</span><span>Access</span></div>
          {loading ? <div className="user-admin-loading"><span /><span /><span /></div> : null}
          {!loading && visibleUsers.length === 0 ? <div className="user-admin-empty"><strong>No users found</strong><span>Adjust the search or status filter.</span></div> : null}
          {!loading && visibleUsers.map((user) => (
            <button className="user-admin-row" type="button" key={user.id} aria-pressed={!creating && user.id === selectedId} onClick={() => chooseUser(user)}>
              <span className="user-admin-identity"><strong>{user.fullName || 'Unnamed admin'}</strong><small>{user.email || 'No email available'}</small></span>
              <span className="user-admin-role-list">{user.roles.map((role) => <small key={role}>{roleLabels[role]}</small>)}</span>
              <span className={`user-admin-state ${user.isActive ? 'is-active' : 'is-inactive'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
            </button>
          ))}
        </div>

        <aside className="user-admin-detail" aria-live="polite">
          {creating ? (
            <form onSubmit={(event) => { event.preventDefault(); void submit('create'); }}>
              <div className="user-admin-detail-heading"><div><span>New admin account</span><h2>Add user</h2><p>Create access with one or more operational roles.</p></div></div>
              <div className="user-admin-form-grid">
                <label><span>Email</span><input type="email" autoComplete="email" required value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} /></label>
                <label><span>Full name</span><input autoComplete="name" value={createForm.fullName} onChange={(event) => setCreateForm({ ...createForm, fullName: event.target.value })} /></label>
                <label className="user-admin-full"><span>Initial password</span><input type="password" autoComplete="new-password" minLength={12} required value={createForm.temporaryPassword} onChange={(event) => setCreateForm({ ...createForm, temporaryPassword: event.target.value })} /><small>At least 12 characters. Share it through a secure channel.</small></label>
              </div>
              <fieldset className="user-admin-roles"><legend>Roles</legend>{adminRoles.filter((role) => role !== 'owner').map((role) => <label key={role} className={role === 'super_admin' && !actorIsOwner ? 'is-disabled' : ''}><input type="checkbox" checked={createForm.roles.includes(role)} disabled={role === 'super_admin' && !actorIsOwner} onChange={() => toggleCreateRole(role)} /><span><strong>{roleLabels[role]}</strong><small>{roleDescriptions[role]}</small></span></label>)}</fieldset>
              <div className="user-admin-actions"><button type="button" onClick={() => selectUser(users, users[0]?.id ?? null)}>Cancel</button><button className="is-primary" type="submit" disabled={saving}>{saving ? 'Creating user' : 'Create user'}</button></div>
            </form>
          ) : selected && editor ? (
            <form onSubmit={(event) => { event.preventDefault(); void submit('save'); }}>
              <div className="user-admin-detail-heading"><div><span>Admin account</span><h2>{selected.fullName || 'Unnamed admin'}</h2><p>{selected.email || 'No email available'} · Added {readableDate(selected.createdAt)}</p></div><span className={`user-admin-state ${selected.isActive ? 'is-active' : 'is-inactive'}`}>{selected.isActive ? 'Active' : 'Inactive'}</span></div>
              {!canEditSelected ? <p className="user-admin-permission-note">Only Owner can change Owner or Super Admin accounts. You can review this account but cannot edit it.</p> : null}
              <div className="user-admin-form-grid">
                <label className="user-admin-full"><span>Full name</span><input value={editor.fullName} disabled={!canEditSelected} onChange={(event) => setEditor({ ...editor, fullName: event.target.value })} /></label>
                <label className="user-admin-switch"><input type="checkbox" checked={editor.isActive} disabled={!canEditSelected || selected.isOwner} onChange={(event) => setEditor({ ...editor, isActive: event.target.checked })} /><span><strong>Active access</strong><small>{selected.isOwner ? 'The active Owner cannot be deactivated.' : 'Inactive users cannot use the admin application.'}</small></span></label>
                <label className="user-admin-switch"><input type="checkbox" checked={editor.mfaRequired} disabled={!canEditSelected || editor.roles.some((role) => role === 'owner' || role === 'super_admin' || role === 'credential_manager')} onChange={(event) => setEditor({ ...editor, mfaRequired: event.target.checked })} /><span><strong>Require MFA</strong><small>Always enforced for Owner, Super Admin, and Credential Manager.</small></span></label>
              </div>
              <fieldset className="user-admin-roles" disabled={!canEditSelected}><legend>Roles</legend>{adminRoles.map((role) => { const locked = role === 'owner' || (role === 'super_admin' && !actorIsOwner); return <label key={role} className={locked ? 'is-disabled' : ''}><input type="checkbox" checked={editor.roles.includes(role)} disabled={!canEditSelected || locked} onChange={() => toggleEditRole(role)} /><span><strong>{roleLabels[role]}</strong><small>{roleDescriptions[role]}</small></span></label>; })}</fieldset>
              <p className="user-admin-audit-note">Profile, access, and role changes are written to the audit log.</p>
              <div className="user-admin-actions"><button type="button" disabled={!hasChanges || saving} onClick={() => setEditor(editState(selected))}>Discard</button><button className="is-primary" type="submit" disabled={!canEditSelected || !hasChanges || saving}>{saving ? 'Saving changes' : 'Save changes'}</button></div>
            </form>
          ) : <div className="user-admin-empty"><strong>Select a user</strong><span>Choose an account to review access and roles.</span></div>}
        </aside>
      </section>
    </main>
  );
}
