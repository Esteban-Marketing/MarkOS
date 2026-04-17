#!/usr/bin/env node
// Scaffold DISCUSS.md for v4.0.0 phases 201–206.
// Idempotent: preserves files > 500 bytes.

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..');
const BASE = join(ROOT, '.planning', 'phases');

const phases = [
  {
    id: '201',
    slug: 'saas-tenancy-hardening',
    title: 'SaaS Tenancy Hardening',
    goal: 'Public signups with verification, org → tenant model, custom subdomains via routing middleware, audit-log alignment, tenant offboarding + data-export.',
    scope_in: [
      'Public signup flow with email verification + BotID',
      'Org → tenant model (single org can host multiple tenants)',
      'Custom subdomains (`<tenant>.markos.dev`) via Vercel Routing Middleware',
      'Tenant lifecycle: suspend · reactivate · offboard · data-export (GDPR Art. 20)',
      'Audit-log consolidation — one ledger, `markos_audit_log`, append-only',
      'Seat management UI + invite flow',
    ],
    scope_out: [
      'Stripe self-serve billing (phase 205)',
      'Agency white-label (phase 221)',
      'Multi-region residency (phase 222 + 232)',
    ],
    success: [
      'Public signup with double opt-in working end-to-end',
      'Subdomains resolve to correct tenant · cross-tenant probe denied',
      'Tenant offboarding completes within 30 days with GDPR-grade evidence',
      'Audit log captures every privileged action across domains',
    ],
    threat_model_focus: 'tenant isolation · signup abuse · subdomain-based phishing · audit-log tampering',
    migrations: ['81_markos_public_signup', '82_markos_tenant_lifecycle'],
    contracts: ['F-83-signup-v1'],
  },
  {
    id: '202',
    slug: 'mcp-server-ga-claude-marketplace',
    title: 'MCP Server GA + Claude Marketplace Launch',
    goal: 'Graduate the 0-day MCP server (200-06) to GA: session persistence, +20 skills, public marketplace approval, Claude Marketplace listing live, Cursor / Windsurf / Warp certified.',
    scope_in: [
      'MCP session persistence via `markos_mcp_sessions`',
      '+20 MCP tools beyond wave-0 10 (total 30)',
      'Claude Marketplace review complete → live listing',
      'Certification with Cursor · Windsurf · Warp · ChatGPT agents',
      'Per-session cost metering + hard budget',
      'MCP threat model: prompt injection · tool confusion · session hijack',
    ],
    scope_out: [
      'Computer-use agents (phase 235)',
      'Marketplace of 3rd-party agents (phase 213 alpha)',
    ],
    success: [
      'Claude Marketplace listing live with ≥ 50 installs in first 30 days',
      'Cursor + Windsurf + Warp support documented',
      'Session p95 latency ≤ 300ms for simple tool invocations',
      'Zero unauthorized tool invocations in 30-day window',
    ],
    threat_model_focus: 'prompt injection · tool confusion · session spoofing · data exfil',
    migrations: ['71_markos_mcp_sessions extensions'],
    contracts: ['F-71-mcp-session-v1 updates'],
  },
  {
    id: '203',
    slug: 'webhook-subscription-engine-ga',
    title: 'Webhook Subscription Engine GA',
    goal: 'Graduate 200-03 primitive to GA: delivery dashboard UI, DLQ with replay, signing-secret rotation, per-subscription rate-limits, webhook status page.',
    scope_in: [
      'Operator UI for webhook subscriptions, deliveries, DLQ',
      'Replay from DLQ with original signature',
      'Signing-secret rotation (overlap window, 30-day grace)',
      'Per-subscription RPS cap + circuit breaker',
      'Webhook health telemetry → Sentry',
    ],
    scope_out: [
      'Custom payload transformations (phase 210 connector framework)',
    ],
    success: [
      '99.9% delivery success for subscribers responding 2xx within 5s',
      'DLQ replay works on first attempt',
      'Signing-secret rotation survives 30 days with zero downtime',
    ],
    threat_model_focus: 'replay attacks · signing-secret leak · endpoint SSRF',
    migrations: ['72 extensions: DLQ columns'],
    contracts: ['F-72 · F-73 updates'],
  },
  {
    id: '204',
    slug: 'cli-markos-v1-ga',
    title: 'CLI `markos` v1 GA',
    goal: 'Graduate CLI to full GA: commands init · generate · plan · run · eval · login · keys · whoami · env · status · doctor. Cross-platform distribution.',
    scope_in: [
      '`markos login` — OAuth device code flow',
      '`markos keys` — API key CRUD',
      '`markos plan` — plan a campaign from a brief',
      '`markos run` — run a plan end-to-end',
      '`markos eval` — run eval suite against last output',
      '`markos status` · `markos doctor` — health + diagnostics',
      '`markos env pull` · `env push` — env sync',
      'Homebrew + Scoop + npm + winget + apt distribution',
    ],
    scope_out: [
      'Computer-use CLI automation (phase 235)',
    ],
    success: [
      'Installation in < 60s across macOS · Linux · Windows',
      'All commands under 250ms local + network',
      'Doctor detects and reports common misconfigurations',
    ],
    threat_model_focus: 'credential storage · token scope · supply-chain (npm package signing)',
    migrations: [],
    contracts: ['F-85-cli-generate-v1 graduations'],
  },
  {
    id: '205',
    slug: 'billing-self-serve-byok',
    title: 'Billing Self-Serve + BYOK',
    goal: 'Stripe-backed self-serve billing portal. Platform fee + metered AI + BYOK discount. Transparent invoices. Tax handling.',
    scope_in: [
      'Stripe Checkout + Billing Portal for plan upgrades/downgrades',
      'Usage-based metered AI via `billing_usage_events` → Stripe usage records',
      'BYOK discount calc — detect BYOK flag, waive AI markup per call',
      'Invoice UI with per-tenant cost breakdown',
      'Stripe Tax for global tax handling',
      'Dunning + failed-payment flows',
    ],
    scope_out: [
      'Enterprise custom contracts (post-v4.0.0)',
      'Multi-currency beyond Stripe defaults',
    ],
    success: [
      'Tenant can self-serve upgrade → downgrade → cancel without support',
      'Invoice breakdown matches telemetry to cent',
      'BYOK discount applied correctly; reconciliation passes',
    ],
    threat_model_focus: 'pricing manipulation · BYOK key exfil · race conditions on upgrade',
    migrations: ['55 extensions: self-serve fields'],
    contracts: ['existing F-54 billing contracts · new F-86-self-serve-v1'],
  },
  {
    id: '206',
    slug: 'soc2-type1-foundation',
    title: 'SOC 2 Type I Foundation',
    goal: 'Engage auditor · author + ratify SOC 2 policies · automate evidence collection · first pen test · close first audit in v4.2.0.',
    scope_in: [
      'Auditor engagement (Drata · Vanta · Secureframe OR direct firm)',
      'Policy authoring: access control · incident response · change management · vendor management · business continuity · data classification · risk assessment · acceptable use',
      'Evidence collection automation tied to MarkOS + Vercel + Supabase + Stripe',
      'First external pen test',
      'Security training program for the team',
      'Backup + disaster recovery drills',
    ],
    scope_out: [
      'Type II observation window (phase 223)',
      'ISO 27001 (phase 234)',
      'HIPAA (phase 231)',
    ],
    success: [
      'All 17 SOC 2 CC policies ratified · signed · published',
      'Evidence collection automated with ≥ 95% coverage',
      'Pen test report clean or remediated',
      'SOC 2 Type I report issued',
    ],
    threat_model_focus: 'entire CC suite (access, authn, authz, change, ops, vendor, etc.)',
    migrations: [],
    contracts: [],
  },
];

