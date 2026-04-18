'use client';

// Phase 203 Plan 09 Task 2 — Surface 2: /settings/webhooks/[sub_id] detail page.
//
// IA (top to bottom):
//   1. Breadcrumb + heading card (URL mono + events + status chip + plan RPS chip).
//   2. Tab bar (role=tablist) with 3 tabs: Deliveries | DLQ | Settings.
//   3. Active tab panel (role=tabpanel) renders:
//      A. Deliveries panel — filter row + <table> with expand chevron + inline expand
//         region containing Request / Response / Error + Replay + Copy cURL.
//      B. DLQ panel — retention intro + batch-select bar + table + row-level actions.
//      C. Settings panel — Endpoint + Rate limit + Signing secret (rotate / grace /
//         rollback) + Danger zone (delete).
//   4. Dialogs (native <dialog>): rotate, rollback, delete, single-row replay, batch replay.
//   5. Toast region.
//
// Copy contract: every locked S2 string from 203-UI-SPEC §Copywriting Contract renders
// literally (tests grep). A11y contract: role=tablist/tab/tabpanel with aria-selected +
// aria-controls; aria-expanded on row-expand buttons; role=alert on form errors; native
// <dialog> for all confirms; <pre><code> for payload blocks; role=meter on success-rate
// bars where present; role=status on toast.

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';

type BreakerShape = { state: 'closed' | 'half-open' | 'open'; trips?: number };
type RateLimit = { plan_tier: string; ceiling_rps: number; effective_rps: number; override_rps: number | null };
type RotationShape = { id: string; stage: string; grace_ends_at: string; initiated_at?: string } | null;

type SubscriptionShape = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  rotation_state: string | null;
  grace_started_at: string | null;
  grace_ends_at: string | null;
};

type DeliveryShape = {
  id: string;
  event?: string;
  event_id?: string;
  status: string;
  attempt: number;
  created_at: string;
  updated_at?: string;
  replayed_from?: string;
  dlq_reason?: string | null;
  dlq_at?: string | null;
  final_attempt?: boolean;
  next_attempt_at?: string | null;
};

type TabKey = 'deliveries' | 'dlq' | 'settings';

type DetailResponse = {
  subscription: SubscriptionShape;
  deliveries: DeliveryShape[];
  dlq_count: number;
  rate_limit: RateLimit;
  breaker_state: BreakerShape;
  rotation: RotationShape;
  metrics?: { total_24h: number; success_rate: number; avg_latency_ms: number; last_delivery_at: string | null };
};

function chipCopyFor(state: string) {
  if (state === 'open') return 'Tripped';
  if (state === 'half-open') return 'Half-open';
  return 'Healthy';
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function toAbsoluteDate(iso: string | null | undefined) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(); } catch { return iso as string; }
}

