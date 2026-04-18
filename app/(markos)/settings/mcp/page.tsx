'use client';

// Phase 202 Plan 09: Surface S1 — /settings/mcp dashboard
// IA: at-cap banner (conditional) → usage card (cost meter + top tools) →
//     sessions card (table + revoke CTA) → breakdown <details> →
//     revoke confirm <dialog> → toast region.
// UI-SPEC §Surface 1 locked strings grep-asserted by test/mcp/mcp-settings-ui-a11y.test.js.

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

  return (
    <main className={styles.page}>
      {atCap && usage && (
        <div className={styles.atCapBanner} role="alert">
          <strong>Daily MCP budget reached.</strong>
          <span> Resets at {new Date(usage.reset_at).toLocaleTimeString()}. </span>
          <a href="/settings/billing" className={styles.upgradeLink}>
            Upgrade to increase your cap
          </a>
        </div>
      )}

      <section className={styles.contentCard} aria-labelledby="mcp-usage-heading">
        <div className={styles.cardHeaderRow}>
          <div>
            <h1 id="mcp-usage-heading" className={styles.heading}>
              MCP server
            </h1>
            <p className={styles.subheading}>
              Model Context Protocol access lets agents call MarkOS tools on your behalf. 30 tools. Claude-native by design.
            </p>
          </div>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh MCP usage"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className={styles.budgetRow}>
          <div className={styles.budgetLabel}>Daily budget</div>
          {loadingUsage ? (
            <p className={styles.loadingText}>Loading usage…</p>
          ) : (
            usage && (
              <>
                <div className={styles.costMeterTrack}>
                  <div
                    className={styles.costMeterFill}
                    role="meter"
                    aria-valuenow={usage.spent_cents}
                    aria-valuemin={0}
                    aria-valuemax={usage.cap_cents}
                    aria-label="Daily MCP budget"
                    style={{
                      width: `${Math.min(100, usage.cap_cents > 0 ? (usage.spent_cents / usage.cap_cents) * 100 : 0)}%`,
                    }}
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
            <h2 className={styles.subsectionHeading}>Top tools by cost</h2>
            <ol className={styles.topToolsList}>
              {topTools.map((t) => (
                <li key={t.tool_id}>
                  <button
                    type="button"
                    className={styles.topToolEntry}
                    onClick={() => setFilterTool(t.tool_id)}
                  >
                    <span className={styles.topToolName}>{t.tool_id}</span>
                    <span className={styles.topToolCost}>{formatDollars(t.total_cost_cents)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
        {topTools.length === 0 && !loadingUsage && (
          <p className={styles.emptyState}>No billable tool calls in the last 24 hours.</p>
        )}
      </section>

      <section className={styles.contentCard} aria-labelledby="mcp-sessions-heading">
        <h2 id="mcp-sessions-heading" className={styles.heading}>
          Active MCP sessions
        </h2>
        {loadingSessions ? (
          <p className={styles.loadingText}>Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              <strong>No MCP sessions yet.</strong> Connect from Claude Marketplace or VS Code.
            </p>
            <a href="/docs/vscode-mcp-setup">Read the VS Code setup guide</a>
          </div>
        ) : (
          <table className={styles.sessionsTable}>
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
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.client_id}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                  <td>{new Date(s.last_used_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.revokeButton}
                      onClick={() => setConfirmSession(s)}
                    >
                      Revoke session
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.contentCard} aria-labelledby="mcp-breakdown-heading">
        <details>
          <summary id="mcp-breakdown-heading" className={styles.breakdownSummary}>
            Per-tool cost breakdown
          </summary>
          {filterTool && (
            <div className={styles.filterChip}>
              Showing {filterTool} ·{' '}
              <button
                type="button"
                className={styles.filterClear}
                onClick={() => setFilterTool('')}
              >
                Clear filter
              </button>
            </div>
          )}
          <table className={styles.breakdownTable}>
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
                  <td>{b.tool_id}</td>
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
        className={styles.dialog}
        aria-labelledby="revoke-dialog-heading"
      >
        <h2 id="revoke-dialog-heading" className={styles.dialogHeading}>
          Revoke MCP session?
        </h2>
        <p className={styles.dialogBody}>
          The client will need to re-authorize on next use. Any in-flight tool calls will fail with 401.
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => {
              dialogRef.current?.close();
              setConfirmSession(null);
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteFilledButton}
            onClick={onConfirmRevoke}
            disabled={revoking}
          >
            {revoking ? 'Revoking…' : 'Revoke session'}
          </button>
        </div>
      </dialog>

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
