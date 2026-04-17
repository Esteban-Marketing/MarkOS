'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './TenantSwitcher.module.css';

type TenantEntry = {
  id: string;
  slug: string;
  name: string;
  iam_role: string;
  status: 'active' | 'offboarding' | 'purged';
};

type OrgGroup = {
  org_id: string;
  org_name: string;
  org_slug: string;
  org_role: string;
  tenants: TenantEntry[];
};

type Props = {
  activeTenantId?: string | null;
  activeOrgName?: string | null;
};

export default function TenantSwitcher({ activeTenantId, activeOrgName }: Props) {
  const [orgs, setOrgs] = useState<OrgGroup[] | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadTargets() {
    const r = await fetch('/api/tenant/switcher/list', { method: 'GET' });
    if (!r.ok) return;
    const body = await r.json();
    setOrgs(body.orgs || []);
  }

  useEffect(() => { loadTargets(); }, []);

  function switchTo(tenant: TenantEntry) {
    window.location.href = `/tenant/${tenant.id}`;
  }

  async function createTenant(e: FormEvent) {
    e.preventDefault();
    if (!creating || !newSlug || !newName) return;
    setBusy(true);
    setError(null);
    const r = await fetch('/api/tenant/switcher/create-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-markos-org-id': creating },
      body: JSON.stringify({ slug: newSlug, name: newName }),
    });
    setBusy(false);
    if (r.status === 201) {
      setCreating(null);
      setNewSlug('');
      setNewName('');
      loadTargets();
    } else {
      const body = await r.json().catch(() => ({}));
      setError(
        body.error === 'slug_reserved' ? 'That slug is reserved.'
        : body.error === 'slug_taken' ? 'That slug is already taken.'
        : body.error === 'forbidden' ? 'You cannot create a workspace in this org.'
        : 'Could not create workspace. Try again.'
      );
    }
  }

  return (
    <details className={styles.switcher} aria-labelledby="switcher-heading">
      <summary className={styles.summary}>
        <span id="switcher-heading" className={styles.summaryLabel}>
          {activeOrgName || 'Workspace'}
        </span>
        <span className={styles.summaryChevron} aria-hidden="true">▾</span>
      </summary>

      <div className={styles.dropdown} role="menu">
        {orgs === null && <p className={styles.empty}>Loading…</p>}
        {orgs !== null && orgs.length === 0 && <p className={styles.empty}>No workspaces yet.</p>}
        {(orgs || []).map(org => (
          <div key={org.org_id} className={styles.orgGroup}>
            <div className={styles.orgHeader}>
              <span className={styles.orgName}>{org.org_name}</span>
              <span className={styles.orgRole}>{org.org_role}</span>
            </div>
            <ul className={styles.tenantList}>
              {org.tenants.filter(t => t.status !== 'purged').map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={activeTenantId === t.id ? styles.tenantActive : styles.tenantButton}
                    onClick={() => switchTo(t)}
                    role="menuitem"
                  >
                    <span className={styles.tenantName}>{t.name}</span>
                    <span className={styles.tenantRole}>{t.iam_role}</span>
                  </button>
                </li>
              ))}
            </ul>

            {['owner', 'billing-admin'].includes(org.org_role) && (
              creating === org.org_id ? (
                <form onSubmit={createTenant} className={styles.createForm}>
                  <input
                    type="text"
                    placeholder="Workspace slug"
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value.toLowerCase())}
                    pattern="[a-z0-9-]{2,63}"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Workspace name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                  />
                  <button type="submit" className={styles.createSubmit} disabled={busy}>
                    {busy ? 'Creating…' : 'Create workspace'}
                  </button>
                  {error && <div className={styles.error} role="alert">{error}</div>}
                </form>
              ) : (
                <button
                  type="button"
                  className={styles.createLink}
                  onClick={() => { setCreating(org.org_id); setError(null); }}
                >
                  + Create new workspace
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
