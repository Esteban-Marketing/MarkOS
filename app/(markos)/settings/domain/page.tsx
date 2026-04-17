'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type DomainRow = { domain: string; status: string; verified_at: string | null; vanity_login_enabled: boolean };
type Branding = { logo_url: string | null; primary_color: string; display_name: string | null; vanity_login_enabled: boolean };

export default function DomainSettingsPage() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [brandBusy, setBrandBusy] = useState(false);

  async function loadDomains() {
    // Planner note: the list endpoint is implicitly /api/settings/custom-domain/status in this
    // UI by polling known-domain status. For production, Plan 08 adds a /list endpoint; for now
    // we surface empty/present via branding state + a single active domain.
    setLoading(false);
  }

  async function loadBranding() {
    const r = await fetch('/api/settings/tenant-branding');
    if (r.ok) setBranding(await r.json());
  }

  useEffect(() => { loadDomains(); loadBranding(); }, []);

  async function addDomain(e: React.FormEvent) {
    e.preventDefault();
    const resp = await fetch('/api/settings/custom-domain/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: addInput }),
    });
    const body = await resp.json().catch(() => ({}));
    if (resp.ok) {
      setToast(`Domain added. ${body.cname_target ? `Point CNAME to ${body.cname_target}` : 'Waiting for DNS.'}`);
      setAddInput('');
      setDomains([{ domain: body.domain, status: body.status, verified_at: null, vanity_login_enabled: false }]);
    } else if (body.error === 'quota_exceeded') {
      setToast('Your org already has a custom domain. Remove it before adding another.');
    } else if (body.error === 'invalid_domain_format') {
      setToast('That doesn\'t look like a valid domain.');
    } else {
      setToast('Could not add. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function removeDomain(domain: string) {
    const resp = await fetch('/api/settings/custom-domain/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    if (resp.ok) {
      setToast('Domain removed.');
      setDomains([]);
    } else {
      setToast('Could not remove. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function saveBranding(patch: Partial<Branding>) {
    setBrandBusy(true);
    const resp = await fetch('/api/settings/tenant-branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setBrandBusy(false);
    if (resp.ok) {
      setToast('Brand settings saved.');
      setBranding((b) => b ? { ...b, ...patch } as Branding : b);
    } else {
      setToast('Could not save. Try again.');
    }
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <main className={styles.page}>
      <section className={styles.contentCard} aria-labelledby="domain-heading">
        <h1 id="domain-heading" className={styles.heading}>Custom domain</h1>
        <p className={styles.subheading}>
          Serve your workspace from your own domain. Requires a CNAME record. 1 domain per org.
        </p>

        {loading && <p>Loading…</p>}

        {!loading && domains.length === 0 && (
          <form className={styles.addForm} onSubmit={addDomain} noValidate>
            <label htmlFor="domain-input" className={styles.label}>Domain</label>
            <input
              id="domain-input"
              type="text"
              placeholder="app.yourdomain.com"
              className={styles.input}
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              required
            />
            <button type="submit" className={styles.primaryCta}>Add domain</button>
          </form>
        )}

        {!loading && domains.length > 0 && (
          <div className={styles.domainPanel}>
            <p><strong>{domains[0].domain}</strong> — <span className={styles.statusDot} data-status={domains[0].status} /> {domains[0].status}</p>
            <pre className={styles.cnameBlock}>
{`Type:   CNAME
Host:   ${domains[0].domain}
Value:  cname.vercel-dns.com`}
            </pre>
            <p className={styles.helpText}>DNS propagation can take up to 48 hours.</p>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => { if (confirm('Remove ' + domains[0].domain + '?')) removeDomain(domains[0].domain); }}
            >
              Remove domain
            </button>
          </div>
        )}
      </section>

      {branding && (
        <section className={styles.contentCard} aria-labelledby="brand-heading">
          <h2 id="brand-heading" className={styles.heading}>Brand chrome</h2>
          <p className={styles.subheading}>
            Override logo, colour, and display name on your custom domain.
          </p>

          <label htmlFor="display-name-input" className={styles.label}>Display name</label>
          <input
            id="display-name-input"
            type="text"
            className={styles.input}
            value={branding.display_name || ''}
            onChange={(e) => setBranding({ ...branding, display_name: e.target.value })}
          />

          <label htmlFor="primary-color-input" className={styles.label}>Primary color</label>
          <input
            id="primary-color-input"
            type="color"
            className={styles.colorInput}
            value={branding.primary_color}
            onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
          />

          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={branding.vanity_login_enabled}
              onChange={(e) => setBranding({ ...branding, vanity_login_enabled: e.target.checked })}
            />
            <span>Show tenant-branded login on custom domain</span>
          </label>

          <button
            type="button"
            className={styles.primaryCta}
            onClick={() => saveBranding(branding)}
            disabled={brandBusy}
          >
            {brandBusy ? 'Saving…' : 'Save brand settings'}
          </button>
        </section>
      )}

      {toast && <div className={styles.toast} role="status" aria-live="polite">{toast}</div>}
    </main>
  );
}
