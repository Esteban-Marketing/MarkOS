/**
 * app/(marketing)/integrations/claude/demo/page.tsx
 *
 * Phase 200.1 Plan 10 hardens the public demo with four layers:
 * BotID verification, a 15-minute demo_session_token, a restricted tool subset,
 * and a server-side $0.50 cost cap. Client-side gating is UX only; the server
 * still enforces tool allow-list + token verification.
 *
 * Phase 213.5 Plan-02 layout primitives remain intact: .c-field +
 * .c-field__label + .c-input on the form, .c-button--primary + .is-loading on
 * submit, .c-notice c-notice--error + [err] for errors, .c-notice
 * c-notice--warning + [warn] for rate-limit / cap states, and .c-card for
 * session + result panels.
 */

'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type DemoSessionState = {
  demoSessionToken: string;
  expiresAt: string;
  allowedTools: string[];
  costCapCents: number;
  totalCents: number;
};

type DemoResult = {
  toolName: 'draft_message' | 'audit_claim';
  payload: any;
};

const DEFAULT_BRIEF = {
  channel: 'email',
  audience: 'founder-sam',
  pain: 'pipeline_velocity',
  promise: 'refill your pipeline with qualified leads this week',
  brand: 'markos',
};

const CLIENT_VISIBLE_TOOLS = ['draft_message', 'audit_claim'] as const;

declare global {
  interface Window {
    __botId?: { getToken?: () => Promise<string> };
  }
}

