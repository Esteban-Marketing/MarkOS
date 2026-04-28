'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

// Vercel BotID exposes a global script that attaches window.__botId.getToken.
// D-03: fire pre-submit — token must be present before POST hits the API.
declare global {
  interface Window {
    __botId?: { getToken?: () => Promise<string> };
  }
}

type UiState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'sent'; email: string; buffer_expires_at: string }
  | { status: 'error'; message: string; code?: string }
  | { status: 'bot_blocked' }
  | { status: 'rate_limited' };

const RATE_LIMIT_COPY = 'Rate-limited. Retry in an hour.';
const BOT_BLOCKED_COPY = 'Verification failed. Retry or contact support.';
const RESEND_COOLDOWN_MS = 60_000;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [ui, setUi] = useState<UiState>({ status: 'idle' });
  const [resendReadyAt, setResendReadyAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (resendReadyAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [resendReadyAt]);

  async function acquireBotIdToken(): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.__botId?.getToken) {
        const t = await window.__botId.getToken();
        if (typeof t === 'string' && t.length > 0) return t;
      }
    } catch { /* fall through */ }
    // Development fallback: a literal test string is acceptable when VERCEL_BOTID is disabled.
    return 'dev-no-botid';
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email) return;
    setUi({ status: 'submitting' });

    const botIdToken = await acquireBotIdToken();

    const resp = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, botIdToken }),
    });

    if (resp.status === 201) {
      const body = await resp.json().catch(() => ({}));
      setUi({ status: 'sent', email, buffer_expires_at: body.buffer_expires_at || '' });
      setResendReadyAt(Date.now() + RESEND_COOLDOWN_MS);
      return;
    }
    if (resp.status === 403) return setUi({ status: 'bot_blocked' });
    if (resp.status === 429) return setUi({ status: 'rate_limited' });

    const body = await resp.json().catch(() => ({}));
    setUi({
      status: 'error',
      message: body.message || 'Signup failed. Retry.',
      code: body.error,
    });
  }

  const isSubmitting = ui.status === 'submitting';
  const canResend = resendReadyAt !== null && now >= resendReadyAt;
  const isError = ui.status === 'error';

  return (
    <main className={styles.signupPage}>
      <section className={`c-card c-card--feature ${styles.authCard}`} aria-labelledby="signup-heading">
        <p className="t-label-caps">markos.dev</p>
        <h1 id="signup-heading">Start your workspace</h1>

        {ui.status === 'sent' ? (
          <div className={styles.successPanel} role="status" aria-live="polite">
            <strong>[ok] Check your inbox.</strong>
            <span>Magic link sent to <em>{ui.email}</em>.</span>
            <button
              type="button"
              className="c-button c-button--tertiary"
              onClick={() => submit()}
              disabled={!canResend || isSubmitting}
              aria-live="polite"
            >
              {canResend ? 'Resend link' : `Resend in ${Math.ceil(((resendReadyAt || 0) - now) / 1000)}s`}
            </button>
          </div>
        ) : (
          <>
            <p className="t-lead">One email. No credit card.</p>
            <form className={styles.form} onSubmit={submit} noValidate>
              <div className="c-field">
                <label htmlFor="signup-email" className="c-field__label">Work email</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="signup-help"
                  aria-invalid={isError}
                  className="c-input"
                />
                <p id="signup-help" role="status" aria-live="polite" className="c-field__help">
                  {ui.status === 'bot_blocked' && (
                    <span className={styles.fieldWarning}>[warn] {BOT_BLOCKED_COPY}</span>
                  )}
                  {ui.status === 'rate_limited' && (
                    <span className={styles.fieldWarning}>[warn] {RATE_LIMIT_COPY}</span>
                  )}
                  {ui.status === 'error' && (
                    <span className="c-field__error">{ui.message}</span>
                  )}
                  {ui.status === 'idle' && 'We send a magic link to verify your email.'}
                </p>
              </div>
              <button
                type="submit"
                className={`c-button c-button--primary${isSubmitting ? ' is-loading' : ''}`}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                Create workspace
              </button>
            </form>
            <p className="c-field__help">
              Already have a workspace? <a className={styles.signinLink} href="/login">Sign in instead</a>.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
