'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type Session = {
  session_id: string;
  device_label: string | null;
  user_agent: string | null;
  last_seen_at: string;
  location: string | null;
  is_current: boolean;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);

  async function fetchSessions() {
    const r = await fetch('/api/tenant/sessions/list', { method: 'GET' });
    if (!r.ok) return;
    const body = await r.json();
    setSessions(body.sessions || []);
  }

  useEffect(() => { fetchSessions(); }, []);

  async function confirmRevoke() {
    if (!revokeTarget) return;
    const sid = revokeTarget;
    setRevokeTarget(null);
    setBusy(sid);
    const r = await fetch('/api/tenant/sessions/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sid }),
    });
    setBusy(null);
    if (r.ok) {
      showToast('Session revoked.');
      fetchSessions();
    } else {
      showToast('Could not revoke. Try again.');
    }
  }

  async function confirmRevokeAll() {
    setShowRevokeAll(false);
    setBusy('all');
    const r = await fetch('/api/tenant/sessions/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setBusy(null);
    if (r.ok) {
      const body = await r.json();
      showToast(`${body.revoked_count || 'All'} other sessions revoked.`);
      fetchSessions();
    } else {
      showToast('Could not revoke. Try again.');
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

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
                          onClick={() => setRevokeTarget(s.session_id)}
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
                  onClick={() => setShowRevokeAll(true)}
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
          <div className="c-backdrop" onClick={() => setRevokeTarget(null)} aria-hidden="true" />
          <div className="c-modal" role="dialog" aria-labelledby="revoke-confirm-heading" aria-modal="true">
            <h3 id="revoke-confirm-heading">Revoke this session?</h3>
            <p>The device will be signed out immediately.</p>
            <div className={styles.actionRow}>
              <button type="button" className="c-button c-button--secondary" onClick={() => setRevokeTarget(null)}>Cancel</button>
              <button type="button" className="c-button c-button--destructive" onClick={confirmRevoke}>Revoke session</button>
            </div>
          </div>
        </>
      )}

      {/* Revoke-all confirm */}
      {showRevokeAll && (
        <>
          <div className="c-backdrop" onClick={() => setShowRevokeAll(false)} aria-hidden="true" />
          <div className="c-modal" role="dialog" aria-labelledby="revoke-all-confirm-heading" aria-modal="true">
            <h3 id="revoke-all-confirm-heading">Revoke all other sessions?</h3>
            <p>You will remain signed in on this device.</p>
            <div className={styles.actionRow}>
              <button type="button" className="c-button c-button--secondary" onClick={() => setShowRevokeAll(false)}>Cancel</button>
              <button type="button" className="c-button c-button--destructive" onClick={confirmRevokeAll}>Revoke all</button>
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
