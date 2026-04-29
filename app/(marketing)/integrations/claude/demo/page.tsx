/**
 * app/(marketing)/integrations/claude/demo/page.tsx
 *
 * In-browser MCP playground. Visitor writes a brief, the page POSTs a
 * tools/call JSON-RPC envelope to /integrations/claude/demo/api, and renders the
 * draft + audit output.
 *
 * Server-side route.ts at /integrations/claude/demo/api is a thin proxy so
 * the page can stay a client component without CORS headaches.
 *
 * Phase 213.5 Plan-02: redesigned to DESIGN.md v1.1.0 canon. Composes
 * .c-field + .c-field__label + .c-input on form (D-13), .c-button--primary +
 * .is-loading on submit (D-14), .c-notice c-notice--error + [err] for API
 * errors, .c-notice c-notice--warning + [warn] for HTTP 429 rate-limit (NEW
 * state branch in onSubmit), .c-card for result panel (DS-7). Fetch wiring +
 * DOM IDs + copy preserved verbatim per D-20/D-21.
 */

'use client';

import { useState } from 'react';
import styles from './page.module.css';

type DraftResult = {
  success: boolean;
  draft?: { text?: string };
  audit?: { status?: string; score?: number; issues?: Array<{ rule: string; severity: string; message: string }> };
  error?: string;
};

const DEFAULT_BRIEF = {
  channel: 'email',
  audience: 'founder-sam',
  pain: 'pipeline_velocity',
  promise: 'refill your pipeline with qualified leads this week',
  brand: 'markos',
};

export default function ClaudeDemoSandbox() {
  const [brief, setBrief] = useState(DEFAULT_BRIEF);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setRateLimited(false);
    try {
      const response = await fetch('/integrations/claude/demo/api', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool: 'draft_message', arguments: brief }),
      });
      // 429 rate-limit branch — NEW per DS-6 (route.ts returns status 429
      // for RATE_LIMITED per RESEARCH.md "Wiring Preservation Map"). MUST run
      // BEFORE the generic !response.ok branch so .c-notice c-notice--warning
      // renders instead of the generic error notice.
      if (response.status === 429) {
        setRateLimited(true);
        setLoading(false);
        return;
      }
      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload?.error || `demo request failed (${response.status})`);
      }
      setResult(payload?.result || payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof typeof DEFAULT_BRIEF>(key: K, value: string) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <main className={styles.sandbox}>
      <header className={styles.intro}>
        <h1>MarkOS + Claude — Demo Sandbox</h1>
        <p className="t-lead">
          Enter a brief and invoke <code className="c-code-inline">draft_message</code> against the live MCP server.
          No signup. Rate-limited by IP.
        </p>
      </header>

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
          disabled={loading}
          aria-busy={loading}
          className={`c-button c-button--primary${loading ? ' is-loading' : ''}`}
        >
          {loading ? 'Drafting…' : 'Draft message'}
        </button>
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

      {result ? (
        <section aria-labelledby="demo-result-heading" className={styles.result}>
          <h2 id="demo-result-heading">Result</h2>
          <div className="c-card">
            {result.draft?.text ? (
              <article aria-label="Generated draft">
                <h3>Draft</h3>
                <p>{result.draft.text}</p>
              </article>
            ) : null}
            {result.audit ? (
              <article aria-label="Audit report">
                <h3>Audit — {result.audit.status}</h3>
                <p>Score: {result.audit.score ?? 'n/a'}</p>
                {result.audit.issues && result.audit.issues.length > 0 ? (
                  <ul>
                    {result.audit.issues.map((issue) => (
                      <li key={issue.rule}>
                        <strong>{issue.severity}</strong> — {issue.rule}: {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No issues flagged.</p>
                )}
              </article>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
