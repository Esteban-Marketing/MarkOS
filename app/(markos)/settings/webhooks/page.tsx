'use client';

// Phase 203 Plan 09 Task 2 — Surface 1: /settings/webhooks tenant-admin dashboard.
// 213.3-08 Task 2 — className migration to DESIGN.md v1.1.0 primitives.
//
// IA (top to bottom):
//   1. Hero fleet metrics (4 numbers: 24h deliveries / Success rate / Avg latency / Dead-letter queue)
//      with top-right "Create subscription" CTA.
//   2. Subscriptions table (URL · Events · Status · Last delivery · Success rate · Actions).
//   3. Create-subscription native <dialog> (form with URL, events, rps override).
//   4. Toast region (role=status aria-live=polite).
//
// Copy contract: every locked string from 213.3-UI-SPEC §Surface 8 Copywriting Contract
// is rendered literally (tests will grep).
// A11y contract: aria-labelledby on 2 sections, role=meter on success bars,
// role=status on toast, <caption> + scope="col" on table, <dialog> for create confirm.
//
// Pattern lineage: app/(markos)/settings/mcp/page.tsx (202-09) — client component,
// useState + useEffect parallel fetch on mount + 30s setInterval re-fetch.

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';

type FleetMetrics = {
  tenant_id: string;
  total_24h: number;
  success_rate: number;
  avg_latency_ms: number;
  dlq_count: number;
  window_start: string;
  window_end: string;
};

type RateLimitShape = {
  plan_tier: string;
  ceiling_rps: number;
  effective_rps: number;
  override_rps: number | null;
};

type BreakerShape = { state: 'closed' | 'half-open' | 'open'; trips?: number };

type Subscription = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  rotation_state: string | null;
  grace_ends_at: string | null;
  status_chip: 'Healthy' | 'Half-open' | 'Tripped';
  breaker_state: BreakerShape;
  rate_limit: RateLimitShape;
  last_delivery_at: string | null;
  success_rate: number;
  total_24h: number;
};

