'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

type OffboardingStatus = {
  offboarding: boolean;
  days_remaining: number | null;
  purge_due_at: string | null;
};

export default function DangerPage() {
  const [status, setStatus] = useState<OffboardingStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState('');
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Tenant slug derivation stub — real wiring lands in Plan 08 with x-markos-tenant-slug header.
  const workspaceSlug = typeof window !== 'undefined' ? (window.location.hostname.split('.')[0] || 'workspace') : 'workspace';

  useEffect(() => {
    // Status read endpoint is wired in Plan 08; fall back to optimistic "not offboarding".
    setStatus({ offboarding: false, days_remaining: null, purge_due_at: null });
  }, []);

  function openDialog() {
    setConfirmSlug('');
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function startDeletion() {
    if (confirmSlug !== workspaceSlug) {
      setToast('Slug does not match. Deletion cancelled.');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    setBusy(true);
    const r = await fetch('/api/tenant/lifecycle/offboard', { method: 'POST' });
    setBusy(false);
    if (r.ok) {
      const body = await r.json();
      setStatus({
        offboarding: true,
        days_remaining: 30,
        purge_due_at: body.purge_due_at || null,
      });
      setToast('Deletion scheduled. You have 30 days to cancel.');
      closeDialog();
    } else {
      setToast('Could not start deletion. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function cancelDeletion() {
    if (!confirm('Cancel the scheduled deletion and keep this workspace?')) return;
    setBusy(true);
    const r = await fetch('/api/tenant/lifecycle/cancel-offboard', { method: 'POST' });
    setBusy(false);
    if (r.ok) {
      setStatus({ offboarding: false, days_remaining: null, purge_due_at: null });
      setToast('Deletion cancelled. Workspace restored.');
    } else {
      setToast('Could not cancel. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <main className={styles.page}>
      {status?.offboarding && (
        <div className={styles.purgeBanner} role="alert">
          <div>
            <strong>Workspace scheduled for deletion.</strong>{' '}
            {status.days_remaining ?? '—'} days remaining before permanent purge.
          </div>
          <button
            type="button"
            className={styles.cancelLink}
            onClick={cancelDeletion}
            disabled={busy}
          >
            Cancel deletion
          </button>
        </div>
      )}

      <section className={styles.contentCard} aria-labelledby="danger-heading">
        <h1 id="danger-heading" className={styles.heading}>Danger zone</h1>
        <p className={styles.subheading}>
          Deleting the workspace starts a 30-day grace window. During that window the owner can
          cancel deletion. After 30 days every row is permanently purged and a GDPR export bundle
          is generated.
        </p>

        <div className={styles.dangerRow}>
          <div>
            <div className={styles.dangerLabel}>Delete workspace</div>
            <div className={styles.dangerHelp}>Schedules deletion 30 days from now.</div>
          </div>
          <button
            type="button"
            className={styles.deleteOutlineButton}
            onClick={openDialog}
            disabled={busy || !!status?.offboarding}
          >
            Delete workspace
          </button>
        </div>
      </section>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="confirm-heading">
        <form method="dialog" onSubmit={e => { e.preventDefault(); startDeletion(); }}>
          <h2 id="confirm-heading" className={styles.dialogHeading}>Confirm deletion</h2>
          <p className={styles.dialogBody}>
            Type the workspace slug to confirm. Deletion begins immediately with a 30-day cancel
            window.
          </p>
          <label className={styles.field}>
            <span>Workspace slug ({workspaceSlug})</span>
            <input
              type="text"
              value={confirmSlug}
              onChange={e => setConfirmSlug(e.target.value)}
              placeholder={workspaceSlug}
              required
              autoFocus
            />
          </label>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.cancelButton} onClick={closeDialog}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.deleteFilledButton}
              disabled={confirmSlug !== workspaceSlug || busy}
            >
              {busy ? 'Scheduling…' : 'Start deletion'}
            </button>
          </div>
        </form>
      </dialog>

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
