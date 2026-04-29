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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

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

  function requestRemoveMember(member: Member) {
    setMemberToRemove(member);
    setShowRemoveConfirm(true);
  }

  async function confirmRemove() {
    if (!memberToRemove) return;
    setShowRemoveConfirm(false);
    const r = await fetch('/api/tenant/members/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: memberToRemove.user_id }),
    });
    setToast(r.ok ? 'Member removed.' : 'Could not remove member.');
    setTimeout(() => setToast(null), 4000);
    if (r.ok) fetchMembers();
    setMemberToRemove(null);
  }

  const atQuota = seatUsage.quota > 0 && seatUsage.used >= seatUsage.quota;
  const usagePct = seatUsage.quota > 0 ? Math.min(100, Math.round((seatUsage.used / seatUsage.quota) * 100)) : 0;

  const meterFillClass =
    usagePct >= 90
      ? `${styles.meterFill} ${styles['meterFill--error']}`
      : usagePct >= 70
        ? `${styles.meterFill} ${styles['meterFill--warning']}`
        : styles.meterFill;

  return (
    <main className={styles.page}>
      <section className={`c-card ${styles.contentCard}`} aria-labelledby="members-heading">
        <h1 id="members-heading">Members</h1>
        <p className="t-lead">
          Invite teammates, assign roles, and track seat usage.
        </p>

        <div className={styles.seatBar} aria-label="Seat usage">
          <span className="t-label-caps">
            {seatUsage.used} of {seatUsage.quota} seats used
          </span>
          <div className={styles.meterTrack}>
            <div className={meterFillClass} style={{ width: `${usagePct}%` }} />
          </div>
        </div>

        {members === null && <p className={styles.emptyState}>Loading members…</p>}

        {members !== null && members.length === 0 && (
          <p className={styles.emptyState}>
            No members yet. Invite your first team member to get started.
          </p>
        )}

        {members !== null && members.length > 0 && (
          <table className={styles.membersTable}>
            <caption>Team members</caption>
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Tenant role</th>
                <th scope="col">Joined</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <span className={styles.avatar} aria-hidden="true">
                      {(m.email || m.user_id).slice(0, 2).toUpperCase()}
                    </span>
                    {m.email || m.user_id}
                  </td>
                  <td>
                    <span className="c-badge">{m.iam_role}</span>
                  </td>
                  <td>{new Date(m.created_at).toLocaleDateString()}</td>
                  <td>
                    {m.iam_role !== 'owner' && (
                      <button
                        type="button"
                        className="c-button c-button--destructive"
                        onClick={() => requestRemoveMember(m)}
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

      <section className={`c-card ${styles.contentCard}`} aria-labelledby="invite-heading">
        <h2 id="invite-heading">Invite teammates</h2>

        {pendingInvites.length > 0 && (
          <div className="c-notice c-notice--info" role="status">
            <strong>[info]</strong>{' '}
            Invite pending. Resend or revoke if the recipient has not responded.
          </div>
        )}

        <form onSubmit={sendInvite} className={styles.inviteForm}>
          <div className="c-field">
            <label htmlFor="invite-email" className="c-field__label">Email</label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              disabled={atQuota}
              placeholder="teammate@company.com"
              className="c-input"
            />
          </div>
          <div className="c-field">
            <label htmlFor="invite-role" className="c-field__label">Role</label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              disabled={atQuota}
              className="c-input"
            >
              {TENANT_ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="c-button c-button--primary"
            disabled={atQuota || inviteBusy}
          >
            {inviteBusy ? 'Sending…' : atQuota ? `Seat limit reached (${seatUsage.quota} seats)` : 'Invite member'}
          </button>
        </form>

        {pendingInvites.length > 0 && (
          <table className={styles.membersTable}>
            <caption>Pending invites</caption>
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.map(p => (
                <tr key={p.token}>
                  <td>
                    {p.email}
                    {' '}
                    <span className="c-badge c-badge--info">[info] Pending</span>
                  </td>
                  <td>{p.tenant_role}</td>
                  <td>
                    <button type="button" className="c-button c-button--tertiary">
                      Resend invite
                    </button>
                    <button type="button" className="c-button c-button--destructive">
                      Revoke invite
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showRemoveConfirm && memberToRemove && (
        <>
          <div
            className="c-backdrop"
            onClick={() => setShowRemoveConfirm(false)}
            aria-hidden="true"
          />
          <div
            className="c-modal"
            role="dialog"
            aria-labelledby="remove-confirm-heading"
            aria-modal="true"
          >
            <h3 id="remove-confirm-heading">
              Remove {memberToRemove.email || memberToRemove.user_id} from this workspace?
            </h3>
            <p>They will lose access immediately.</p>
            <div className={styles.actionRow}>
              <button
                type="button"
                className="c-button c-button--secondary"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="c-button c-button--destructive"
                onClick={confirmRemove}
              >
                Remove member
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="c-toast-region" role="status" aria-live="polite">
          <div className="c-toast">{toast}</div>
        </div>
      )}
    </main>
  );
}
