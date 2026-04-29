'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type DomainRow = { domain: string; status: string; verified_at: string | null; vanity_login_enabled: boolean };
type Branding = { logo_url: string | null; primary_color: string; display_name: string | null; vanity_login_enabled: boolean };

export type DnsState = 'idle' | 'pending' | 'verified' | 'rotating' | 'failed';

export type DomainPageViewProps = {
  domains: DomainRow[];
  loading: boolean;
  addInput: string;
  toast: string | null;
  branding: Branding | null;
  brandBusy: boolean;
  dnsState: DnsState;
  rotationDeadline?: string | null;
  onAddInputChange: (val: string) => void;
  onAddDomain: (e: React.FormEvent) => void;
  onRemoveDomain: (domain: string) => void;
  onSaveBranding: (patch: Partial<Branding>) => void;
  onBrandingChange: (b: Branding) => void;
};

export function DomainPageView({
  domains,
  loading,
  addInput,
  toast,
  branding,
  brandBusy,
  dnsState,
  rotationDeadline,
  onAddInputChange,
  onAddDomain,
  onRemoveDomain,
  onSaveBranding,
  onBrandingChange,
}: DomainPageViewProps) {
  const resolveUrl = rotationDeadline
    ? `/settings/domain/resolve?deadline=${encodeURIComponent(rotationDeadline)}`
    : '/settings/domain/resolve';

  return (
    <main className={styles.page}>
      <section className={`c-card ${styles.contentCard}`} aria-labelledby="domain-heading">
        <h1 id="domain-heading">Custom domain</h1>
        <p className="t-lead">
          Serve your workspace from your own domain. Requires a CNAME record. 1 domain per org.
        </p>

        {loading && <p className={styles.emptyState}>Loading…</p>}

        {/* DNS state notices — one renders per state (D-3) */}
        {!loading && dnsState === 'verified' && (
          <div className="c-notice c-notice--success" role="status">
            <strong>[ok]</strong>{' '}Domain verified. Your custom domain is active.
          </div>
        )}
        {!loading && dnsState === 'pending' && (
          <div className="c-notice c-notice--info" role="status">
            <strong>[info]</strong>{' '}DNS verification pending. This may take up to 48 hours.
          </div>
        )}
        {!loading && dnsState === 'rotating' && (
          <div className="c-notice c-notice--warning" role="status">
            <strong>[warn]</strong>{' '}Domain rotation in progress. Both the old and new domains are active during the grace period.{' '}
            <a href={resolveUrl} className="c-button c-button--tertiary">Resolve now</a>
          </div>
        )}
        {!loading && dnsState === 'failed' && (
          <div className="c-notice c-notice--error" role="status">
            <strong>[err]</strong>{' '}Verification failed. Check your DNS records and retry.
          </div>
        )}

        {!loading && domains.length === 0 && (
          <form className={styles.addForm} onSubmit={onAddDomain} noValidate>
            <div className="c-field">
              <label htmlFor="domain-input" className="c-field__label">Subdomain</label>
              <input
                id="domain-input"
                name="subdomain"
                type="text"
                placeholder="app.yourdomain.com"
                className="c-input"
                value={addInput}
                onChange={(e) => onAddInputChange(e.target.value)}
                required
              />
              <p className="c-field__help">Enter your custom subdomain (e.g. acme.markos.run).</p>
            </div>
            <button type="submit" className="c-button c-button--primary">Add domain</button>
          </form>
        )}

        {!loading && domains.length > 0 && (
          <div className={`c-card ${styles.contentCard}`}>
            <p>
              <strong>{domains[0].domain}</strong>
              {' — '}
              <span className={styles.statusCell}>
                {dnsState === 'verified' && (
                  <>
                    <span className="c-status-dot c-status-dot--live" aria-hidden="true" />
                    <span>[ok] Verified</span>
                  </>
                )}
                {dnsState === 'pending' && (
                  <>
                    <span className="c-status-dot" aria-hidden="true" />
                    <span>[warn] Pending</span>
                  </>
                )}
                {dnsState === 'failed' && (
                  <>
                    <span className="c-status-dot c-status-dot--error" aria-hidden="true" />
                    <span>[err] Failed</span>
                  </>
                )}
                {(dnsState === 'rotating' || dnsState === 'idle') && (
                  <>
                    <span className="c-status-dot" aria-hidden="true" />
                    <span>[warn] Pending</span>
                  </>
                )}
              </span>
            </p>

            <div className={styles.cnameLabel}>
              <span className="t-label-caps">CNAME record</span>
            </div>
            <div className="c-terminal">
              <pre className="c-code-block">
                <code>{`Type:   CNAME\nHost:   ${domains[0].domain}\nValue:  cname.markos.run`}</code>
              </pre>
            </div>
            <p className="c-field__help">DNS propagation can take up to 48 hours.</p>

            <div className={styles.actionRow}>
              <button
                type="button"
                className="c-button c-button--destructive"
                onClick={() => onRemoveDomain(domains[0].domain)}
              >
                Remove domain
              </button>
            </div>
          </div>
        )}
      </section>

      {branding && (
        <section className={`c-card ${styles.contentCard}`} aria-labelledby="brand-heading">
          <h2 id="brand-heading">Brand chrome</h2>
          <p className="t-lead">
            Override logo, colour, and display name on your custom domain.
          </p>

          <div className="c-field">
            <label htmlFor="display-name-input" className="c-field__label">Display name</label>
            <input
              id="display-name-input"
              type="text"
              className="c-input"
              value={branding.display_name || ''}
              onChange={(e) => onBrandingChange({ ...branding, display_name: e.target.value })}
            />
          </div>

          <div className="c-field">
            <label htmlFor="primary-color-input" className="c-field__label">Primary color</label>
            <input
              id="primary-color-input"
              type="color"
              value={branding.primary_color}
              onChange={(e) => onBrandingChange({ ...branding, primary_color: e.target.value })}
            />
          </div>

          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={branding.vanity_login_enabled}
              onChange={(e) => onBrandingChange({ ...branding, vanity_login_enabled: e.target.checked })}
            />
            <span>Show tenant-branded login on custom domain</span>
          </label>

          <button
            type="button"
            className="c-button c-button--primary"
            onClick={() => onSaveBranding(branding)}
            disabled={brandBusy}
          >
            {brandBusy ? 'Saving…' : 'Save brand settings'}
          </button>
        </section>
      )}

      {toast && (
        <div className="c-toast" role="status" aria-live="polite">{toast}</div>
      )}
    </main>
  );
}

export default function DomainSettingsPage() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [brandBusy, setBrandBusy] = useState(false);
  const [dnsState, setDnsState] = useState<DnsState>('idle');

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
      setDnsState('pending');
    } else if (body.error === 'quota_exceeded') {
      setToast('Your org already has a custom domain. Remove it before adding another.');
    } else if (body.error === 'invalid_domain_format') {
      setToast('That does not look like a valid domain.');
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
      setDnsState('idle');
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
    <DomainPageView
      domains={domains}
      loading={loading}
      addInput={addInput}
      toast={toast}
      branding={branding}
      brandBusy={brandBusy}
      dnsState={dnsState}
      rotationDeadline={null}
      onAddInputChange={setAddInput}
      onAddDomain={addDomain}
      onRemoveDomain={removeDomain}
      onSaveBranding={saveBranding}
      onBrandingChange={(b) => setBranding(b)}
    />
  );
}
