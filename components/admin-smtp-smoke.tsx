'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createClient, type Factor } from '@supabase/supabase-js';

type Phase = 'password' | 'mfa' | 'ready';

function createProductionAuthClient() {
  const url = process.env.NEXT_PUBLIC_RECOVERY_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_RECOVERY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error('Production smoke authentication is not configured.');
  return createClient(url, publishableKey);
}

function apiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

export function AdminSmtpSmoke() {
  const supabase = useMemo(() => createProductionAuthClient(), []);
  const [phase, setPhase] = useState<Phase>('password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factor, setFactor] = useState<Factor | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await supabase.auth.signInWithPassword({ email: 'nobelitbs@gmail.com', password });
      setPassword('');
      if (result.error) throw result.error;
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;
      const verifiedFactor = factors.data.totp.find((candidate) => candidate.status === 'verified') ?? null;
      if (!verifiedFactor) throw new Error('No verified Authenticator factor is available for the production Owner.');
      setFactor(verifiedFactor);
      setPhase('mfa');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Production Owner sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!factor) throw new Error('MFA factor is not ready.');
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
      setCode('');
      if (result.error) throw result.error;
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) throw assurance.error;
      if (assurance.data.currentLevel !== 'aal2') throw new Error('The production Owner session is not AAL2.');
      setPhase('ready');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'MFA verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function sendSmoke() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (session.error || !token) throw session.error ?? new Error('Production Owner session is missing.');
      const response = await fetch('/api/v1/admin/credential-email-smoke', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null) as { smoke?: { recipient: string; sentAt: string } } | null;
      if (!response.ok || !payload?.smoke) throw new Error(apiMessage(payload, 'SMTP smoke failed.'));
      setMessage(`Sent to ${payload.smoke.recipient} at ${payload.smoke.sentAt}.`);
      await supabase.auth.signOut({ scope: 'local' });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'SMTP smoke failed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell">
    <section className="auth-panel" aria-labelledby="smtp-smoke-title">
      <div className="auth-heading">
        <p className="admin-kicker">Preview-only transport test</p>
        <h1 id="smtp-smoke-title">VEDOS SMTP smoke</h1>
        <p>This isolated page verifies the production Owner with MFA but does not read or change production database records.</p>
      </div>
      {phase === 'password' ? <form className="auth-form" onSubmit={signIn}>
        <label><span>Production Owner email</span><input disabled value="nobelitbs@gmail.com" /></label>
        <label><span>Production Owner password</span><input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
        <button className="auth-submit" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Continue to MFA'}</button>
      </form> : null}
      {phase === 'mfa' ? <form className="auth-form" onSubmit={verifyMfa}>
        <label><span>6-digit Authenticator code</span><input autoComplete="one-time-code" inputMode="numeric" maxLength={6} minLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} pattern="[0-9]{6}" required value={code} /></label>
        <button className="auth-submit" disabled={busy} type="submit">{busy ? 'Verifying…' : 'Verify MFA'}</button>
      </form> : null}
      {phase === 'ready' ? <button className="auth-submit" disabled={busy || Boolean(message)} onClick={() => void sendSmoke()} type="button">{busy ? 'Sending…' : 'Send VEDOS SMTP smoke'}</button> : null}
      {message ? <p className="auth-state" role="status">{message}</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
    </section>
  </main>;
}
