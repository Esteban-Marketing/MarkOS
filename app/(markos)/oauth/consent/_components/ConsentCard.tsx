'use client';

// Phase 213.2 Plan-04 — Presentational ConsentCard subcomponent.
// Extracted from app/(markos)/oauth/consent/page.tsx per RESEARCH.md R-4
// (6+ useState impedance for Storybook authoring). Composes DESIGN.md primitives:
// .c-card c-card--feature, .c-button c-button--primary, .c-button c-button--destructive,
// .c-chip-protocol (squared, NOT pill), .c-code-inline, .c-field__help, .t-lead.
// All a11y markers + DOM shape preserved from Phase 202 contract.

import styles from '../page.module.css';

export type Tenant = { id: string; name: string; slug: string; org_id: string; status?: string };

export type ConsentCardProps = {
  clientName: string;
  redirectUri: string;
  scopeList: string[];
  tenants: Tenant[];
  selectedTenantId: string;
  submitState: 'idle' | 'approving' | 'denying';
  invalidReason: string | null;
  loading: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onTenantSelect: (id: string) => void;
};

export default function ConsentCard({
  clientName,
  redirectUri,
  scopeList,
  tenants,
  selectedTenantId,
  submitState,
  invalidReason,
  loading,
  onApprove,
  onDeny,
  onTenantSelect,
}: ConsentCardProps) {
  if (invalidReason) {
    return (
      <div className={`c-card ${styles.errorAlert}`} role="alert">
        {invalidReason}
      </div>
    );
  }
  if (loading) {
    return <div className={`c-card c-card--feature ${styles.contentCard}`}>Loading…</div>;
  }

  const multiTenant = tenants.length > 1;
  const isApproving = submitState === 'approving';
  const isDenying = submitState === 'denying';
  const approveDisabled = submitState !== 'idle' || (!selectedTenantId && tenants.length > 1);
  const helperVisible = approveDisabled && multiTenant;

  let approveLabel = 'Approve access';
  if (isApproving) approveLabel = 'Approving…';

  let denyLabel = 'Deny';
  if (isDenying) denyLabel = 'Denying…';

  return (
    <section
      className={`c-card c-card--feature ${styles.contentCard}`}
      aria-labelledby="consent-heading"
    >
      <h1 id="consent-heading" tabIndex={-1}>
        Authorize {clientName}
      </h1>

      <div className={styles.clientRow} id="client-row-desc">
        <div className={styles.clientLogo} aria-hidden="true">
          MCP
        </div>
        <div>
          <div className={styles.clientName}>{clientName}</div>
          <code className="c-code-inline">{redirectUri}</code>
        </div>
      </div>

      <p className="t-lead" aria-describedby="client-row-desc">
        {clientName} is requesting access to:
      </p>

      <div className={styles.scopeChipGroup}>
        {scopeList.map((s) => (
          <span key={s} className="c-chip-protocol">
            {humanizeScope(s)}
          </span>
        ))}
      </div>

      {multiTenant ? (
        <fieldset className={styles.fieldset}>
          <legend>Which workspace?</legend>
          {tenants.map((t) => (
            <label key={t.id} className={styles.radioRow}>
              <input
                type="radio"
                name="tenant"
                value={t.id}
                checked={selectedTenantId === t.id}
                onChange={(e) => onTenantSelect(e.target.value)}
              />
              <span>{t.name}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        tenants[0] && (
          <p className="t-lead">
            Access will be granted to <strong>{tenants[0].name}</strong>.
          </p>
        )
      )}

      <p className={styles.durationLine}>
        Authorization expires in 24 hours. Revoke any time from{' '}
        <a href="/settings/mcp">your workspace settings</a>.
      </p>

      <details className={styles.detailsBlock}>
        <summary>What is MCP?</summary>
        <p>
          Model Context Protocol is an open spec that lets AI agents call external tools. MarkOS
          runs an MCP server so Claude and other agents can draft, audit, and plan against your
          workspace using only the scopes you approve here.
        </p>
      </details>

      <div className={styles.actionRow}>
        <button
          type="button"
          className={`c-button c-button--destructive${isDenying ? ' is-loading' : ''}`}
          onClick={onDeny}
          disabled={submitState !== 'idle'}
          aria-busy={isDenying ? 'true' : 'false'}
        >
          {denyLabel}
        </button>
        <button
          type="button"
          className={`c-button c-button--primary${isApproving ? ' is-loading' : ''}`}
          onClick={onApprove}
          disabled={approveDisabled}
          aria-describedby={helperVisible ? 'approve-helper' : undefined}
          aria-busy={isApproving ? 'true' : 'false'}
        >
          {approveLabel}
        </button>
      </div>
      {helperVisible && (
        <p id="approve-helper" className="c-field__help">
          Pick a workspace to continue.
        </p>
      )}
    </section>
  );
}

function humanizeScope(s: string): string {
  const map: Record<string, string> = {
    read: 'Read CRM',
    write: 'Draft marketing copy',
    plan: 'Plan campaigns',
    audit: 'Audit claims',
    crm: 'Read CRM',
    tenancy: 'List members',
  };
  return map[s] || s;
}
