/**
 * app/(marketing)/integrations/claude/demo/page.tsx
 *
 * In-browser MCP playground. Visitor writes a brief, the page POSTs a
 * tools/call JSON-RPC envelope to /api/mcp/session, and renders the
 * draft + audit output.
 *
 * Server-side route.ts at /integrations/claude/demo/api is a thin proxy so
 * the page can stay a client component without CORS headaches.
 */

'use client';

import { useState } from 'react';

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/integrations/claude/demo/api', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool: 'draft_message', arguments: brief }),
      });
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
    <main className="claude-demo-sandbox">
      <header>
        <h1>MarkOS + Claude — Demo Sandbox</h1>
        <p>
          Enter a brief and invoke <code>draft_message</code> against the live MCP server.
          No signup. Rate-limited by IP.
        </p>
      </header>

      <form onSubmit={onSubmit} aria-label="Draft brief form" noValidate>
        <label htmlFor="demo-channel">
          Channel
          <input
            id="demo-channel"
            name="channel"
            value={brief.channel}
            onChange={(e) => updateField('channel', e.target.value)}
            required
          />
        </label>
        <label htmlFor="demo-audience">
          Audience
          <input
            id="demo-audience"
            name="audience"
            value={brief.audience}
            onChange={(e) => updateField('audience', e.target.value)}
            required
          />
        </label>
        <label htmlFor="demo-pain">
          Pain
          <input
            id="demo-pain"
            name="pain"
            value={brief.pain}
            onChange={(e) => updateField('pain', e.target.value)}
            required
          />
        </label>
        <label htmlFor="demo-promise">
          Promise
          <input
            id="demo-promise"
            name="promise"
            value={brief.promise}
            onChange={(e) => updateField('promise', e.target.value)}
            required
          />
        </label>
        <label htmlFor="demo-brand">
          Brand
          <input
            id="demo-brand"
            name="brand"
            value={brief.brand}
            onChange={(e) => updateField('brand', e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? 'Drafting…' : 'Draft message'}
        </button>
      </form>

      {errorMessage ? (
        <div role="alert" className="demo-error">
          {errorMessage}
        </div>
      ) : null}

      {result ? (
        <section aria-labelledby="demo-result-heading" className="demo-result">
          <h2 id="demo-result-heading">Result</h2>
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
        </section>
      ) : null}
    </main>
  );
}
