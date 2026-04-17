'use client';

import { useState } from 'react';
import styles from './PasskeyPrompt.module.css';

type PasskeyPromptProps = {
  userId: string;
  onDismiss?: () => void;
};

type FlowState =
  | { status: 'idle' }
  | { status: 'in_progress' }
  | { status: 'registered' }
  | { status: 'error'; message: string };

const COOKIE_NAME = 'markos_passkey_prompt_dismissed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setDismissCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function PasskeyPrompt({ userId, onDismiss }: PasskeyPromptProps) {
  const [flow, setFlow] = useState<FlowState>({ status: 'idle' });
  const [hidden, setHidden] = useState(false);

  async function setupPasskey() {
    setFlow({ status: 'in_progress' });
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');

      const optsResp = await fetch('/api/auth/passkey/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-markos-user-id': userId },
        body: JSON.stringify({}),
      });
      if (!optsResp.ok) throw new Error(`register-options failed (${optsResp.status})`);
      const { options, challenge_id } = await optsResp.json();

      const attResponse = await startRegistration({ optionsJSON: options });

      const verifyResp = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-markos-user-id': userId },
        body: JSON.stringify({ challenge_id, attResponse }),
      });
      if (!verifyResp.ok) throw new Error(`register-verify failed (${verifyResp.status})`);

      setFlow({ status: 'registered' });
      setTimeout(() => setHidden(true), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'unknown_error';
      setFlow({ status: 'error', message: `Passkey setup failed. Try again or skip for now. (${msg})` });
    }
  }

  function dismiss() {
    setDismissCookie();
    setHidden(true);
    onDismiss?.();
  }

  if (hidden) return null;

  return (
    <section
      className={styles.promptCard}
      role="region"
      aria-labelledby="passkey-prompt-heading"
      aria-label="Set up a passkey for faster login"
    >
      <div className={styles.content}>
        <h2 id="passkey-prompt-heading" className={styles.heading}>Log in faster next time.</h2>
        <p className={styles.body}>
          Set up a passkey — one tap, no link to wait for.
        </p>

        {flow.status === 'registered' && (
          <p className={styles.statusText} role="status" aria-live="polite">Passkey added. You're set.</p>
        )}
        {flow.status === 'error' && (
          <p className={styles.errorText} role="status" aria-live="polite">{flow.message}</p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={setupPasskey}
            disabled={flow.status === 'in_progress' || flow.status === 'registered'}
          >
            {flow.status === 'in_progress' ? 'Setting up…' : 'Set up passkey'}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={dismiss}
          >
            Not now
          </button>
        </div>
      </div>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={dismiss}
        aria-label="Dismiss passkey setup prompt"
      >
        ×
      </button>
    </section>
  );
}