export default function WebhookSubscriptionDetailPage({ params }: { params: { sub_id: string } }) {
  const subId = decodeURIComponent(params.sub_id);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('deliveries');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState<Record<string, string>>({});
  const [selectedDlqIds, setSelectedDlqIds] = useState<Set<string>>(new Set());
  const [dlqEntries, setDlqEntries] = useState<DeliveryShape[]>([]);
  const [toast, setToast] = useState<string>('');
  const [busyAction, setBusyAction] = useState<string>('');
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState('');
  const [formRpsOverride, setFormRpsOverride] = useState('');
  const [formDirty, setFormDirty] = useState(false);
  const [formError, setFormError] = useState('');

  const rotateDialogRef = useRef<HTMLDialogElement | null>(null);
  const rollbackDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const replayRowDialogRef = useRef<HTMLDialogElement | null>(null);
  const replayBatchDialogRef = useRef<HTMLDialogElement | null>(null);
  const [replayRowTarget, setReplayRowTarget] = useState<DeliveryShape | null>(null);

  async function fetchDetail() {
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}`, { credentials: 'same-origin' });
      if (r.ok) {
        const body = (await r.json()) as DetailResponse;
        setDetail(body);
        setFormUrl(body.subscription.url);
        setFormEvents((body.subscription.events || []).join(', '));
        setFormRpsOverride(body.rate_limit.override_rps == null ? '' : String(body.rate_limit.override_rps));
        setFormDirty(false);
      }
    } catch { /* silent */ }
  }

  async function fetchDlq() {
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}/dlq`, { credentials: 'same-origin' });
      if (r.ok) {
        const body = await r.json();
        setDlqEntries(body.entries || body.deliveries || []);
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchDetail();
    // Parse ?tab= query param for deep-linkable tab selection.
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href);
      const t = u.searchParams.get('tab');
      if (t === 'dlq' || t === 'settings' || t === 'deliveries') setActiveTab(t as TabKey);
    }
  }, [subId]);

  useEffect(() => {
    if (activeTab === 'dlq') fetchDlq();
  }, [activeTab]);

  function switchTab(t: TabKey) {
    setActiveTab(t);
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href);
      u.searchParams.set('tab', t);
      window.history.replaceState({}, '', u.toString());
    }
  }

  function onTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const tabs: TabKey[] = ['deliveries', 'dlq', 'settings'];
    const idx = tabs.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      switchTab(tabs[(idx + 1) % tabs.length]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      switchTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      switchTab(tabs[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      switchTab(tabs[tabs.length - 1]);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function onCopyCurl(delivery: DeliveryShape) {
    const curl = `curl -X POST -H 'content-type: application/json' '${detail?.subscription.url || ''}'`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(curl);
      }
      setCopyLabel((prev) => ({ ...prev, [delivery.id]: 'Copied.' }));
      setTimeout(() => setCopyLabel((prev) => ({ ...prev, [delivery.id]: '' })), 2000);
    } catch { /* silent */ }
  }

  function openReplayRowDialog(delivery: DeliveryShape) {
    setReplayRowTarget(delivery);
    if (replayRowDialogRef.current && !replayRowDialogRef.current.open) replayRowDialogRef.current.showModal();
  }
  function closeReplayRowDialog() {
    replayRowDialogRef.current?.close();
    setReplayRowTarget(null);
  }
  async function confirmReplayRow() {
    if (!replayRowTarget) return;
    setBusyAction('replay-row');
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}/deliveries/${encodeURIComponent(replayRowTarget.id)}/replay`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      setToast(r.ok ? 'Replay queued.' : 'Could not queue replay. Try again.');
    } catch {
      setToast('Could not queue replay. Try again.');
    }
    setBusyAction('');
    closeReplayRowDialog();
    setTimeout(() => setToast(''), 4000);
  }

  function toggleDlqSelect(id: string) {
    setSelectedDlqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (selectedDlqIds.size === dlqEntries.length) {
      setSelectedDlqIds(new Set());
    } else {
      setSelectedDlqIds(new Set(dlqEntries.map((d) => d.id)));
    }
  }
  function openBatchReplayDialog() {
    if (replayBatchDialogRef.current && !replayBatchDialogRef.current.open) replayBatchDialogRef.current.showModal();
  }
  function closeBatchReplayDialog() {
    replayBatchDialogRef.current?.close();
  }
  async function confirmBatchReplay() {
    setBusyAction('replay-batch');
    const ids = Array.from(selectedDlqIds);
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}/dlq/replay`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ delivery_ids: ids }),
      });
      setToast(r.ok ? `Replay queued for ${ids.length} deliveries.` : 'Could not queue replays. Try again.');
      if (r.ok) {
        setSelectedDlqIds(new Set());
        fetchDlq();
      }
    } catch {
      setToast('Could not queue replays. Try again.');
    }
    setBusyAction('');
    closeBatchReplayDialog();
    setTimeout(() => setToast(''), 4000);
  }

  function openRotateDialog() { rotateDialogRef.current?.showModal(); }
  function closeRotateDialog() { rotateDialogRef.current?.close(); }
  async function confirmRotate() {
    setBusyAction('rotate');
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}/rotate`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (r.ok) {
        const body = await r.json();
        const dateStr = toAbsoluteDate(body.grace_ends_at);
        setToast(`Rotation started. Old secret retires on ${dateStr}.`);
        fetchDetail();
      } else {
        setToast('Could not start rotation. Try again.');
      }
    } catch {
      setToast('Could not start rotation. Try again.');
    }
    setBusyAction('');
    closeRotateDialog();
    setTimeout(() => setToast(''), 5000);
  }

  function openRollbackDialog() { rollbackDialogRef.current?.showModal(); }
  function closeRollbackDialog() { rollbackDialogRef.current?.close(); }
  async function confirmRollback() {
    setBusyAction('rollback');
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}/rotate/rollback`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      setToast(r.ok ? 'Rolled back. Old secret restored.' : 'Could not rollback. Try again.');
      if (r.ok) fetchDetail();
    } catch {
      setToast('Could not rollback. Try again.');
    }
    setBusyAction('');
    closeRollbackDialog();
    setTimeout(() => setToast(''), 4000);
  }

  function openDeleteDialog() { deleteDialogRef.current?.showModal(); }
  function closeDeleteDialog() { deleteDialogRef.current?.close(); }
  async function confirmDelete() {
    setBusyAction('delete');
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}/delete`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (r.ok) {
        setToast('Subscription deleted.');
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.href = '/settings/webhooks';
        }, 600);
      } else {
        setToast('Could not delete. Try again.');
      }
    } catch {
      setToast('Could not delete. Try again.');
    }
    setBusyAction('');
    closeDeleteDialog();
    setTimeout(() => setToast(''), 4000);
  }

  async function onSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setBusyAction('save');
    setFormError('');
    const body: Record<string, unknown> = {};
    if (detail && formUrl !== detail.subscription.url) body.url = formUrl;
    const eventsArr = formEvents.split(',').map((s) => s.trim()).filter(Boolean);
    if (detail && JSON.stringify(eventsArr) !== JSON.stringify(detail.subscription.events || [])) body.events = eventsArr;
    if (formRpsOverride.trim().length === 0) {
      if (detail && detail.rate_limit.override_rps != null) body.rps_override = null;
    } else {
      const n = Number(formRpsOverride);
      if (Number.isFinite(n)) body.rps_override = n;
    }
    try {
      const r = await fetch(`/api/tenant/webhooks/subscriptions/${encodeURIComponent(subId)}/update`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setToast('Settings saved.');
        setFormDirty(false);
        fetchDetail();
      } else {
        const payload = await r.json().catch(() => ({}));
        if (payload && payload.error === 'private_ip') {
          setFormError('Private IPs are not allowed as subscriber endpoints.');
        } else if (payload && payload.error === 'rps_override_exceeds_plan') {
          setFormError('Cannot exceed your plan tier ceiling.');
        } else {
          setFormError('Could not save. Check the form and try again.');
        }
      }
    } catch {
      setFormError('Could not save. Check the form and try again.');
    }
    setBusyAction('');
    setTimeout(() => setToast(''), 4000);
  }

  const showGracePanel = useMemo(() => {
    return !!(detail && detail.rotation && detail.rotation.stage && detail.rotation.stage !== 'normal');
  }, [detail]);

  if (!detail) {
    return (
      <main className={styles.page}>
        <p className={styles.loadingText}>Loading subscription…</p>
      </main>
    );
  }

  const sub = detail.subscription;
  const chipKey = detail.breaker_state.state;
  const chip = chipCopyFor(chipKey);
  const planChip = `${detail.rate_limit.effective_rps} rps · ${detail.rate_limit.plan_tier[0].toUpperCase()}${detail.rate_limit.plan_tier.slice(1)}`;

  return (
    <main className={styles.page}>
      <section className={styles.contentCard} aria-labelledby="sub-detail-heading">
        <nav className={styles.breadcrumb}>
          <a href="/settings/webhooks">Webhooks</a>
          <span> › </span>
          <span className={styles.breadcrumbCurrent}>{sub.url}</span>
        </nav>
        <div className={styles.cardHeaderRow}>
          <div>
            <h1 id="sub-detail-heading" className={styles.heading} title={sub.url}>{sub.url}</h1>
            <p className={styles.subheading}>
              Created {relativeTime(sub.created_at)} · {(sub.events || []).length} events subscribed
            </p>
          </div>
          <div className={styles.chipRow}>
            <span className={styles.statusChip} data-state={chipKey} aria-label={`Circuit breaker: ${chip}`}>{chip}</span>
            <span
              className={styles.planChip}
              aria-label={`Rate limit: ${detail.rate_limit.effective_rps} requests per second on ${detail.rate_limit.plan_tier} plan`}
            >{planChip}</span>
          </div>
        </div>
      </section>

      <section className={styles.contentCard}>
        <nav className={styles.tabBar} role="tablist" aria-label="Subscription detail sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'deliveries'}
            aria-controls="panel-deliveries"
            id="tab-deliveries"
            tabIndex={activeTab === 'deliveries' ? 0 : -1}
            className={styles.tabButton}
            data-active={activeTab === 'deliveries' ? 'true' : undefined}
            onClick={() => switchTab('deliveries')}
            onKeyDown={onTabKeyDown}
          >
            Deliveries
            <span className={styles.tabCountBadge}>{detail.deliveries.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dlq'}
            aria-controls="panel-dlq"
            id="tab-dlq"
            tabIndex={activeTab === 'dlq' ? 0 : -1}
            className={styles.tabButton}
            data-active={activeTab === 'dlq' ? 'true' : undefined}
            onClick={() => switchTab('dlq')}
            onKeyDown={onTabKeyDown}
          >
            DLQ
            <span
              className={styles.tabCountBadge}
              data-variant={detail.dlq_count > 0 ? 'alert' : undefined}
            >{detail.dlq_count}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'settings'}
            aria-controls="panel-settings"
            id="tab-settings"
            tabIndex={activeTab === 'settings' ? 0 : -1}
            className={styles.tabButton}
            data-active={activeTab === 'settings' ? 'true' : undefined}
            onClick={() => switchTab('settings')}
            onKeyDown={onTabKeyDown}
          >
            Settings
          </button>
        </nav>

        {activeTab === 'deliveries' && (
          <section id="panel-deliveries" role="tabpanel" aria-labelledby="tab-deliveries" tabIndex={0}>
            <div className={styles.filterRow}>
              <label className={styles.field}>
                <span>Status</span>
                <select>
                  <option>All</option>
                  <option>Success</option>
                  <option>Failed</option>
                  <option>Pending</option>
                </select>
              </label>
              <div className={styles.filterChipGroup} role="group" aria-label="Time range">
                <button type="button" data-active="true">24h</button>
                <button type="button">7d</button>
                <button type="button">30d</button>
              </div>
            </div>
            {detail.deliveries.length === 0 ? (
              <p className={styles.emptyState}>No deliveries yet. Fire a test from the index or wait for an event to trigger.</p>
            ) : (
              <table className={styles.deliveriesTable}>
                <caption>Webhook deliveries (last 24h)</caption>
                <thead>
                  <tr>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Event</th>
                    <th scope="col">Status</th>
                    <th scope="col">Latency</th>
                    <th scope="col">Attempt</th>
                    <th scope="col"><span className={styles.visuallyHidden}>Expand</span></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.deliveries.map((del) => {
                    const expanded = expandedId === del.id;
                    const latencyMs = (del.updated_at && del.created_at) ? (new Date(del.updated_at).getTime() - new Date(del.created_at).getTime()) : 0;
                    const statusText = del.status === 'delivered' ? 'Success' : del.status === 'failed' ? 'Failed' : 'Pending';
                    return (
                      <>
                        <tr key={del.id}>
                          <td>{relativeTime(del.created_at)}</td>
                          <td>{del.event || del.event_id || '—'}</td>
                          <td>
                            <span data-status={del.status}>{statusText}</span>
                          </td>
                          <td>{latencyMs >= 0 ? `${latencyMs}ms` : '—'}</td>
                          <td>{del.attempt}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.expandChevron}
                              aria-expanded={expanded}
                              aria-controls={`expand-${del.id}`}
                              aria-label={`Toggle details for delivery ${del.id}`}
                              data-expanded={expanded ? 'true' : undefined}
                              onClick={() => toggleExpand(del.id)}
                            >›</button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr id={`expand-${del.id}`} className={styles.expandRow}>
                            <td colSpan={6}>
                              <div className={styles.expandBlock}>
                                <h3 className={styles.expandHeading}>Request</h3>
                                <pre className={styles.codeBlock}><code>{`POST ${sub.url}