const today = new Date().toISOString().slice(0, 10);

async function existsAndNonTrivial(p) {
  try {
    const s = await stat(p);
    return s.size > 500;
  } catch {
    return false;
  }
}

async function ensureFile(path, content) {
  if (await existsAndNonTrivial(path)) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
  return true;
}

function discussMd(p) {
  return (
    `# Phase ${p.id} — ${p.title} (Discussion)\n\n`
    + `> v4.0.0 SaaS Readiness milestone. Synthesis: \`obsidian/thinking/2026-04-16-markos-saas-roadmap.md\`. Quality baseline: \`../200-saas-readiness-wave-0/QUALITY-BASELINE.md\`.\n\n`
    + `**Date:** ${today}\n`
    + `**Milestone:** v4.0.0 SaaS Readiness\n`
    + `**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)\n`
    + `**Depends on:** phase 200 (wave-0)\n`
    + `**Quality baseline applies:** all 15 gates\n\n`
    + `## Goal\n\n${p.goal}\n\n`
    + `## Scope (in)\n\n${p.scope_in.map((s) => `- ${s}`).join('\n')}\n\n`
    + `## Scope (out)\n\n${p.scope_out.map((s) => `- ${s}`).join('\n')}\n\n`
    + `## Threat-model focus\n\n${p.threat_model_focus}\n\n`
    + `## Success criteria\n\n${p.success.map((s) => `- ${s}`).join('\n')}\n\n`
    + `## Migrations (planned)\n\n${p.migrations.length ? p.migrations.map((m) => `- \`${m}.sql\``).join('\n') : '- none'}\n\n`
    + `## Contracts (planned)\n\n${p.contracts.length ? p.contracts.map((c) => `- \`${c}\``).join('\n') : '- none'}\n\n`
    + `## Pre-locked decisions (2026-04-16)\n\n`
    + `- Hosting: SaaS cloud first (decision 1).\n`
    + `- Integration order: OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n (decision 4).\n`
    + `- Target ICP: [[Target ICP|seed-to-A B2B SaaS + modern DTC + solopreneurs]] (Q-A).\n`
    + `- Brand stance: [[Brand Stance|developer-native, AI-first, quietly confident]] (Q-B).\n`
    + `- Connector posture: Nango embedded (Q-C).\n`
    + `- Quality gates: all 15 from \`QUALITY-BASELINE.md\` apply.\n\n`
    + `## Open questions\n\n_Defer to \`/gsd-discuss-phase ${p.id}\` interactive session before planning._\n\n`
    + `## References\n\n`
    + `- Roadmap: \`obsidian/thinking/2026-04-16-markos-saas-roadmap.md\`\n`
    + `- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Target ICP](../../../obsidian/brain/Target%20ICP.md) · [Brand Stance](../../../obsidian/brain/Brand%20Stance.md)\n`
    + `- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)\n`
    + `- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)\n`
  );
}

async function main() {
  let written = 0, skipped = 0;
  for (const p of phases) {
    const dir = join(BASE, `${p.id}-${p.slug}`);
    const path = join(dir, 'DISCUSS.md');
    if (await ensureFile(path, discussMd(p))) written++; else skipped++;
  }
  console.log(`[phases 201-206] wrote ${written}, preserved ${skipped}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
