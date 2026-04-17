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

  return (
    <main className={styles.page}>
      <section className={styles.contentCard} aria-labelledby="invite-heading">
        <h1 id="invite-heading" className={styles.heading}>You&apos;re invited to MarkOS</h1>
        <p className={styles.subheading}>
          Accept the invite to join this workspace. You&apos;ll sign in with the email the invite was
          sent to.
        </p>

        <button
          type="button"
          className={styles.acceptButton}
          onClick={acceptInvite}
          disabled={status === 'accepting' || status === 'success'}
        >
          {status === 'accepting' ? 'Accepting…' : status === 'success' ? 'Accepted. Redirecting…' : 'Accept invite'}
        </button>

        <div role="status" aria-live="polite" className={styles.statusRegion}>
          {status === 'error' && errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}
        </div>
      </section>
    </main>
  );
}

function reasonCopy(reason: string): string {
  switch (reason) {
    case 'invite_expired': return 'This invite has expired. Ask the person who invited you to send a fresh one.';
    case 'invite_email_mismatch': return 'Sign in with the email this invite was sent to, then retry.';
    case 'invite_withdrawn': return 'This invite was withdrawn.';
    case 'invite_already_accepted': return 'This invite was already accepted.';
    case 'invite_not_found': return 'This invite link is no longer valid.';
    case 'seat_quota_reached': return 'The workspace has hit its seat limit. Ask the owner to free a seat.';
    default: return 'Could not accept invite. Try again later.';
  }
}
