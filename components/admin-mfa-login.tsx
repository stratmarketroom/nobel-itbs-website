'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type AdminMeResponse = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    full_name: string | null;
    is_owner: boolean;
    mfa_required: boolean;
  };
  roles: string[];
  mfa: {
    required: boolean;
    aal: string | null;
    satisfied: boolean;
  };
};

type TOTPFactor = {
  id: string;
  status?: string;
  friendly_name?: string;
};

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type Phase = 'credentials' | 'factor' | 'enroll' | 'ready';

function qrCodeSrc(svg: string) {
  if (svg.startsWith('data:')) {
    return svg;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }

  return fallback;
}

export function AdminMfaLogin() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [phase, setPhase] = useState<Phase>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factor, setFactor] = useState<TOTPFactor | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [admin, setAdmin] = useState<AdminMeResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadAdminContext() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.access_token) {
      throw new Error(sessionError?.message ?? 'Admin session was not created.');
    }

    const response = await fetch('/api/v1/admin/me', {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });
    const payload = (await response.json().catch(() => null)) as AdminMeResponse | { error?: { message?: string } } | null;

    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, 'Admin profile could not be loaded.'));
    }

    const context = payload as AdminMeResponse;
    setAdmin(context);

    return context;
  }

  async function beginEnrollment() {
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Nobel ITBS admin',
    });

    if (enrollError) {
      throw enrollError;
    }

    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    setPhase('enroll');
  }

  async function routeAfterFirstFactor() {
    const context = await loadAdminContext();
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assurance.error) {
      throw assurance.error;
    }

    if (context.mfa.satisfied || assurance.data.currentLevel === 'aal2') {
      setPhase('ready');
      router.push('/admin/users');
      return;
    }

    if (!context.mfa.required) {
      setPhase('ready');
      router.push('/admin/users');
      return;
    }

    const factors = await supabase.auth.mfa.listFactors();

    if (factors.error) {
      throw factors.error;
    }

    const verifiedFactor = factors.data.totp.find((candidate) => candidate.status === 'verified') ?? null;

    if (verifiedFactor && assurance.data.nextLevel === 'aal2') {
      setFactor(verifiedFactor);
      setPhase('factor');
      return;
    }

    await beginEnrollment();
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      await routeAfterFirstFactor();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const factorId = phase === 'enroll' ? enrollment?.factorId : factor?.id;

      if (!factorId) {
        throw new Error('MFA factor is not ready.');
      }

      const verification = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });

      if (verification.error) {
        throw verification.error;
      }

      const context = await loadAdminContext();

      if (!context.mfa.satisfied) {
        throw new Error('MFA verification completed, but the admin session is not AAL2 yet.');
      }

      setPhase('ready');
      router.push('/admin/users');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'MFA verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setAdmin(null);
    setFactor(null);
    setEnrollment(null);
    setCode('');
    setPhase('credentials');
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="admin-login-title">
        <div className="auth-heading">
          <p className="admin-kicker">Admin access</p>
          <h1 id="admin-login-title">Nobel ITBS admin</h1>
          <p>Secure sign-in for credential and site operations.</p>
        </div>

        {phase === 'credentials' ? (
          <form className="auth-form" onSubmit={handleSignIn}>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                inputMode="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button className="auth-submit" disabled={busy} type="submit">
              {busy ? 'Checking session' : 'Sign in'}
            </button>
          </form>
        ) : null}

        {phase === 'factor' ? (
          <form className="auth-form" onSubmit={handleVerify}>
            <div className="auth-state">
              <span>AAL1</span>
              <strong>Authenticator code required</strong>
              <p>{factor?.friendly_name ?? 'Use the verified TOTP factor linked to this account.'}</p>
            </div>
            <label>
              <span>6-digit code</span>
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={8}
                name="code"
                onChange={(event) => setCode(event.target.value.replace(/\s/g, ''))}
                required
                value={code}
              />
            </label>
            <button className="auth-submit" disabled={busy} type="submit">
              {busy ? 'Verifying' : 'Verify and continue'}
            </button>
          </form>
        ) : null}

        {phase === 'enroll' && enrollment ? (
          <form className="auth-form auth-form-wide" onSubmit={handleVerify}>
            <div className="auth-state">
              <span>MFA setup</span>
              <strong>Scan the authenticator code</strong>
              <p>Use 1Password, Google Authenticator, Authy, Apple Passwords, or another TOTP app.</p>
            </div>
            <div className="mfa-enrollment">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="TOTP QR code for Nobel ITBS admin MFA enrollment"
                src={qrCodeSrc(enrollment.qrCode)}
              />
              <div>
                <span>Manual setup key</span>
                <code>{enrollment.secret}</code>
              </div>
            </div>
            <label>
              <span>6-digit code</span>
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={8}
                name="code"
                onChange={(event) => setCode(event.target.value.replace(/\s/g, ''))}
                required
                value={code}
              />
            </label>
            <button className="auth-submit" disabled={busy} type="submit">
              {busy ? 'Enabling MFA' : 'Enable MFA and continue'}
            </button>
          </form>
        ) : null}

        {error ? <p className="auth-error">{error}</p> : null}

        {admin ? (
          <div className="auth-session">
            <span>{admin.user.email}</span>
            <span>{admin.roles.join(', ')}</span>
            <span>{admin.mfa.satisfied ? 'AAL2' : 'AAL1'}</span>
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
