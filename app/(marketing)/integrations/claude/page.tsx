/**
 * app/(marketing)/integrations/claude/page.tsx
 *
 * Claude Marketplace landing page.
 *
 * Canon inputs:
 *   archetypes: solopreneur, vibe-coder
 *   pains: content_engagement, pipeline_velocity
 *   brand: markos
 *   promise: ship drafts and audits from the same chat window you already use
 *
 * Voice target: score >= 100 via test/marketing/claude-landing.test.js heuristic
 * (Phase 200 baseline preserved per Phase 213.5 D-11 — copy text nodes unchanged).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'MarkOS for Claude — Ship drafts from Claude',
  description:
    'Connect Claude to MarkOS via MCP. Ten tools for drafting, auditing, and scheduling campaigns — grounded in your canon, fired from the chat window you already use.',
  openGraph: {
    title: 'MarkOS for Claude',
    description:
      'Connect Claude to MarkOS via MCP. Draft, audit, and schedule campaigns from the chat window you already use.',
    images: ['/integrations/claude/og.png'],
  },
};

const TOOLS: Array<{ name: string; description: string }> = [
  { name: 'draft_message', description: 'Produce a channel-native draft from a brief.' },
  { name: 'plan_campaign', description: 'Outline a campaign from an objective and audience.' },
  { name: 'research_audience', description: 'Snapshot an audience segment with canonical pains.' },
  { name: 'run_neuro_audit', description: 'Score a draft against voice, clarity, and evidence rules.' },
  { name: 'generate_brief', description: 'Structure a freeform idea into a ready-to-draft brief.' },
  { name: 'audit_claim', description: 'Verify a marketing claim against canon evidence.' },
  { name: 'list_pain_points', description: 'Expose the canonical pain-point taxonomy.' },
  { name: 'rank_execution_queue', description: 'Rank CRM execution items by intent + urgency.' },
  { name: 'schedule_post', description: 'Push a draft onto a channel queue.' },
  { name: 'explain_literacy', description: 'Explain a literacy node or archetype slug.' },
];

export default function ClaudeIntegrationLanding() {
  return (
    <main className={styles.landing}>
      <section aria-labelledby="hero-heading" className="c-card c-card--feature">
        <h1 id="hero-heading">Ship drafts from Claude.</h1>
        <p className="t-lead">
          MarkOS connects to Claude via MCP. Ten tools for drafting, auditing, and scheduling
          campaigns — grounded in your canon, fired from the chat window you already use.
        </p>
        <div className={styles.ctaRow}>
          <Link href="/integrations/claude/demo" className="c-button c-button--primary" aria-label="Open the MarkOS for Claude demo sandbox">
            Try the demo
          </Link>
          <Link href="/docs/quickstart" className="c-button c-button--tertiary" aria-label="Read the Claude MCP quickstart guide">
            Read the quickstart
          </Link>
        </div>
      </section>

      <section aria-labelledby="value-heading" className={styles.valueProps}>
        <h2 id="value-heading">Why solopreneurs and vibe-coders ship with MarkOS for Claude</h2>
        <ul className={styles.valueList}>
          <li>
            <h3>Stop re-briefing the model</h3>
            <p>
              Your canon, pain taxonomy, and brand voice live inside MarkOS. Claude reads them in
              every tool call. No more pasting the same brand guide.
            </p>
          </li>
          <li>
            <h3>Audit every draft</h3>
            <p>
              Every generation runs through run_neuro_audit. Promise presence, brand coherence,
              claim safety — scored before you hit publish.
            </p>
          </li>
          <li>
            <h3>Pipeline velocity, not pipeline theater</h3>
            <p>
              rank_execution_queue tells you what actually moves the number today. schedule_post
              ships the draft. No more stalled tabs or blank calendars.
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="tools-heading" className={styles.tools}>
        <h2 id="tools-heading">Ten tools, one chat window</h2>
        <ul className={styles.toolGrid} aria-label="MCP tool grid">
          {TOOLS.map((tool) => (
            <li key={tool.name} className="c-card c-card--interactive">
              <span className="c-chip-protocol">{tool.name}</span>
              <p>{tool.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="install-heading" className={styles.install}>
        <h2 id="install-heading">Install in under a minute</h2>
        <ol>
          <li>Open Claude Desktop settings.</li>
          <li>Add a Custom MCP Server pointing at <code className="c-code-inline">https://markos.dev/api/mcp/session</code>.</li>
          <li>Ask Claude: <em>draft a LinkedIn post about pipeline velocity for founder-sam</em>.</li>
        </ol>
        <p>
          Full quickstart with tenant auth, webhook subscriptions, and drift-free canon sync lives
          in <Link href="/docs/quickstart" className={styles.installLink}>the quickstart</Link>.
        </p>
      </section>

      <section aria-labelledby="cta-heading" className={styles.finalCta}>
        <h2 id="cta-heading">Your pipeline wants drafts, not tabs.</h2>
        <Link href="/integrations/claude/demo" className="c-button c-button--primary">
          Open the demo sandbox
        </Link>
      </section>
    </main>
  );
}
