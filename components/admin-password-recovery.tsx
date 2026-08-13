'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Phase = 'loading' | 'request' | 'update' | 'complete';

function createRecoveryClient() {
  const url = process.env.NEXT_PUBLIC_RECOVERY_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_RECOVERY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error('Production recovery configuration is missing.');
  return createClient(url, publishableKey);
}

export function AdminPasswordRecovery() {
  const supabase = useMemo(() => createRecoveryClient(), []);
  const [phase, setPhase] = useState<Phase>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setPhase('update');
    });
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError('The recovery session could not be loaded. Request a new link.');
        setPhase('request');
        return;
      }
      setPhase(data.session ? 'update' : 'request');
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function requestRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/admin/reset-password` },
      );
      if (requestError) throw requestError;
      setMessage('Recovery email sent. Open only the newest Supabase link in this browser.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Recovery email could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 16) {
      setError('Use at least 16 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
      if (signOutError) throw signOutError;
      setPassword('');
      setConfirmation('');
      setPhase('complete');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Password could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell">
    <section className="auth-panel" aria-labelledby="admin-reset-title">
      <div className="auth-heading">
        <p className="admin-kicker">Preview-only recovery</p>
        <h1 id="admin-reset-title">Reset Owner password</h1>
        <p>This temporary page never stores or logs the password. MFA factors remain unchanged.</p>
      </div>

      {phase === 'loading' ? <p className="auth-state">Checking the recovery session…</p> : null}

      {phase === 'request' ? <form className="auth-form" onSubmit={requestRecovery}>
        <label>
          <span>Owner email</span>
          <input autoComplete="email" inputMode="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <button className="auth-submit" disabled={busy} type="submit">{busy ? 'Sending…' : 'Send new recovery link'}</button>
      </form> : null}

      {phase === 'update' ? <form className="auth-form" onSubmit={updatePassword}>
        <label>
          <span>New password</span>
          <input autoComplete="new-password" minLength={16} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        <label>
          <span>Confirm new password</span>
          <input autoComplete="new-password" minLength={16} onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} />
        </label>
        <button className="auth-submit" disabled={busy} type="submit">{busy ? 'Updating…' : 'Set new password'}</button>
      </form> : null}

      {phase === 'complete' ? <div className="auth-state">
        <strong>Password updated</strong>
        <p>All existing sessions were signed out. Sign in again and complete the existing MFA challenge.</p>
        <Link href="/admin/login">Return to admin sign in</Link>
      </div> : null}

      {message ? <p className="auth-state" role="status">{message}</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
    </section>
  </main>;
}