export default function ClaudeDemoSandbox() {
  const [brief, setBrief] = useState(DEFAULT_BRIEF);
  const [loading, setLoading] = useState(false);
  const [issuingToken, setIssuingToken] = useState(false);
  const [session, setSession] = useState<DemoSessionState | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [costCapReached, setCostCapReached] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) return;
    if (Date.parse(session.expiresAt) <= now) {
      setSession(null);
      setResult(null);
      setCostCapReached(false);
      setErrorMessage('Demo session expired. Verify again for a fresh 15-minute session.');
    }
  }, [now, session]);

  async function acquireBotIdToken(): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.__botId?.getToken) {
        const token = await window.__botId.getToken();
        if (typeof token === 'string' && token.length > 0) return token;
      }
    } catch {
      // Fall through to the local-development placeholder.
    }
    return 'dev-no-botid';
  }

  async function issueDemoToken() {
    setIssuingToken(true);
    setErrorMessage(null);
    setRateLimited(false);
    setCostCapReached(false);

    try {
      const botidToken = await acquireBotIdToken();
      const response = await fetch('/integrations/claude/demo/api/issue-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ botid_token: botidToken }),
      });
      if (response.status === 429) {
        setRateLimited(true);
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(payload?.error || `demo session failed (${response.status})`);
        return;
      }
      setSession({
        demoSessionToken: payload.demo_session_token,
        expiresAt: payload.expires_at,
        allowedTools: Array.isArray(payload.allowed_tools) ? payload.allowed_tools : [],
        costCapCents: Number(payload.cost_cap_cents) || 50,
        totalCents: 0,
      });
      setResult(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIssuingToken(false);
    }
  }

  async function invokeTool(toolName: 'draft_message' | 'audit_claim') {
    if (!session) {
      setErrorMessage('BotID verification required before the demo can start.');
      return;
    }

    if (!session.allowedTools.includes(toolName)) {
      setErrorMessage(`Tool disabled in demo mode: ${toolName}`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setRateLimited(false);
    setCostCapReached(false);

    try {
      const toolInput = toolName === 'draft_message'
        ? brief
        : { claim: brief.promise };

      const response = await fetch('/integrations/claude/demo/api/invoke', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          demo_session_token: session.demoSessionToken,
          tool_name: toolName,
          tool_input: toolInput,
        }),
      });
      if (response.status === 429) {
        setRateLimited(true);
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (response.status === 402 && payload?.error === 'cost_cap_exceeded') {
        setCostCapReached(true);
        setSession((prev) => (
          prev
            ? { ...prev, totalCents: Number(payload.total_cents) || prev.totalCents }
            : prev
        ));
        return;
      }
      if (!response.ok) {
        setErrorMessage(payload?.error || `demo request failed (${response.status})`);
        return;
      }
      setSession((prev) => (
        prev
          ? {
              ...prev,
              totalCents: Number(payload.total_cents) || prev.totalCents,
              expiresAt: payload.expires_at || prev.expiresAt,
            }
          : prev
      ));
      setResult({
        toolName,
        payload: payload?.result || payload,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await invokeTool('draft_message');
  }

  function updateField<K extends keyof typeof DEFAULT_BRIEF>(key: K, value: string) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  const visibleTools = CLIENT_VISIBLE_TOOLS.filter((toolName) => session?.allowedTools.includes(toolName));

  return (
    <main className={styles.sandbox}>
      <p role="status" className="c-notice c-notice--info">
        Demo mode - BotID-protected sandbox. Read-only and propose-only tools only. Sessions expire after 15 minutes with a $0.50 cost cap.
      </p>

      <header className={styles.intro}>
        <h1>MarkOS + Claude - Demo Sandbox</h1>
        <p className="t-lead">
          Enter a brief, verify with BotID, and invoke <code className="c-code-inline">draft_message</code> or <code className="c-code-inline">audit_claim</code> inside the hardened demo sandbox.
        </p>
      </header>

      <section className="c-card" aria-label="Demo session controls">
        <p className="c-field__help">
          {session
            ? `[ok] Demo session live until ${new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${session.totalCents}/${session.costCapCents} cents used.`
            : 'BotID verification is required before a demo session starts.'}
        </p>
        <button
          type="button"
          onClick={() => void issueDemoToken()}
          disabled={issuingToken}
          aria-busy={issuingToken}
          className={`c-button c-button--secondary${issuingToken ? ' is-loading' : ''}`}
        >
          {issuingToken ? 'Verifying...' : 'Try the demo'}
        </button>
      </section>

      <form onSubmit={onSubmit} aria-label="Draft brief form" noValidate className={styles.demoForm}>
        <div className={`c-field ${styles.fieldGroup}`}>
          <label htmlFor="demo-channel" className="c-field__label">Channel</label>
          <input
            id="demo-channel"
            name="channel"
            value={brief.channel}
            onChange={(e) => updateField('channel', e.target.value)}
            required
            className="c-input"
          />
        </div>
        <div className={`c-field ${styles.fieldGroup}`}>
          <label htmlFor="demo-audience" className="c-field__label">Audience</label>
          <input
            id="demo-audience"
            name="audience"
            value={brief.audience}
            onChange={(e) => updateField('audience', e.target.value)}
            required
            className="c-input"
          />
        </div>
        <div className={`c-field ${styles.fieldGroup}`}>
          <label htmlFor="demo-pain" className="c-field__label">Pain</label>
          <input
            id="demo-pain"
            name="pain"
            value={brief.pain}
            onChange={(e) => updateField('pain', e.target.value)}
            required
            className="c-input"
          />
        </div>
        <div className={`c-field ${styles.fieldGroup}`}>
          <label htmlFor="demo-promise" className="c-field__label">Promise</label>
          <input
            id="demo-promise"
            name="promise"
            value={brief.promise}
            onChange={(e) => updateField('promise', e.target.value)}
            required
            className="c-input"
          />
        </div>
        <div className={`c-field ${styles.fieldGroup}`}>
          <label htmlFor="demo-brand" className="c-field__label">Brand</label>
          <input
            id="demo-brand"
            name="brand"
            value={brief.brand}
            onChange={(e) => updateField('brand', e.target.value)}
            required
            className="c-input"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !session || !visibleTools.includes('draft_message')}
          aria-busy={loading}
          className={`c-button c-button--primary${loading ? ' is-loading' : ''}`}
        >
          {loading ? 'Drafting...' : 'Draft message'}
        </button>
        <button
          type="button"
          disabled={loading || !session || !visibleTools.includes('audit_claim')}
          onClick={() => void invokeTool('audit_claim')}
          className="c-button c-button--secondary"
        >
          Audit claim
        </button>
        <p className="c-field__help">
          Only <code className="c-code-inline">draft_message</code> and <code className="c-code-inline">audit_claim</code> are exposed in demo mode. Server-side checks still enforce the subset even if client state is modified.
        </p>
      </form>

      {rateLimited ? (
        <p role="alert" className="c-notice c-notice--warning">
          [warn] Demo rate limit reached. Try again in 60s.
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="c-notice c-notice--error">
          [err] {errorMessage}
        </p>
      ) : null}

      {costCapReached ? (
        <p role="alert" className="c-notice c-notice--warning">
          [warn] Demo session reached its $0.50 cost cap. Reload for a fresh session.
        </p>
      ) : null}

      {result ? (
        <section aria-labelledby="demo-result-heading" className={styles.result}>
          <h2 id="demo-result-heading">Result</h2>
          <div className="c-card">
            {result.toolName === 'draft_message' && result.payload?.draft?.text ? (
              <article aria-label="Generated draft">
                <h3>Draft</h3>
                <p>{result.payload.draft.text}</p>
              </article>
            ) : null}
            {result.toolName === 'draft_message' && result.payload?.audit ? (
              <article aria-label="Audit report">
                <h3>Audit - {result.payload.audit.status}</h3>
                <p>Score: {result.payload.audit.score ?? 'n/a'}</p>
                {result.payload.audit.issues && result.payload.audit.issues.length > 0 ? (
                  <ul>
                    {result.payload.audit.issues.map((issue: any) => (
                      <li key={issue.rule}>
                        <strong>{issue.severity}</strong> - {issue.rule}: {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No issues flagged.</p>
                )}
              </article>
            ) : null}
            {result.toolName === 'audit_claim' ? (
              <article aria-label="Claim audit report">
                <h3>Claim audit</h3>
                <p>Supported: {result.payload?.supported ? 'yes' : 'no'}</p>
                <p>Confidence: {result.payload?.confidence ?? 0}</p>
                {Array.isArray(result.payload?.evidence) && result.payload.evidence.length > 0 ? (
                  <ul>
                    {result.payload.evidence.map((item: any, index: number) => (
                      <li key={`${item.source || 'evidence'}-${index}`}>
                        <strong>{item.source || 'source'}</strong> - {item.quote || item.relevance || 'No quote provided.'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No supporting evidence returned.</p>
                )}
              </article>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
