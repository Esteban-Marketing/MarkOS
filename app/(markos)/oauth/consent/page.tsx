'use client';

// Surface S2 — /oauth/consent.
// Reads PKCE authorization-request params from query string, fetches the user's
// tenant list (D-07 tenant-bind-at-consent), lets the user pick a workspace,
// then POSTs to /oauth/authorize/approve which 302s back to the MCP client with
// ?code=...&state=....
//
// Copy + a11y tokens trace directly to 202-UI-SPEC.md §"Surface 2" — DO NOT
// reword the locked copy strings; the consent-ui-a11y.test.js suite regressions
// them grep-style.

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';

type Tenant = { id: string; name: string; slug: string; org_id: string; status?: string };
type QueryParams = {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  resource: string;
};

const REQUIRED_PARAMS: Array<keyof QueryParams> = [
  'client_id',
  'redirect_uri',
  'scope',
  'state',
  'code_challenge',
  'code_challenge_method',
  'resource',
];

export default function OAuthConsentPage() {
  const [params, setParams] = useState<QueryParams | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [submitState, setSubmitState] = useState<'idle' | 'approving' | 'denying'>('idle');
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const parsed: Partial<QueryParams> = {};
    for (const key of REQUIRED_PARAMS) parsed[key] = q.get(key) || '';

    const missing = REQUIRED_PARAMS.find((k) => !parsed[k]);
    if (missing) {
      setInvalidReason(
        'This consent request is missing required fields. Start the OAuth flow again from your client.',
      );
      return;
    }
    if (parsed.code_challenge_method !== 'S256') {
      setInvalidReason('Consent request expired — start the OAuth flow again from your client.');
      return;
    }
    setParams(parsed as QueryParams);
    setClientName(deriveClientName(parsed.client_id || ''));

    // Fetch tenant list (D-07 tenant-bind at consent). The switcher endpoint
    // already filters purged tenants and projects iam_role.
    fetch('/api/tenant/switcher/list', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { tenants: [] }))
      .then((d) => {
        const flat: Tenant[] = [];
        for (const org of d.orgs || d.tenants || []) {
          const list = org.tenants || (org.tenant ? [org.tenant] : []);
          for (const t of list) {
            if (t.status && t.status === 'purged') continue;
            flat.push({ ...t, org_id: org.org_id || t.org_id });
          }
        }
        setTenants(flat);
        if (flat.length === 1) setSelectedTenantId(flat[0].id);
      })
      .catch(() => setTenants([]));

    fetch('/api/auth/csrf', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { token: '' }))
      .then((d) => setCsrfToken(d.token || ''))
      .catch(() => setCsrfToken(''));
  }, []);

  const scopeList = useMemo(() => (params?.scope || '').split(' ').filter(Boolean), [params]);
  const multiTenant = tenants.length > 1;
  const approveDisabled =
    submitState !== 'idle' || (!selectedTenantId && tenants.length > 1);

  async function onApprove() {
    if (!params) return;
    setSubmitState('approving');
    const body = {
      state: params.state,
      target_tenant_id: selectedTenantId || tenants[0]?.id || '',
      csrf_token: csrfToken,
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      resource: params.resource,
      scope: params.scope,
      code_challenge: params.code_challenge,
      code_challenge_method: params.code_challenge_method,
    };
    const res = await fetch('/oauth/authorize/approve', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.redirected) {
      window.location.href = res.url;
    } else if (!res.ok) {
      setSubmitState('idle');
      setInvalidReason('Approval failed — please retry or start a new consent flow.');
    }
  }

  function onDeny() {
    if (!params) return;
    setSubmitState('denying');
    try {
      const url = new URL(params.redirect_uri);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('state', params.state);
      window.location.href = url.toString();
    } catch {
      setInvalidReason('Invalid redirect_uri — cannot return to the MCP client.');
    }
  }

  if (invalidReason) {
    return (
      <main className={styles.page}>
        <div className={styles.errorAlert} role="alert">
          {invalidReason}
        </div>
      </main>
    );
  }
  if (!params) {
    return (
      <main className={styles.page}>
        <div className={styles.contentCard}>Loading…</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.contentCard} aria-labelledby="consent-heading">
        <h1 id="consent-heading" className={styles.heading} tabIndex={-1}>
          Authorize {clientName}
        </h1>

        <div className={styles.clientRow} id="client-row-desc">
          <div className={styles.clientLogo} aria-hidden="true">
            MCP
          </div>
          <div>
            <div className={styles.clientName}>{clientName}</div>
            <code className={styles.redirectUri}>{params.redirect_uri}</code>
          </div>
        </div>

        <p className={styles.subheading} aria-describedby="client-row-desc">
          {clientName} is requesting access to:
        </p>

        <div className={styles.scopeChipGroup}>
          {scopeList.map((s) => (
            <span key={s} className={styles.scopeChip}>
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
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                />
                <span>{t.name}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          tenants[0] && (
            <p className={styles.subheading}>
              You will grant access to: <strong>{tenants[0].name}</strong>
            </p>
          )
        )}

        <p className={styles.durationLine}>
          This authorization expires in 24 hours and can be revoked at any time from{' '}
          <a href="/settings/mcp">your workspace settings</a>.
        </p>

        <details className={styles.detailsBlock}>
          <summary>What is MCP?</summary>
          <p>
            Model Context Protocol is an open spec that lets AI agents call external tools. MarkOS
            runs an MCP server so Claude and other agents can draft, audit, and plan against your
            workspace — using only the scopes you approve here.
          </p>
        </details>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.denyButton}
            onClick={onDeny}
            disabled={submitState !== 'idle'}
          >
            {submitState === 'denying' ? 'Denying…' : 'Deny'}
          </button>
          <button
            type="button"
            className={styles.approveButton}
            onClick={onApprove}
            disabled={approveDisabled}
            aria-describedby={approveDisabled && multiTenant ? 'approve-helper' : undefined}
          >
            {submitState === 'approving' ? 'Approving…' : 'Approve access'}
          </button>
        </div>
        {approveDisabled && multiTenant && (
          <p id="approve-helper" className={styles.helperText}>
            Pick a workspace to continue
          </p>
        )}
      </section>
    </main>
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

function deriveClientName(client_id: string): string {
  if (!client_id) return 'client';
  if (client_id.startsWith('mcp-cli-')) return 'Unknown MCP client';
  return client_id;
}
