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

const RATE_LIMIT_COPY = 'Too many requests from this device. Try again in an hour.';
const BOT_BLOCKED_COPY = "We couldn't verify this request. Try again or contact support.";
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
      message: body.message || 'Signup failed. Try again.',
      code: body.error,
    });
  }

  const isSubmitting = ui.status === 'submitting';
  const canResend = resendReadyAt !== null && now >= resendReadyAt;

  return (
    <main className={styles.signupPage}>
      <section className={styles.authCard} aria-labelledby="signup-heading">
        <p className={styles.eyebrow}>markos.dev</p>
        <h1 id="signup-heading" className={styles.displayHeading}>
          Start your workspace
        </h1>

        {ui.status === 'sent' ? (
          <div className={styles.successPanel} role="status" aria-live="polite">
            <strong>Check your inbox.</strong>
            <br />
            We sent a magic link to <em>{ui.email}</em>.
            <button
              type="button"
              className={styles.resendButton}
              onClick={() => submit()}
              disabled={!canResend || isSubmitting}
              aria-live="polite"
            >
              {canResend ? 'Resend link' : `Resend available in ${Math.ceil(((resendReadyAt || 0) - now) / 1000)}s`}
            </button>
          </div>
        ) : (
          <>
            <p className={styles.subheading}>
              One email, one click, you're in. No credit card, no ceremony.
            </p>
            <form className={styles.form} onSubmit={submit} noValidate>
              <label htmlFor="signup-email" className={styles.label}>Work email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby="signup-help"
                className={`${styles.input}${ui.status === 'error' ? ' ' + styles.inputError : ''}`}
              />
              <button type="submit" className={styles.primaryCta} disabled={isSubmitting}>
                {isSubmitting ? <span className={styles.spinner} aria-hidden="true" /> : 'Create workspace'}
              </button>
              <p id="signup-help" role="status" aria-live="polite" className={styles.help}>
                {ui.status === 'bot_blocked' && <span className={styles.errorText}>{BOT_BLOCKED_COPY}</span>}
                {ui.status === 'rate_limited' && <span className={styles.errorText}>{RATE_LIMIT_COPY}</span>}
                {ui.status === 'error' && <span className={styles.errorText}>{ui.message}</span>}
                {ui.status === 'idle' && 'We\'ll send you a magic link — no password to remember.'}
              </p>
            </form>
            <p className={styles.help}>
              Already have a workspace? <a className={styles.signinLink} href="/login">Sign in instead</a>.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
