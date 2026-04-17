'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './page.module.css';

type Member = {
  id: string;
  user_id: string;
  iam_role: string;
  created_at: string;
  email?: string | null;
};

type PendingInvite = {
  token: string;
  email: string;
  tenant_role: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
};

type SeatUsage = { used: number; quota: number };

const TENANT_ROLE_OPTIONS = [
  { value: 'tenant-admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'readonly', label: 'Read-only' },
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [seatUsage, setSeatUsage] = useState<SeatUsage>({ used: 0, quota: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('contributor');

  async function fetchMembers() {
    const r = await fetch('/api/tenant/members/list', { method: 'GET' });
    if (!r.ok) return;
    const body = await r.json();
    setMembers(body.members || []);
    setSeatUsage(body.seat_usage || { used: 0, quota: 0 });
  }

  useEffect(() => { fetchMembers(); }, []);

  async function sendInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteBusy(true);
    const r = await fetch('/api/tenant/invites/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, tenant_role: inviteRole }),
    });
    setInviteBusy(false);
    if (r.status === 201) {
      setToast('Invite sent.');
      setInviteEmail('');
      fetchMembers();
    } else if (r.status === 400) {
      const body = await r.json().catch(() => ({}));
      if (body.error === 'seat_quota_reached') {
        setToast(`Seat limit reached (${seatUsage.quota} seats).`);
      } else {
        setToast(body.error || 'Could not send invite.');
      }
    } else {
      setToast('Could not send invite. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function removeMember(user_id: string) {
    if (!confirm('Remove this member? They lose tenant access immediately.')) return;
    const r = await fetch('/api/tenant/members/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });
    setToast(r.ok ? 'Member removed.' : 'Could not remove member.');
    setTimeout(() => setToast(null), 4000);
    if (r.ok) fetchMembers();
  }

  const atQuota = seatUsage.quota > 0 && seatUsage.used >= seatUsage.quota;
  const usagePct = seatUsage.quota > 0 ? Math.min(100, Math.round((seatUsage.used / seatUsage.quota) * 100)) : 0;

  return (
    <main className={styles.page}>
      <section className={styles.contentCard} aria-labelledby="members-heading">
        <h1 id="members-heading" className={styles.heading}>Members</h1>
        <p className={styles.subheading}>
          Invite teammates, assign roles, and track seat usage.
        </p>

        <div className={styles.seatBar} aria-label="Seat usage">
          <div className={styles.seatBarLabel}>
            {seatUsage.used} of {seatUsage.quota} seats used
          </div>
          <div className={styles.seatBarTrack}>
            <div className={styles.seatBarFill} style={{ width: `${usagePct}%` }} />
          </div>
        </div>

        {members === null && <p className={styles.emptyState}>Loading members…</p>}

        {members !== null && (
          <table className={styles.membersTable}>
            <caption>Tenant members and roles</caption>
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Tenant role</th>
                <th scope="col">Joined</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className={styles.avatar} aria-hidden="true">{(m.email || m.user_id).slice(0, 2).toUpperCase()}</div>
                    <span className={styles.memberLabel}>{m.email || m.user_id}</span>
                  </td>
                  <td>{m.iam_role}</td>
                  <td>{new Date(m.created_at).toLocaleDateString()}</td>
                  <td>
                    {m.iam_role !== 'owner' && (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeMember(m.user_id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.contentCard} aria-labelledby="invite-heading">
        <h2 id="invite-heading" className={styles.heading}>Invite teammates</h2>
        <form onSubmit={sendInvite} className={styles.inviteForm}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              disabled={atQuota}
              placeholder="teammate@company.com"
            />
          </label>
          <label className={styles.field}>
            <span>Role</span>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              disabled={atQuota}
            >
              {TENANT_ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className={styles.sendInviteButton}
            disabled={atQuota || inviteBusy}
          >
            {inviteBusy ? 'Sending…' : atQuota ? `Seat limit reached (${seatUsage.quota} seats)` : 'Send invite'}
          </button>
        </form>

        {pendingInvites.length > 0 && (
          <div className={styles.pendingList}>
            <h3 className={styles.subHeading}>Pending invites</h3>
            <ul>
              {pendingInvites.map(p => (
                <li key={p.token}>{p.email} — {p.tenant_role}</li>
              ))}
            </ul>
          </div>
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