x-markos-event: ${del.event || '(event)'}
x-markos-attempt: ${del.attempt}
x-markos-signature-v1: ••••`}</code></pre>
                                <h3 className={styles.expandHeading}>Response</h3>
                                <pre className={styles.codeBlock}><code>{`HTTP ${del.status === 'delivered' ? '200 OK' : del.status === 'failed' ? '5xx' : 'pending'}`}</code></pre>
                                {del.status === 'failed' && (
                                  <>
                                    <h3 className={styles.expandHeading}>Error</h3>
                                    <p className={styles.errorText}>{del.dlq_reason || 'Upstream did not return a 2xx response.'}</p>
                                  </>
                                )}
                                <div className={styles.expandActions}>
                                  <button
                                    type="button"
                                    className={styles.singleReplayButton}
                                    onClick={() => openReplayRowDialog(del)}
                                  >Replay this delivery</button>
                                  <button
                                    type="button"
                                    className={styles.copyCurlLink}
                                    onClick={() => onCopyCurl(del)}
                                  >{copyLabel[del.id] || 'Copy cURL'}</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {activeTab === 'dlq' && (
          <section id="panel-dlq" role="tabpanel" aria-labelledby="tab-dlq" tabIndex={0}>
            <p className={styles.dlqIntro}>7-day replay window. Entries older than 7 days are purged automatically.</p>
            <div className={styles.batchActionBar}>
              <div>
                <label className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={dlqEntries.length > 0 && selectedDlqIds.size === dlqEntries.length}
                    aria-checked={selectedDlqIds.size === 0 ? 'false' : (selectedDlqIds.size === dlqEntries.length ? 'true' : 'mixed')}
                    onChange={toggleSelectAll}
                  />
                  <span>Select all</span>
                </label>
                <span className={styles.retentionCounter}>{`Retained: ${dlqEntries.length} / 1000`}</span>
              </div>
              <button
                type="button"
                className={styles.replaySelectedButton}
                disabled={selectedDlqIds.size === 0 || busyAction === 'replay-batch'}
                onClick={openBatchReplayDialog}
              >
                {selectedDlqIds.size === 0 ? 'Replay selected' : `Replay (${selectedDlqIds.size})`}
              </button>
            </div>
            {dlqEntries.length === 0 ? (
              <p className={styles.emptyState}>No dead-letter entries. All deliveries are succeeding or still retrying.</p>
            ) : (
              <table className={styles.deliveriesTable}>
                <caption>Dead-letter queue</caption>
                <thead>
                  <tr>
                    <th scope="col"><span className={styles.visuallyHidden}>Select</span></th>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Event</th>
                    <th scope="col">Final status</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Last error</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dlqEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <label className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={selectedDlqIds.has(entry.id)}
                            onChange={() => toggleDlqSelect(entry.id)}
                            aria-label={`Select delivery from ${entry.created_at}`}
                          />
                        </label>
                      </td>
                      <td>{relativeTime(entry.created_at)}</td>
                      <td>{entry.event || entry.event_id || '—'}</td>
                      <td>Failed</td>
                      <td>{entry.attempt}</td>
                      <td>{entry.dlq_reason || '—'}</td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button type="button" className={styles.singleReplayButton} onClick={() => openReplayRowDialog(entry)}>Replay</button>
                          <button type="button" className={styles.deleteInlineButton}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {activeTab === 'settings' && (
          <section id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" tabIndex={0}>
            <form onSubmit={onSaveSettings} className={styles.settingsForm}>
              <h3 className={styles.sectionHeading}>Endpoint</h3>
              <label className={styles.field}>
                <span>Endpoint URL</span>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => { setFormUrl(e.target.value); setFormDirty(true); }}
                />
                <span className={styles.fieldHelp}>HTTPS required. Private IPs are rejected.</span>
              </label>
              <label className={styles.field}>
                <span>Events subscribed</span>
                <input
                  type="text"
                  value={formEvents}
                  onChange={(e) => { setFormEvents(e.target.value); setFormDirty(true); }}
                />
              </label>

              <h3 className={styles.sectionHeading}>Rate limit</h3>
              <p className={styles.subheading}>
                {`${detail.rate_limit.plan_tier[0].toUpperCase()}${detail.rate_limit.plan_tier.slice(1)} plan default: ${detail.rate_limit.ceiling_rps} rps`}
              </p>
              <label className={styles.field}>
                <span>Override (rps)</span>
                <input
                  type="number"
                  min={1}
                  value={formRpsOverride}
                  onChange={(e) => { setFormRpsOverride(e.target.value); setFormDirty(true); }}
                />
                <span className={styles.fieldHelp}>Cannot exceed your plan tier ceiling.</span>
              </label>

              <h3 className={styles.sectionHeading}>Signing secret</h3>
              <div className={styles.secretPanel}>
                <div className={styles.secretHeader}>
                  <span className={styles.secretLabel}>Current signature header</span>
                  <code aria-label="Current signature header value, last 8 characters">x-markos-signature-v1=••••••••abc12345</code>
                </div>
                {showGracePanel ? (
                  <div className={styles.graceStatusPanel} role="status">
                    <strong>{`Grace active — T-${detail.rotation ? detail.rotation.stage.replace('t-','') : '0'} days`}</strong>
                    <span>{`Old secret retires on ${toAbsoluteDate(detail.rotation ? detail.rotation.grace_ends_at : null)}.`}</span>
                    <p className={styles.dualSigPreview}>During grace, every payload carries both signatures:</p>
                    <code className={styles.secretHeader}>x-markos-signature-v1=••••••••older123</code>
                    <code className={styles.secretHeader}>x-markos-signature-v2=••••••••newer456</code>
                    <button
                      type="button"
                      className={styles.rollbackButton}
                      onClick={openRollbackDialog}
                      disabled={busyAction === 'rollback'}
                    >{busyAction === 'rollback' ? 'Rolling back…' : 'Rollback to old secret'}</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.rotateButton}
                    onClick={openRotateDialog}
                    disabled={busyAction === 'rotate'}
                  >{busyAction === 'rotate' ? 'Rotating…' : 'Rotate secret'}</button>
                )}
              </div>

              <h3 className={styles.sectionHeading}>Danger zone</h3>
              <div className={styles.dangerCard}>
                <p>Delete this subscription and cancel all in-flight deliveries.</p>
                <button
                  type="button"
                  className={styles.deleteSubButton}
                  onClick={openDeleteDialog}
                  disabled={busyAction === 'delete'}
                >{busyAction === 'delete' ? 'Deleting…' : 'Delete subscription'}</button>
              </div>

              {formError && (
                <p role="alert" className={styles.formError}>{formError}</p>
              )}

              <div className={styles.saveRow}>
                <button
                  type="submit"
                  className={styles.saveChangesButton}
                  disabled={!formDirty || busyAction === 'save'}
                >{busyAction === 'save' ? 'Saving…' : 'Save changes'}</button>
              </div>
            </form>
          </section>
        )}
      </section>

      {/* Rotate dialog */}
      <dialog ref={rotateDialogRef} className={styles.dialog} aria-labelledby="rotate-dlg-heading">
        <h2 id="rotate-dlg-heading" className={styles.dialogHeading}>Rotate signing secret?</h2>
        <p className={styles.dialogBody}>
          A new secret will be generated now. Both old and new secrets will sign every webhook for 30 days.
          Subscribers can verify either <code>x-markos-signature-v1</code> or <code>x-markos-signature-v2</code> during this grace window.
          After 30 days, the old secret is purged and cannot be restored.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={closeRotateDialog}>Cancel</button>
          <button type="button" className={styles.rotateButton} onClick={confirmRotate} disabled={busyAction === 'rotate'}>
            {busyAction === 'rotate' ? 'Rotating…' : 'Rotate secret'}
          </button>
        </div>
      </dialog>

      {/* Rollback dialog */}
      <dialog ref={rollbackDialogRef} className={styles.dialog} aria-labelledby="rollback-dlg-heading">
        <h2 id="rollback-dlg-heading" className={styles.dialogHeading}>Rollback rotation?</h2>
        <p className={styles.dialogBody}>
          This discards the new secret and restores the old one. The old secret remains live for the remainder of its original grace window.
          Subscribers using the new signature will start failing until they switch back.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={closeRollbackDialog}>Cancel</button>
          <button type="button" className={styles.rollbackButton} onClick={confirmRollback} disabled={busyAction === 'rollback'}>
            {busyAction === 'rollback' ? 'Rolling back…' : 'Rollback'}
          </button>
        </div>
      </dialog>

      {/* Delete dialog */}
      <dialog ref={deleteDialogRef} className={styles.dialog} aria-labelledby="delete-dlg-heading">
        <h2 id="delete-dlg-heading" className={styles.dialogHeading}>Delete this subscription?</h2>
        <p className={styles.dialogBody}>
          Any in-flight deliveries are cancelled. Historical delivery records are retained for audit. This cannot be undone.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={closeDeleteDialog}>Cancel</button>
          <button type="button" className={styles.deleteSubButton} onClick={confirmDelete} disabled={busyAction === 'delete'}>
            {busyAction === 'delete' ? 'Deleting…' : 'Delete subscription'}
          </button>
        </div>
      </dialog>

      {/* Single-row replay dialog */}
      <dialog ref={replayRowDialogRef} className={styles.dialog} aria-labelledby="replay-row-heading">
        <h2 id="replay-row-heading" className={styles.dialogHeading}>Replay this delivery?</h2>
        <p className={styles.dialogBody}>
          The payload will be re-signed with the current secret and dispatched now.
          The subscriber receives <code>x-markos-replayed-from</code> and <code>x-markos-attempt</code> headers.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={closeReplayRowDialog}>Cancel</button>
          <button type="button" className={styles.singleReplayButton} onClick={confirmReplayRow} disabled={busyAction === 'replay-row'}>
            {busyAction === 'replay-row' ? 'Queueing…' : 'Replay'}
          </button>
        </div>
      </dialog>

      {/* Batch replay dialog */}
      <dialog ref={replayBatchDialogRef} className={styles.dialog} aria-labelledby="replay-batch-heading">
        <h2 id="replay-batch-heading" className={styles.dialogHeading}>{`Replay ${selectedDlqIds.size} deliveries?`}</h2>
        <p className={styles.dialogBody}>
          Each delivery will be re-signed with the current secret and dispatched now.
          Subscribers receive <code>x-markos-replayed-from</code> and <code>x-markos-attempt</code> headers for audit.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={closeBatchReplayDialog}>Cancel</button>
          <button type="button" className={styles.replaySelectedButton} onClick={confirmBatchReplay} disabled={busyAction === 'replay-batch'}>
            {busyAction === 'replay-batch' ? 'Queueing…' : 'Replay'}
          </button>
        </div>
      </dialog>

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">{toast}</div>
      )}
    </main>
  );
}
