'use client';

// Surface S2 — /oauth/consent.
// Phase 213.2 Plan-04: data-fetching + state preserved verbatim from Phase 202;
// presentational layer extracted to _components/ConsentCard.tsx for Storybook
// authorability (RESEARCH.md R-4). Copy revisions per 213.2-UI-SPEC.md Surface 4.

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import ConsentCard from './_components/ConsentCard';

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
        '[err] Consent request missing required fields. Start the OAuth flow again from your client.',
      );
      return;
    }
    if (parsed.code_challenge_method !== 'S256') {
      setInvalidReason('[err] Consent request expired. Start the OAuth flow again from your client.');
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
      setInvalidReason('[err] Approval failed. Retry or start a new consent flow.');
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
      setInvalidReason('[err] Invalid redirect_uri. Cannot return to the MCP client.');
    }
  }

  return (
    <main className={styles.page}>
      <ConsentCard
        clientName={clientName}
        redirectUri={params?.redirect_uri || ''}
        scopeList={scopeList}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        submitState={submitState}
        invalidReason={invalidReason}
        loading={!params && !invalidReason}
        onApprove={onApprove}
        onDeny={onDeny}
        onTenantSelect={setSelectedTenantId}
      />
    </main>
  );
}

function deriveClientName(client_id: string): string {
  if (!client_id) return 'client';
  if (client_id.startsWith('mcp-cli-')) return 'Unknown MCP client';
  return client_id;
}
