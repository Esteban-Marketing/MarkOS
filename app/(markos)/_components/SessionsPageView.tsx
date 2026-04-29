'use client';

import styles from '../settings/sessions/page.module.css';

export type Session = {
  session_id: string;
  device_label: string | null;
  user_agent: string | null;
  last_seen_at: string;
  location: string | null;
  is_current: boolean;
};

export type SessionsPageViewProps = {
  sessions: Session[] | null;
  busy?: string | null;
  toast?: string | null;
  revokeTarget?: string | null;
  showRevokeAll?: boolean;
  onRevokeRequest?: (sessionId: string) => void;
  onRevokeTargetClear?: () => void;
  onRevokeConfirm?: () => void;
  onRevokeAllRequest?: () => void;
  onRevokeAllClear?: () => void;
  onRevokeAllConfirm?: () => void;
};

export default function SessionsPageView({
  sessions,
  busy = null,
  toast = null,
  revokeTarget = null,
  showRevokeAll = false,
  onRevokeRequest,
  onRevokeTargetClear,
  onRevokeConfirm,
  onRevokeAllRequest,
  onRevokeAllClear,
  onRevokeAllConfirm,
}: SessionsPageViewProps) {
  const hasOthers = (sessions || []).some(s => !s.is_current);

  return (
    <main className={styles.page}>
      <section className={`c-card ${styles.contentCard}`}>
        <h2>Active sessions</h2>
        <p className="t-lead">
          You&apos;re signed in on these devices. Revoke any you don&apos;t recognise.
        </p>

        {sessions === null && (
          <p className={styles.emptyState}>Loading sessions…</p>
        )}

        {sessions !== null && sessions.length === 0 && (
          <p className={styles.emptyState}>This is your only active session.</p>
        )}

        {sessions !== null && sessions.length > 0 && (
          <>
            <table className={styles.sessionsTable}>
              <caption>Devices signed in to your account</caption>
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last seen</th>
                  <th scope="col">Location</th>
                  <th scope="col"><span className="u-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.session_id}>
                    <td>{s.device_label || 'Unknown device'}</td>
                    <td>
                      {s.is_current ? (
                        <div className={styles.statusCell}>
                          <span className="c-status-dot c-status-dot--live" aria-hidden="true" />
                          <span>[ok] Active now</span>
                          <span className="c-badge c-badge--success">[ok] Current</span>
                        </div>
                      ) : null}
                    </td>
                    <td>{new Date(s.last_seen_at).toLocaleString()}</td>
                    <td>{s.location || '—'}</td>
                    <td>
                      {!s.is_current && (
                        <button
                          type="button"
                          className="c-button c-button--destructive"
                          onClick={() => onRevokeRequest?.(s.session_id)}
                          disabled={busy === s.session_id}
                        >
                          {busy === s.session_id ? 'Revoking…' : 'Revoke'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasOthers && (
              <div className={styles.revokeAllRow}>
                <button
                  type="button"
                  className="c-button c-button--destructive"
                  onClick={() => onRevokeAllRequest?.()}
                  disabled={busy === 'all'}
                >
                  {busy === 'all' ? 'Revoking…' : 'Revoke all other sessions'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Per-session revoke confirm */}
      {revokeTarget && (
        <>
          <div className="c-backdrop" onClick={() => onRevokeTargetClear?.()} aria-hidden="true" />
          <div className="c-modal" role="dialog" aria-labelledby="revoke-confirm-heading" aria-modal="true">
            <h3 id="revoke-confirm-heading">Revoke this session?</h3>
            <p>The device will be signed out immediately.</p>
            <div className={styles.actionRow}>
              <button type="button" className="c-button c-button--secondary" onClick={() => onRevokeTargetClear?.()}>Cancel</button>
              <button type="button" className="c-button c-button--destructive" onClick={() => onRevokeConfirm?.()}>Revoke session</button>
            </div>
          </div>
        </>
      )}

      {/* Revoke-all confirm */}
      {showRevokeAll && (
        <>
          <div className="c-backdrop" onClick={() => onRevokeAllClear?.()} aria-hidden="true" />
          <div className="c-modal" role="dialog" aria-labelledby="revoke-all-confirm-heading" aria-modal="true">
            <h3 id="revoke-all-confirm-heading">Revoke all other sessions?</h3>
            <p>You will remain signed in on this device.</p>
            <div className={styles.actionRow}>
              <button type="button" className="c-button c-button--secondary" onClick={() => onRevokeAllClear?.()}>Cancel</button>
              <button type="button" className="c-button c-button--destructive" onClick={() => onRevokeAllConfirm?.()}>Revoke all</button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="c-toast c-toast--success" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
