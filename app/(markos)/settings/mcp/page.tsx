'use client';

// Phase 213.3 Plan 06: /settings/mcp — token-canon surface redesign (UI-SPEC Surface 6).
// Phase 200 + 200.1 MCP wiring (API routes, cost-kill-switch threshold, OTEL trace fields) preserved verbatim.
// IA: cost-state notices (MC-3) → usage card (.c-card, cost meter, .c-chip-protocol top tools) →
//     sessions card (table + revoke CTA) → breakdown <details> →
//     revoke confirm (.c-modal + .c-backdrop) → toast region.

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';

type Usage = {
  tenant_id: string;
  spent_cents: number;
  cap_cents: number;
  plan_tier: string;
  reset_at: string;
  window_start: string;
};
type Session = {
  id: string;
  client_id: string;
  scopes: string[];
  created_at: string;
  last_used_at: string;
  expires_at: string;
};
type BreakdownRow = { tool_id: string; calls: number; total_cost_cents: number };

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatResetDuration(reset_at: string) {
  const ms = new Date(reset_at).getTime() - Date.now();
  if (ms <= 0) return 'now';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function meterFillClass(pct: number, s: typeof styles) {
  if (pct >= 90) return `${s.meterFill} ${s['meterFill--error']}`;
  if (pct >= 70) return `${s.meterFill} ${s['meterFill--warning']}`;
  return s.meterFill;
}

export default function McpSettingsPage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [toast, setToast] = useState<string>('');
  const [confirmSession, setConfirmSession] = useState<Session | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTool, setFilterTool] = useState<string>('');
  const [keyRotationInProgress, setKeyRotationInProgress] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  async function fetchUsage() {
    const r = await fetch('/api/tenant/mcp/usage', { credentials: 'same-origin' });
    if (r.ok) setUsage(await r.json());
    setLoadingUsage(false);
  }
  async function fetchSessions() {
    const r = await fetch('/api/tenant/mcp/sessions', { credentials: 'same-origin' });
    if (r.ok) setSessions((await r.json()).sessions || []);
    setLoadingSessions(false);
  }
  async function fetchBreakdown() {
    const r = await fetch('/api/tenant/mcp/cost-breakdown', { credentials: 'same-origin' });
    if (r.ok) setBreakdown((await r.json()).by_tool || []);
  }

  useEffect(() => {
    fetchUsage();
    fetchSessions();
    fetchBreakdown();
    const t = setInterval(() => {
      fetchUsage();
      fetchSessions();
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (confirmSession && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [confirmSession]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchUsage(), fetchSessions()]);
    setRefreshing(false);
    setToast('Refreshed.');
    setTimeout(() => setToast(''), 4000);
  }

  async function onConfirmRevoke() {
    if (!confirmSession) return;
    setRevoking(true);
    const r = await fetch('/api/tenant/mcp/sessions/revoke', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ session_id: confirmSession.id }),
    });
    setRevoking(false);
    if (dialogRef.current) dialogRef.current.close();
    setConfirmSession(null);
    if (r.ok) {
      setToast('Session revoked.');
      await fetchSessions();
    } else {
      setToast('Could not revoke. Try again.');
    }
    setTimeout(() => setToast(''), 4000);
  }

  const atCap = usage ? usage.spent_cents >= usage.cap_cents : false;
  const resetDuration = usage ? formatResetDuration(usage.reset_at) : '';
  const topTools = useMemo(() => breakdown.slice(0, 3), [breakdown]);
  const filteredBreakdown = useMemo(
    () => (filterTool ? breakdown.filter((b) => b.tool_id === filterTool) : breakdown),
    [breakdown, filterTool],
  );

  const costPct = usage && usage.cap_cents > 0
    ? Math.min(100, (usage.spent_cents / usage.cap_cents) * 100)
    : 0;

  return (
    <main className={styles.page}>

      {/* MC-3: Cost-state notices — error (>=100%) > warning (>=70%) > key-rotation (info) */}
      {atCap && usage && (
        <div className="c-notice c-notice--error" role="status">
          <strong>[err]</strong>{' '}Cost limit reached. MCP tools are paused. Adjust the budget to resume.
        </div>
      )}
      {!atCap && costPct >= 70 && (
        <div className="c-notice c-notice--warning" role="status">
          <strong>[warn]</strong>{' '}Cost approaching limit. Review tool usage to avoid service interruption.
        </div>
      )}
      {keyRotationInProgress && (
        <div className="c-notice c-notice--info" role="status">
          <strong>[info]</strong>{' '}Key rotation in progress. The previous key remains valid for 24 hours.
        </div>
      )}

      {/* At-cap banner preserved per Phase 200 wiring (role=alert for live region) */}
      {atCap && usage && (
        <div className="c-notice c-notice--error" role="alert">
          <strong>Daily MCP budget reached.</strong>
          <span> Resets at {new Date(usage.reset_at).toLocaleTimeString()}. </span>
          <a href="/settings/billing">
            Upgrade to increase your cap
          </a>
        </div>
      )}

      <section className={`c-card ${styles.contentCard}`} aria-labelledby="mcp-usage-heading">
        <div className={styles.cardHeaderRow}>
          <div>
            <h1 id="mcp-usage-heading">
              MCP server
            </h1>
            <p className="t-lead">
              Model Context Protocol access lets agents call MarkOS tools on your behalf. 30 tools. Claude-native by design.
            </p>
          </div>
          <div className={styles.actionRow}>
            <button
              type="button"
              className="c-button c-button--primary"
              aria-label="Add MCP server"
            >
              Add server
            </button>
            <button
              type="button"
              className="c-button c-button--secondary"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh MCP usage"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className={styles.meterGroup}>
          <span className="t-label-caps">Daily budget</span>
          {loadingUsage ? (
            <p>Loading usage…</p>
          ) : (
            usage && (
              <>
                <div className={styles.meterTrack}>
                  <div
                    className={meterFillClass(costPct, styles)}
                    role="meter"
                    aria-valuenow={usage.spent_cents}
                    aria-valuemin={0}
                    aria-valuemax={usage.cap_cents}
                    aria-label="Daily MCP budget"
                    style={{ width: `${costPct}%` }}
                  />
                </div>
                <div className={styles.budgetValueRow}>
                  <span>
                    {formatDollars(usage.spent_cents)} of {formatDollars(usage.cap_cents)} used
                  </span>
                  <span className={styles.resetTimer}>Resets in {resetDuration}</span>
                </div>
              </>
            )
          )}
        </div>

        {topTools.length > 0 && (
          <div className={styles.topTools}>
            <h2>Top tools by cost</h2>
            <ol className={styles.topToolsList}>
              {topTools.map((t) => (
                <li key={t.tool_id} className={styles.topToolsItem}>
                  <span className="c-chip-protocol">{t.tool_id}</span>
                  <span>{formatDollars(t.total_cost_cents)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {topTools.length === 0 && !loadingUsage && (
          <p className={styles.emptyState}>No billable tool calls in the last 24 hours.</p>
        )}

        {/* API key display — MC-4: .c-chip-protocol prefix + .c-code-inline masked value + .c-button--icon clipboard */}
        <h4>API keys</h4>
        <div className={styles.keyRow}>
          <span className="c-chip-protocol">mk_xxx</span>
          <code className="c-code-inline">mk_xxx_•••1234</code>
          <button
            type="button"
            className="c-button c-button--icon"
            aria-label="Copy to clipboard"
            onClick={() => {
              navigator.clipboard?.writeText('mk_xxx_•••1234').then(() => {
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              });
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
              <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {copiedKey && <span>[ok] Copied</span>}
        </div>
        <div className={styles.actionRow}>
          <button type="button" className="c-button c-button--secondary"
            onClick={() => setKeyRotationInProgress(true)}
          >
            Rotate key
          </button>
        </div>
      </section>

      <section className={`c-card ${styles.contentCard}`} aria-labelledby="mcp-sessions-heading">
        <h2 id="mcp-sessions-heading">
          Active MCP sessions
        </h2>
        {loadingSessions ? (
          <p>Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              <strong>No MCP sessions yet.</strong> Connect from Claude Marketplace or VS Code.
            </p>
            <a href="/docs/vscode-mcp-setup">Read the VS Code setup guide</a>
          </div>
        ) : (
          <table>
            <caption>Active MCP sessions</caption>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Created</th>
                <th scope="col">Last seen</th>
                <th scope="col">
                  <span className={styles.visuallyHidden}>Revoke</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const isExpired = new Date(s.expires_at).getTime() < Date.now();
                const statusDotClass = isExpired
                  ? 'c-status-dot c-status-dot--error'
                  : 'c-status-dot c-status-dot--live';
                const statusLabel = isExpired ? '[err] Error' : '[ok] Connected';
                return (
                <tr key={s.id}>
                  <td>
                    <div className={styles.statusCell}>
                      <span className={statusDotClass} aria-hidden="true" />
                      <span className="c-chip-protocol">{s.client_id}</span>
                      <span>{statusLabel}</span>
                    </div>
                  </td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                  <td>{new Date(s.last_used_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="c-button c-button--secondary"
                      onClick={() => setConfirmSession(s)}
                    >
                      Revoke session
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className={`c-card ${styles.contentCard}`} aria-labelledby="mcp-breakdown-heading">
        <details>
          <summary id="mcp-breakdown-heading" className={styles.breakdownSummary}>
            Per-tool cost breakdown
          </summary>
          {filterTool && (
            <div className={styles.filterChipRow}>
              <span className="c-chip-protocol">{filterTool}</span>
              <button
                type="button"
                className="c-button c-button--secondary"
                onClick={() => setFilterTool('')}
              >
                Clear filter
              </button>
            </div>
          )}
          <table>
            <caption>MCP tool cost breakdown (last 24h)</caption>
            <thead>
              <tr>
                <th scope="col">Tool</th>
                <th scope="col">Calls</th>
                <th scope="col">Total cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredBreakdown.map((b) => (
                <tr key={b.tool_id}>
                  <td>
                    <button
                      type="button"
                      className="c-button c-button--secondary"
                      onClick={() => setFilterTool(b.tool_id)}
                    >
                      <span className="c-chip-protocol">{b.tool_id}</span>
                    </button>
                  </td>
                  <td>{b.calls}</td>
                  <td>{formatDollars(b.total_cost_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <dialog
        ref={dialogRef}
        className="c-modal"
        aria-labelledby="revoke-dialog-heading"
      >
        <h2 id="revoke-dialog-heading" className="c-modal__header">
          Revoke MCP session?
        </h2>
        <p className="c-modal__body">
          The client will need to re-authorize on next use. Any in-flight tool calls will fail with 401.
        </p>
        <div className={`c-modal__actions ${styles.dialogActions}`}>
          <button
            type="button"
            className="c-button c-button--secondary"
            onClick={() => {
              dialogRef.current?.close();
              setConfirmSession(null);
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="c-button c-button--destructive"
            onClick={onConfirmRevoke}
            disabled={revoking}
          >
            {revoking ? 'Revoking…' : 'Revoke session'}
          </button>
        </div>
      </dialog>

      {toast && (
        <div className={styles.toastRegion}>
          <div className="c-toast" role="status" aria-live="polite">
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
