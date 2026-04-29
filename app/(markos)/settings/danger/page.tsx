'use client';

import { useEffect, useState } from 'react';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tenant slug derivation stub — real wiring lands in Plan 08 with x-markos-tenant-slug header.
  const workspaceSlug = typeof window !== 'undefined' ? (window.location.hostname.split('.')[0] || 'workspace') : 'workspace';

  useEffect(() => {
    // Status read endpoint is wired in Plan 08; fall back to optimistic "not offboarding".
    setStatus({ offboarding: false, days_remaining: null, purge_due_at: null });
  }, []);

  function openDeleteConfirm() {
    setConfirmSlug('');
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    setShowDeleteConfirm(false);
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
      closeDeleteConfirm();
    } else {
      setToast('Could not start deletion. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function cancelDeletion() {
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
        <div className="c-notice c-notice--warning" role="alert">
          <strong>[warn]</strong>{' '}
          Workspace scheduled for deletion.{' '}
          {status.days_remaining ?? '—'} days remaining before permanent purge.{' '}
          <button
            type="button"
            className="c-button c-button--tertiary"
            onClick={cancelDeletion}
            disabled={busy}
          >
            Cancel deletion
          </button>
        </div>
      )}

      <section className={`c-card ${styles.contentCard}`} aria-labelledby="danger-heading">
        <h2 id="danger-heading">Danger zone</h2>
        <p className="t-lead">
          Deleting the workspace starts a 30-day grace window. During that window the owner can
          cancel deletion. After 30 days every row is permanently purged and a GDPR export bundle
          is generated.
        </p>

        <div className={styles.dangerStack}>
          <div className={`c-card ${styles.dangerRow}`}>
            <div className={styles.dangerActionRow}>
              <div>
                <h4>Delete workspace</h4>
                <p className="c-field__help">Permanently deletes this workspace and all data. This action cannot be undone.</p>
              </div>
              <button
                type="button"
                className="c-button c-button--destructive"
                onClick={openDeleteConfirm}
                disabled={busy || !!status?.offboarding}
              >
                Delete workspace
              </button>
            </div>
          </div>
        </div>
      </section>

      {showDeleteConfirm && (
        <>
          <div
            className="c-backdrop"
            onClick={closeDeleteConfirm}
            aria-hidden="true"
          />
          <div
            className="c-modal"
            role="dialog"
            aria-labelledby="delete-confirm-heading"
            aria-modal="true"
          >
            <h3 id="delete-confirm-heading">Delete workspace?</h3>

            {/* DZ-2: Consequence notice ABOVE the confirm form */}
            <div className="c-notice c-notice--error" role="status">
              <strong>[err]</strong>{' '}Deleting this workspace removes all members, data, API keys, and webhook subscriptions.
            </div>

            <div className={`c-field ${styles.confirmField}`}>
              <label htmlFor="confirm-name" className="c-field__label">
                Type the workspace name to confirm
              </label>
              <input
                id="confirm-name"
                type="text"
                required
                className="c-input"
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                placeholder={workspaceSlug}
                aria-invalid={confirmSlug.length > 0 && confirmSlug !== workspaceSlug ? true : undefined}
                autoFocus
              />
              {confirmSlug.length > 0 && confirmSlug !== workspaceSlug && (
                <p className="c-field__error">Workspace name does not match.</p>
              )}
            </div>

            <div className={styles.modalActionRow}>
              <button
                type="button"
                className="c-button c-button--secondary"
                onClick={closeDeleteConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="c-button c-button--destructive"
                onClick={startDeletion}
                disabled={confirmSlug !== workspaceSlug || busy}
              >
                {busy ? 'Scheduling…' : 'Delete workspace permanently'}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="c-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
