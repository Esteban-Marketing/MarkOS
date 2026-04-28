'use client';

import { useState } from 'react';
import styles from './page.module.css';

type Props = {
  params: { token: string };
};

export default function InviteAcceptPage({ params }: Props) {
  const [status, setStatus] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function acceptInvite() {
    setStatus('accepting');
    setErrorMessage(null);
    const r = await fetch('/api/tenant/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token }),
    });
    if (r.ok) {
      const body = await r.json();
      setStatus('success');
      // Redirect to the accepted tenant workspace on next tick.
      setTimeout(() => {
        window.location.href = `/tenant/${body.tenant_id || ''}`;
      }, 800);
      return;
    }
    const body = await r.json().catch(() => ({}));
    setStatus('error');
    setErrorMessage(reasonCopy(body.error || 'accept_failed'));
  }

  const isAccepting = status === 'accepting';
  const isSuccess = status === 'success';

  let buttonLabel = 'Accept invite';
  if (isAccepting) {
    buttonLabel = 'Accepting…';
  } else if (isSuccess) {
    buttonLabel = '[ok] Accepted. Redirecting…';
  }

  return (
    <main className={styles.page}>
      <section className={`c-card c-card--feature ${styles.contentCard}`} aria-labelledby="invite-heading">
        <h1 id="invite-heading">You&apos;re invited to MarkOS</h1>
        <p className="t-lead">
          Accept the invite to join this workspace. Sign in with the email the invite was sent to.
        </p>

        <button
          type="button"
          className={`c-button c-button--primary${isAccepting ? ' is-loading' : ''}`}
          onClick={acceptInvite}
          disabled={isAccepting || isSuccess}
          aria-busy={isAccepting ? 'true' : 'false'}
        >
          {buttonLabel}
        </button>

        <div role="status" aria-live="polite" className={styles.statusRegion}>
          {status === 'error' && errorMessage && (
            <p className={`c-card ${styles.errorMessage}`}>{errorMessage}</p>
          )}
        </div>
      </section>
    </main>
  );
}

function reasonCopy(reason: string): string {
  switch (reason) {
    case 'invite_expired':
      return '[err] Invite expired. Ask the person who invited you to send a fresh one.';
    case 'invite_email_mismatch':
      return '[err] Email mismatch. Sign in with the address this invite was sent to, then retry.';
    case 'invite_withdrawn':
      return '[err] Invite withdrawn.';
    case 'invite_already_accepted':
      return '[err] Invite already accepted.';
    case 'invite_not_found':
      return '[err] Invite not found.';
    case 'seat_quota_reached':
      return '[err] Seat limit reached. Ask the workspace owner to free a seat.';
    default:
      return '[err] Accept failed. Retry later.';
  }
}
