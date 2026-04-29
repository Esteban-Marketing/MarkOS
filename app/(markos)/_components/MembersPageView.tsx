'use client';

/**
 * MembersPageView — presentational view for /settings/members.
 * Accepts all state as props so it can be rendered in Storybook stories
 * and tested without network access.
 *
 * Phase 213.3 Plan 02 — extracted per CONTEXT D-15 (sub-component extraction
 * recommended when page.tsx JSX exceeds ~40 LOC of repetitive member-row logic).
 * Phase 201 tenancy wiring stays in page.tsx (event handlers passed as props).
 */

import styles from '../settings/members/page.module.css';

export type MemberViewItem = {
  id: string;
  user_id: string;
  iam_role: string;
  created_at: string;
  email?: string | null;
};

export type PendingInviteViewItem = {
  token: string;
  email: string;
  tenant_role: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
};

export type SeatUsageView = { used: number; quota: number };

export type MembersPageViewProps = {
  members: MemberViewItem[] | null;
  pendingInvites: PendingInviteViewItem[];
  seatUsage: SeatUsageView;
  toast: string | null;
  inviteBusy: boolean;
  inviteEmail: string;
  inviteRole: string;
  showRemoveConfirm: boolean;
  memberToRemove: MemberViewItem | null;
  tenantRoleOptions: { value: string; label: string }[];
  onInviteEmailChange: (val: string) => void;
  onInviteRoleChange: (val: string) => void;
  onSendInvite: (e: React.FormEvent) => void;
  onRequestRemove: (member: MemberViewItem) => void;
  onConfirmRemove: () => void;
  onCancelRemove: () => void;
};

export function MembersPageView({
  members,
  pendingInvites,
  seatUsage,
  toast,
  inviteBusy,
  inviteEmail,
  inviteRole,
  showRemoveConfirm,
  memberToRemove,
  tenantRoleOptions,
  onInviteEmailChange,
  onInviteRoleChange,
  onSendInvite,
  onRequestRemove,
  onConfirmRemove,
  onCancelRemove,
}: MembersPageViewProps) {
  const atQuota = seatUsage.quota > 0 && seatUsage.used >= seatUsage.quota;
  const usagePct =
    seatUsage.quota > 0
      ? Math.min(100, Math.round((seatUsage.used / seatUsage.quota) * 100))
      : 0;

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
                        onClick={() => onRequestRemove(m)}
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

        <form onSubmit={onSendInvite} className={styles.inviteForm}>
          <div className="c-field">
            <label htmlFor="invite-email" className="c-field__label">Email</label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              value={inviteEmail}
              onChange={e => onInviteEmailChange(e.target.value)}
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
              onChange={e => onInviteRoleChange(e.target.value)}
              disabled={atQuota}
              className="c-input"
            >
              {tenantRoleOptions.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="c-button c-button--primary"
            disabled={atQuota || inviteBusy}
          >
            {inviteBusy
              ? 'Sending…'
              : atQuota
                ? `Seat limit reached (${seatUsage.quota} seats)`
                : 'Invite member'}
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
            onClick={onCancelRemove}
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
                onClick={onCancelRemove}
              >
                Cancel
              </button>
              <button
                type="button"
                className="c-button c-button--destructive"
                onClick={onConfirmRemove}
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
