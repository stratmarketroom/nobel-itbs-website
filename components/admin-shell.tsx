'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminRole } from '@/lib/admin/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type AdminContext = {
  user: { id: string; email: string | null };
  profile: { full_name: string | null; is_owner: boolean; mfa_required: boolean };
  roles: AdminRole[];
  mfa: { required: boolean; aal: string | null; satisfied: boolean };
};

type ShellState = 'loading' | 'ready' | 'signed_out' | 'mfa_required' | 'forbidden';

type AdminNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  roles: AdminRole[];
};

const navItems: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', shortLabel: 'Dashboard', roles: ['owner', 'super_admin', 'content_manager', 'credential_manager'] },
  { href: '/admin/content-pages', label: 'Content pages', shortLabel: 'Content', roles: ['owner', 'super_admin', 'content_manager'] },
  { href: '/admin/programmes', label: 'Programmes', shortLabel: 'Programmes', roles: ['owner', 'super_admin', 'content_manager'] },
  { href: '/admin/programme-areas', label: 'Programme areas', shortLabel: 'Areas', roles: ['owner', 'super_admin', 'content_manager'] },
  { href: '/admin/programme-types', label: 'Programme types', shortLabel: 'Types', roles: ['owner', 'super_admin', 'content_manager'] },
  { href: '/admin/partners', label: 'Partners', shortLabel: 'Partners', roles: ['owner', 'super_admin', 'content_manager'] },
  { href: '/admin/experts', label: 'Experts', shortLabel: 'Experts', roles: ['owner', 'super_admin', 'content_manager'] },
  { href: '/admin/contact-submissions', label: 'Contact submissions', shortLabel: 'Contacts', roles: ['owner', 'super_admin', 'credential_manager'] },
  { href: '/admin/learners', label: 'Learners', shortLabel: 'Learners', roles: ['owner', 'super_admin', 'credential_manager'] },
  { href: '/admin/credentials', label: 'Credentials', shortLabel: 'Credentials', roles: ['owner', 'super_admin', 'credential_manager'] },
  { href: '/admin/email-templates', label: 'Email templates', shortLabel: 'Email', roles: ['owner', 'super_admin', 'credential_manager'] },
  { href: '/admin/credential-templates', label: 'Template packages', shortLabel: 'Templates', roles: ['owner', 'super_admin'] },
  { href: '/admin/site-settings', label: 'Site settings', shortLabel: 'Settings', roles: ['owner', 'super_admin'] },
  { href: '/admin/users', label: 'Users and roles', shortLabel: 'Users', roles: ['owner', 'super_admin'] },
];

function matchesAdminRoute(pathname: string, href: string): boolean {
  return href === '/admin'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

const roleLabels: Record<AdminRole, string> = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  content_manager: 'Content Manager',
  credential_manager: 'Credential Manager',
};

function routeAccess(pathname: string): AdminRole[] | null {
  const item = navItems.find((candidate) => matchesAdminRoute(pathname, candidate.href));
  return item?.roles ?? null;
}

function hasAnyRole(roles: AdminRole[], allowed: AdminRole[]): boolean {
  return roles.some((role) => allowed.includes(role));
}

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

function AccessState({
  state,
  onSignOut,
  detail,
}: {
  state: Exclude<ShellState, 'loading' | 'ready'>;
  onSignOut: () => Promise<void>;
  detail?: string;
}) {
  const copy = {
    signed_out: {
      eyebrow: 'Admin access',
      title: 'Sign in required',
      body: 'Use your Nobel ITBS admin account to open this workspace.',
      action: 'Go to sign in',
    },
    mfa_required: {
      eyebrow: 'Additional verification',
      title: 'MFA is required',
      body: 'This account or module requires an AAL2 session. Complete the authenticator step before continuing.',
      action: 'Verify MFA',
    },
    forbidden: {
      eyebrow: 'Permission check',
      title: 'Access not available',
      body: 'Your current role does not allow access to this module. No protected data has been loaded.',
      action: 'Return to sign in',
    },
  }[state];

  return (
    <main className="admin-access-state">
      <section aria-labelledby="admin-access-title">
        <p>{copy.eyebrow}</p>
        <h1 id="admin-access-title">{copy.title}</h1>
        <span>{detail || copy.body}</span>
        <div>
          <Link href="/admin/login">{copy.action}</Link>
          {state !== 'signed_out' ? <button type="button" onClick={() => void onSignOut()}>Sign out</button> : null}
        </div>
      </section>
    </main>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicAuthPath = pathname === '/admin/login';
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [state, setState] = useState<ShellState>('loading');
  const [admin, setAdmin] = useState<AdminContext | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.access_token) {
        setState('signed_out');
        return;
      }
      const response = await fetch('/api/v1/admin/me', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as AdminContext | null;
      if (response.status === 401) {
        setState('signed_out');
        return;
      }
      if (!response.ok || !payload?.user) {
        setError(apiMessage(payload, 'Admin access could not be verified.'));
        setState('forbidden');
        return;
      }
      setAdmin(payload);
      const allowedRoles = routeAccess(pathname);
      if (!allowedRoles || !hasAnyRole(payload.roles, allowedRoles)) {
        setState('forbidden');
        return;
      }
      if (!payload.mfa.satisfied) {
        setState('mfa_required');
        return;
      }
      setState('ready');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Admin access could not be verified.');
      setState('forbidden');
    }
  }, [pathname, supabase]);

  useEffect(() => {
    if (isPublicAuthPath) return;
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [isPublicAuthPath, load]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign('/admin/login');
  }

  if (isPublicAuthPath) return children;

  if (state === 'loading') {
    return (
      <main className="admin-shell-loading" aria-busy="true" aria-label="Checking admin access">
        <div><span /><span /><span /></div>
      </main>
    );
  }

  if (state !== 'ready' || !admin) {
    return <AccessState state={state as Exclude<ShellState, 'loading' | 'ready'>} onSignOut={signOut} detail={error} />;
  }

  const accessibleItems = navItems.filter((item) => hasAnyRole(admin.roles, item.roles));

  return (
    <div className="admin-app-shell">
      <aside className="admin-app-sidebar">
        <Link className="admin-app-brand" href="/admin">
          <span>N</span><strong>Nobel ITBS</strong><small>Admin</small>
        </Link>
        <nav aria-label="Admin modules">
          {accessibleItems.map((item) => {
            const active = matchesAdminRoute(pathname, item.href);
            return <Link href={item.href} key={item.href} aria-current={active ? 'page' : undefined}><span>{item.shortLabel.slice(0, 1)}</span><strong>{item.label}</strong></Link>;
          })}
        </nav>
        <div className="admin-app-account">
          <span>{admin.profile.full_name || admin.user.email || 'Admin user'}</span>
          <small>{admin.roles.map((role) => roleLabels[role]).join(' · ')}</small>
          <small>{admin.mfa.satisfied ? 'MFA verified' : 'MFA required'}</small>
          <button type="button" onClick={() => void signOut()}>Sign out</button>
        </div>
      </aside>
      <div className="admin-app-main">
        <header className="admin-app-mobile-bar">
          <strong>Nobel ITBS Admin</strong>
          <button type="button" onClick={() => void signOut()}>Sign out</button>
        </header>
        <nav className="admin-app-mobile-nav" aria-label="Admin modules">
          {accessibleItems.map((item) => {
            const active = matchesAdminRoute(pathname, item.href);
            return <Link href={item.href} key={item.href} aria-current={active ? 'page' : undefined}>{item.shortLabel}</Link>;
          })}
        </nav>
        <div className="admin-shell-content">{children}</div>
      </div>
    </div>
  );
}