function subStatusBadge(chip: string): { cls: string; label: string } {
  if (chip === 'Tripped') return { cls: 'c-badge c-badge--error', label: '[err] Failing' };
  if (chip === 'Half-open') return { cls: 'c-badge c-badge--warning', label: '[warn] Disabled' };
  return { cls: 'c-badge c-badge--success', label: '[ok] Enabled' };
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function WebhooksSettingsPage() {
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testFiring, setTestFiring] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string>('');
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState('');
  const [formRps, setFormRps] = useState('');
  const [formError, setFormError] = useState<string>('');
  const createDialogRef = useRef<HTMLDialogElement | null>(null);

  async function fetchMetrics() {
    try {
      const r = await fetch('/api/tenant/webhooks/fleet-metrics', { credentials: 'same-origin' });
      if (r.ok) setMetrics(await r.json());
    } catch { /* silent; hero renders "—" */ }
    setLoadingMetrics(false);
  }
  async function fetchSubscriptions() {
    try {
      const r = await fetch('/api/tenant/webhooks/subscriptions', { credentials: 'same-origin' });
      if (r.ok) {
        const body = await r.json();
        setSubscriptions(body.subscriptions || []);
      }
    } catch { /* silent */ }
    setLoadingSubs(false);
  }

  useEffect(() => {
    fetchMetrics();
    fetchSubscriptions();
    const t = setInterval(() => {
      fetchMetrics();
      fetchSubscriptions();
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (createOpen && createDialogRef.current && !createDialogRef.current.open) {
      createDialogRef.current.showModal();
    }
  }, [createOpen]);

  function openCreateDialog() {
    setFormUrl('');
    setFormEvents('');
    setFormRps('');
    setFormError('');
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    if (createDialogRef.current) createDialogRef.current.close();
    setCreateOpen(false);
  }

  async function onSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    const events = formEvents.split(',').map((s) => s.trim()).filter(Boolean);
    const body: Record<string, unknown> = { url: formUrl, events };
    if (formRps.trim().length > 0) {
      const n = Number(formRps);
      if (Number.isFinite(n)) body.rps_override = n;
    }
    try {
      const r = await fetch('/api/webhooks/subscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setToast('Subscription created.');
        setTimeout(() => setToast(''), 4000);
        closeCreateDialog();
        fetchSubscriptions();
      } else {
        const payload = await r.json().catch(() => ({}));
        const code = payload && payload.error;
        if (code === 'private_ip') {
          setFormError('Private IPs are not allowed as subscriber endpoints.');
        } else if (code === 'https_required' || code === 'invalid_scheme') {
          setFormError('HTTPS required.');
        } else if (r.status === 409) {
          setFormError('A subscription with this URL already exists.');
        } else {
          setFormError('Could not create. Try again.');
        }
      }
    } catch {
      setFormError('Could not create. Try again.');
    }
    setCreating(false);
  }

  async function onTestFire(sub: Subscription) {
    setTestFiring((prev) => ({ ...prev, [sub.id]: true }));
    try {
      const r = await fetch('/api/webhooks/test-fire', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscription_id: sub.id }),
      });
      setToast(r.ok ? 'Test fired — check the Deliveries tab.' : 'Could not fire test. Try again.');
    } catch {
      setToast('Could not fire test. Try again.');
    }
    setTestFiring((prev) => ({ ...prev, [sub.id]: false }));
    setTimeout(() => setToast(''), 4000);
  }

  function onViewDetail(sub: Subscription) {
    if (typeof window !== 'undefined') {
      window.location.href = `/settings/webhooks/${encodeURIComponent(sub.id)}`;
    }
  }

  const heroDisplay = useMemo(() => {
    if (!metrics) return { total: '—', success: '—', latency: '—', dlq: '—' };
    return {
      total: String(metrics.total_24h),
      success: `${metrics.success_rate.toFixed(1)}%`,
      latency: `${Math.round(metrics.avg_latency_ms)}ms`,
      dlq: String(metrics.dlq_count),
    };
  }, [metrics]);

  return (
    <main className={styles.page}>
      <section className={`c-card ${styles.contentCard}`} aria-labelledby="webhooks-hero-heading">
        <div className={styles.cardHeaderRow}>
          <div>
            <h1 id="webhooks-hero-heading">Webhooks</h1>
            <p className="t-lead">
              Deliver event callbacks to subscribers. HMAC-signed payloads with automatic retry, DLQ, and signing-secret rotation.
            </p>
          </div>
          <button
            type="button"
            className="c-button c-button--primary"
            onClick={openCreateDialog}
          >
            Create subscription
          </button>
        </div>

        {loadingMetrics ? (
          <p>Loading metrics…</p>
        ) : (
          <div className={styles.heroGrid}>
            <div className={`c-card ${styles.heroCard}`}>
              <strong className={styles.heroNumber}>{heroDisplay.total}</strong>
              <span className={styles.heroLabel}>24h deliveries</span>
            </div>
            <div className={`c-card ${styles.heroCard}`}>
              <strong className={styles.heroNumber}>{heroDisplay.success}</strong>
              <span className={styles.heroLabel}>Success rate</span>
            </div>
            <div className={`c-card ${styles.heroCard}`}>
              <strong className={styles.heroNumber}>{heroDisplay.latency}</strong>
              <span className={styles.heroLabel}>Avg latency (p50)</span>
            </div>
            <div className={`c-card ${styles.heroCard}`}>
              <strong className={styles.heroNumber}>{heroDisplay.dlq}</strong>
              <span className={styles.heroLabel}>Dead-letter queue</span>
            </div>
          </div>
        )}
      </section>

      <section className={`c-card ${styles.contentCard}`} aria-labelledby="webhooks-subs-heading">
        <h2 id="webhooks-subs-heading">Subscriptions</h2>
        {loadingSubs ? (
          <p>Loading subscriptions…</p>
        ) : subscriptions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No webhook subscriptions. Create a subscription to receive event notifications.</p>
            <a href="/docs/webhooks" className="c-button c-button--tertiary">Read the webhook setup guide</a>
          </div>
        ) : (
          <table className={styles.subscriptionsTable}>
            <caption>Active webhook subscriptions</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">URL</th>
                <th scope="col">Events</th>
                <th scope="col">Status</th>
                <th scope="col">Last delivery</th>
                <th scope="col">Success rate</th>
                <th scope="col"><span className={styles.visuallyHidden}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const { cls: badgeCls, label: badgeLabel } = subStatusBadge(sub.status_chip);
                const successPct = typeof sub.success_rate === 'number' ? sub.success_rate : 100;
                const firingBusy = !!testFiring[sub.id];
                return (
                  <tr key={sub.id}>
                    <td>
                      <span className="c-chip-protocol">{sub.id}</span>
                    </td>
                    <td>
                      <a
                        href={`/settings/webhooks/${encodeURIComponent(sub.id)}`}
                        className={styles.urlCell}
                        title={sub.url}
                        aria-label={`Open subscription detail for ${sub.url}`}
                        onClick={(e) => { e.preventDefault(); onViewDetail(sub); }}
                      >{sub.url}</a>
                    </td>
                    <td>
                      <div className={styles.chipGroup}>
                        {(sub.events || []).slice(0, 3).map((ev) => (
                          <span key={ev} className="c-chip-protocol">{ev}</span>
                        ))}
                        {(sub.events || []).length > 3 && (
                          <span className="c-chip-protocol">{`+${sub.events.length - 3} more`}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={badgeCls} aria-label={`Circuit breaker: ${sub.status_chip}`}>
                        {badgeLabel}
                      </span>
                    </td>
                    <td>{relativeTime(sub.last_delivery_at)}</td>
                    <td>
                      <div className={styles.successRateCell}>
                        <div className={styles.meterTrack}>
                          <div
                            className={styles.meterFill}
                            role="meter"
                            aria-valuenow={Math.round(successPct * 10)}
                            aria-valuemin={0}
                            aria-valuemax={1000}
                            aria-label="Delivery success rate"
                            data-alert={successPct < 95 ? 'true' : undefined}
                            style={{ width: `${Math.min(100, Math.max(0, successPct))}%` }}
                          />
                        </div>
                        <span>{`${successPct.toFixed(1)}%`}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <a
                          className="c-button c-button--tertiary"
                          href={`/settings/webhooks/${encodeURIComponent(sub.id)}`}
                          onClick={(e) => { e.preventDefault(); onViewDetail(sub); }}
                        >View</a>
                        <button
                          type="button"
                          className="c-button c-button--secondary"
                          onClick={() => onTestFire(sub)}
                          disabled={firingBusy}
                        >{firingBusy ? 'Firing…' : 'Test fire'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <dialog
        ref={createDialogRef}
        className="c-modal"
        aria-labelledby="create-sub-heading"
      >
        <form method="dialog" onSubmit={onSubmitCreate}>
          <h2 id="create-sub-heading">Create webhook subscription</h2>
          <div className={styles.dialogBody}>
            <label className="c-field">
              <span className="c-field__label">Endpoint URL</span>
              <input
                type="url"
                required
                className="c-input"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://subscriber.example.com/webhooks"
              />
              <span className="c-field__help">HTTPS required. Private IPs are rejected.</span>
            </label>
            <label className="c-field">
              <span className="c-field__label">Events to subscribe to</span>
              <input
                type="text"
                className="c-input"
                value={formEvents}
                onChange={(e) => setFormEvents(e.target.value)}
                placeholder="approval.created, campaign.launched"
              />
            </label>
            <label className="c-field">
              <span className="c-field__label">Rate limit override (optional)</span>
              <input
                type="number"
                min={1}
                className="c-input"
                value={formRps}
                onChange={(e) => setFormRps(e.target.value)}
              />
              <span className="c-field__help">Defaults to your plan tier. Cannot exceed the ceiling.</span>
            </label>
            {formError && (
              <p role="alert" className="c-notice c-notice--error">{formError}</p>
            )}
          </div>
          <div className={styles.dialogActions}>
            <button type="button" className="c-button c-button--secondary" onClick={closeCreateDialog}>Cancel</button>
            <button type="submit" className="c-button c-button--primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create subscription'}
            </button>
          </div>
        </form>
      </dialog>

      {toast && (
        <div className="c-toast c-toast--success" role="status" aria-live="polite">{toast}</div>
      )}
    </main>
  );
}
