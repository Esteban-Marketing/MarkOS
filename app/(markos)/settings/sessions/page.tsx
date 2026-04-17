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

  async function fetchSessions() {
    const r = await fetch('/api/tenant/sessions/list', { method: 'GET' });
    if (!r.ok) return;
    const body = await r.json();
    setSessions(body.sessions || []);
  }

  useEffect(() => { fetchSessions(); }, []);

  async function revokeOne(sid: string) {
    setBusy(sid);
    const r = await fetch('/api/tenant/sessions/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sid }),
    });
    setBusy(null);
    if (r.ok) {
      setToast('Session revoked.');
      fetchSessions();
    } else {
      setToast('Could not revoke. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function revokeAll() {
    setBusy('all');
    const r = await fetch('/api/tenant/sessions/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setBusy(null);
    if (r.ok) {
      const body = await r.json();
      setToast(`${body.revoked_count || 'All'} other sessions revoked.`);
      fetchSessions();
    } else {
      setToast('Could not revoke. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  const hasOthers = (sessions || []).some(s => !s.is_current);

  return (
    <main className={styles.page}>
      <section className={styles.contentCard}>
        <h1 className={styles.heading}>Active sessions</h1>
        <p className={styles.subheading}>
          You&apos;re signed in on these devices. Revoke any you don&apos;t recognise.
        </p>

        {sessions === null && <p className={styles.emptyState}>Loading sessions…</p>}

        {sessions !== null && sessions.length === 0 && (
          <p className={styles.emptyState}>Just one device. You&apos;re only signed in here.</p>
        )}

        {sessions !== null && sessions.length > 0 && (
          <>
            <table className={styles.sessionsTable}>
              <caption>Devices signed in to your account</caption>
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Last seen</th>
                  <th scope="col">Location</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.session_id}>
                    <td>
                      {s.device_label || 'Unknown device'}
                      {s.is_current && <> &nbsp;<span className={styles.currentBadge}>this device</span></>}
                    </td>
                    <td>{new Date(s.last_seen_at).toLocaleString()}</td>
                    <td>{s.location || '—'}</td>
                    <td>
                      {!s.is_current && (
                        <button
                          type="button"
                          className={styles.revokeButton}
                          onClick={() => revokeOne(s.session_id)}
                          disabled={busy === s.session_id}
                        >
                          {busy === s.session_id ? 'Revoking…' : 'Revoke session'}
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
                  className={styles.revokeAllButton}
                  onClick={revokeAll}
                  disabled={busy === 'all'}
                >
                  {busy === 'all' ? 'Revoking…' : 'Revoke all other sessions'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
