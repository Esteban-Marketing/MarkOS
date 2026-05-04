#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const VERIFICATION_PATH = '.planning/phases/200-saas-readiness-wave-0/200-VERIFICATION.md';
const GENERATED_BLOCK_START = '<!-- verify-phase-200:start -->';
const GENERATED_BLOCK_END = '<!-- verify-phase-200:end -->';
const REQUIRED_SUMMARIES = Array.from({ length: 10 }, (_, index) =>
  `.planning/phases/200.1-saas-readiness-hardening/200.1-${String(index + 1).padStart(2, '0')}-SUMMARY.md`,
);
const EMPTY_CHECKS_ALLOWLIST = new Set(['load-tests']);

const GATES = [
  {
    id: 1,
    name: 'contract-first',
    checks: [
      { type: 'file', path: 'contracts/openapi.json' },
      { type: 'file', path: '.github/workflows/openapi-ci.yml' },
      { type: 'file', path: 'contracts/F-71-mcp-session-v1.yaml' },
      { type: 'file', path: 'contracts/F-72-webhook-subscription-v1.yaml' },
      { type: 'file', path: 'contracts/F-73-webhook-delivery-v1.yaml' },
      { type: 'file', path: 'contracts/F-71.1-mcp-auth-bearer-v1.yaml' },
      { type: 'file', path: 'contracts/F-72.1-webhook-rotation-v1.yaml' },
      { type: 'grep', path: 'contracts/openapi.json', pattern: '"openapi"\\s*:\\s*"3\\.1\\.0"', sample: '"openapi": "3.1.0"' },
      { type: 'grep', path: 'contracts/openapi.json', pattern: 'F-71\\.1-mcp-auth-bearer-v1\\.yaml', sample: 'F-71.1-mcp-auth-bearer-v1.yaml' },
      { type: 'grep', path: 'contracts/openapi.json', pattern: 'F-72\\.1-webhook-rotation-v1\\.yaml', sample: 'F-72.1-webhook-rotation-v1.yaml' },
    ],
  },
  {
    id: 2,
    name: 'typed-http-boundary',
    checks: [
      { type: 'file', path: 'bin/lib/brief-parser.cjs' },
      { type: 'grep', path: 'bin/lib/brief-parser.cjs', pattern: 'function\\s+validateBrief', sample: 'function validateBrief(brief) {' },
      { type: 'file', path: 'lib/markos/mcp/pipeline.cjs' },
      { type: 'grep', path: 'lib/markos/mcp/pipeline.cjs', pattern: 'validate_input', sample: 'auth -> rate_limit -> tool_lookup -> validate_input -> free_tier' },
      { type: 'grep', path: 'lib/markos/mcp/pipeline.cjs', pattern: 'validator\\.validateInput', sample: 'if (!validator.validateInput(args)) {' },
      { type: 'grep', path: 'lib/markos/mcp/pipeline.cjs', pattern: 'validator\\.validateOutput', sample: 'if (!validator.validateOutput(invocation)) {' },
      { type: 'file', path: 'api/webhooks/subscribe.js' },
      { type: 'grep', path: 'api/webhooks/subscribe.js', pattern: 'INVALID_JSON', sample: "return writeJsonWithSpan(span, res, 400, { success: false, error: 'INVALID_JSON' });" },
    ],
  },
  {
    id: 3,
    name: 'semver-on-contract',
    checks: [
      { type: 'file', path: 'contracts/F-71-mcp-session-v1.yaml' },
      { type: 'file', path: 'contracts/F-71-mcp-session-v2.yaml' },
      { type: 'file', path: 'contracts/F-71.1-mcp-auth-bearer-v1.yaml' },
      { type: 'file', path: 'contracts/F-72-webhook-subscription-v1.yaml' },
      { type: 'file', path: 'contracts/F-72.1-webhook-rotation-v1.yaml' },
      { type: 'file', path: 'contracts/F-73-webhook-delivery-v1.yaml' },
      { type: 'grep', path: 'contracts/openapi.json', pattern: '"version"\\s*:\\s*"1\\.0\\.0"', sample: '"version": "1.0.0"' },
    ],
  },
  {
    id: 4,
    name: 'coverage-floor',
    deferred: 'with-followup',
    checks: [
      {
        type: 'grep-any',
        path: VERIFICATION_PATH,
        patterns: ['###\\s+Coverage Exclusion List', '0 excluded tests after gate-4 remediation'],
        sample: '### Coverage Exclusion List',
      },
      {
        type: 'grep-any',
        path: VERIFICATION_PATH,
        patterns: ['\\|\\s*Test File\\s*\\|\\s*Status\\s*\\|\\s*Owner Phase\\s*\\|\\s*Rationale\\s*\\|', '0 excluded tests after gate-4 remediation'],
        sample: '| Test File | Status | Owner Phase | Rationale |',
      },
      { type: 'coverage-exclusion-list', path: VERIFICATION_PATH },
    ],
  },
  {
    id: 5,
    name: 'integration-real',
    checks: [
      { type: 'file', path: 'test/webhooks/store-supabase.test.js' },
      { type: 'file', path: 'test/webhooks/migration-72.test.js' },
      { type: 'file', path: 'test/mcp/rls.test.js' },
      { type: 'file', path: 'test/mcp/cost-events.test.js' },
      { type: 'file', path: 'test/tenancy/gdpr-export.test.js' },
    ],
  },
  {
    id: 6,
    name: 'e2e-smoke',
    deferred: 'with-followup',
    checks: [
      {
        type: 'grep',
        path: VERIFICATION_PATH,
        pattern: 'closes:e2e_smoke=PHASE_201\\.1_PLAN_10',
        sample: 'closes:e2e_smoke=PHASE_201.1_PLAN_10',
      },
    ],
  },
  {
    id: 7,
    name: 'load-tests',
    deferred: 'with-rationale',
    checks: [],
  },
  {
    id: 8,
    name: 'eval-as-test',
    checks: [
      { type: 'file', path: '.github/workflows/mcp-evals.yml' },
      { type: 'file', path: 'lib/markos/evals/mcp/all.test.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/draft_message.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/plan_campaign.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/research_audience.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/run_neuro_audit.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/generate_brief.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/audit_claim.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/list_pain_points.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/rank_execution_queue.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/schedule_post.eval.js' },
      { type: 'file', path: 'lib/markos/evals/mcp/explain_literacy.eval.js' },
    ],
  },
  {
    id: 9,
    name: 'otel',
    checks: [
      { type: 'file', path: 'lib/markos/observability/otel.cjs' },
      { type: 'file', path: '.github/workflows/otel-coverage.yml' },
      { type: 'grep', path: 'api/mcp/session.js', pattern: "withSpan\\('mcp\\.session'", sample: "withSpan('mcp.session'" },
      { type: 'grep', path: 'api/mcp/tools/[toolName].js', pattern: "recordEvent\\('mcp\\.tool\\.invoked'", sample: "recordEvent('mcp.tool.invoked'" },
      { type: 'grep', path: 'api/webhooks/test-fire.js', pattern: "recordEvent\\('webhook\\.test_fired'", sample: "recordEvent('webhook.test_fired'" },
      { type: 'grep', path: 'api/webhooks/rotate-secret.js', pattern: "recordEvent\\('webhook\\.secret_rotated'", sample: "recordEvent('webhook.secret_rotated'" },
    ],
  },
  {
    id: 10,
    name: 'cost-telemetry',
    checks: [
      { type: 'file', path: 'lib/markos/mcp/auth-bearer.cjs' },
      { type: 'file', path: 'lib/markos/mcp/cost-events.cjs' },
      { type: 'file', path: 'lib/markos/mcp/kill-switch.cjs' },
      { type: 'file', path: 'supabase/migrations/71.1_markos_mcp_auth_and_cost.sql' },
      { type: 'grep', path: 'api/mcp/session.js', pattern: 'checkKillSwitch', sample: 'const { checkKillSwitch, buildKillSwitchJsonRpcError } = require(' },
      { type: 'grep', path: 'api/mcp/tools/[toolName].js', pattern: 'recordCostEvent', sample: 'const { recordCostEvent } = require(' },
    ],
  },
  {
    id: 11,
    name: 'threat-model',
    checks: [
      { type: 'file', path: '.planning/phases/200.1-saas-readiness-hardening/threat-models/mcp-stride.md' },
      { type: 'file', path: '.planning/phases/200.1-saas-readiness-hardening/threat-models/webhooks-stride.md' },
      { type: 'file', path: '.planning/phases/200.1-saas-readiness-hardening/threat-models/marketplace-stride.md' },
      { type: 'grep', path: '.planning/phases/200-saas-readiness-wave-0/DISCUSS.md', pattern: 'Threat models \\(added by Phase 200\\.1\\)', sample: '## Threat models (added by Phase 200.1)' },
    ],
  },
  {
    id: 12,
    name: 'platform-baseline',
    checks: [
      { type: 'file', path: 'lib/markos/webhooks/url-validator.cjs' },
      { type: 'file', path: 'lib/markos/webhooks/replay-protection.cjs' },
      { type: 'file', path: 'lib/markos/webhooks/secret-vault.cjs' },
      { type: 'file', path: 'lib/markos/mcp/auth-bearer.cjs' },
      { type: 'file', path: 'lib/markos/marketing/demo-sandbox.cjs' },
      { type: 'file', path: 'lib/markos/auth/botid.cjs' },
      { type: 'grep', path: 'api/webhooks/subscribe.js', pattern: 'validateWebhookUrl', sample: 'const { validateWebhookUrl } = require(' },
      { type: 'grep', path: 'api/mcp/session.js', pattern: 'verifyBearer', sample: 'const { verifyBearer } = require(' },
      { type: 'grep', path: 'app/(marketing)/integrations/claude/demo/page.tsx', pattern: 'Demo mode', sample: 'Demo mode' },
    ],
  },
  {
    id: 13,
    name: 'rollback',
    checks: [
      { type: 'file', path: 'supabase/migrations/rollback/70_markos_webhook_subscriptions.down.sql' },
      { type: 'file', path: 'supabase/migrations/rollback/70.1_markos_webhook_delivery_nonces.down.sql' },
      { type: 'file', path: 'supabase/migrations/rollback/70.2_markos_webhook_secret_vault.down.sql' },
      { type: 'file', path: 'supabase/migrations/rollback/71.1_markos_mcp_auth_and_cost.down.sql' },
    ],
  },
  {
    id: 14,
    name: 'accessibility',
    deferred: 'with-followup',
    checks: [
      { type: 'file', path: 'test/ui-a11y/213-5-marketing-a11y.test.js' },
      {
        type: 'grep',
        path: VERIFICATION_PATH,
        pattern: 'evidence:\\s*phase-201 surfaces 1-8 axe scans',
        sample: 'evidence: phase-201 surfaces 1-8 axe scans',
      },
      {
        type: 'grep',
        path: VERIFICATION_PATH,
        pattern: 'followup:\\s*phase-200\\.2 axe coverage on phase-200 surfaces',
        sample: 'followup: phase-200.2 axe coverage on phase-200 surfaces',
      },
    ],
  },
  {
    id: 15,
    name: 'docs-as-code',
    checks: [
      { type: 'file', path: 'public/llms.txt' },
      { type: 'file', path: 'app/docs/llms-full.txt/route.ts' },
      { type: 'file', path: 'app/(marketing)/docs/[[...slug]]/page.tsx' },
      { type: 'file', path: 'contracts/F-71.1-mcp-auth-bearer-v1.yaml' },
      { type: 'file', path: 'contracts/F-72.1-webhook-rotation-v1.yaml' },
      { type: 'grep', path: 'public/llms.txt', pattern: 'OpenAPI Reference', sample: 'OpenAPI Reference' },
    ],
  },
];

const CONCERNS = [
  { id: 'H1', plan: '200.1-01', evidence: ['lib/markos/webhooks/url-validator.cjs'] },
  { id: 'H2', plan: '200.1-05', evidence: ['lib/markos/webhooks/replay-protection.cjs', 'supabase/migrations/70.1_markos_webhook_delivery_nonces.sql'] },
  { id: 'H3', plan: '200.1-06', evidence: ['lib/markos/webhooks/secret-vault.cjs', 'supabase/migrations/70.2_markos_webhook_secret_vault.sql', 'api/webhooks/rotate-secret.js'] },
  { id: 'H4', plan: '200.1-07', evidence: ['lib/markos/mcp/auth-bearer.cjs', 'supabase/migrations/71.1_markos_mcp_auth_and_cost.sql'] },
  { id: 'H5', plan: '200.1-10', evidence: ['lib/markos/marketing/demo-sandbox.cjs', 'app/(marketing)/integrations/claude/demo/api/issue-token/route.ts', 'app/(marketing)/integrations/claude/demo/api/invoke/route.ts'] },
  { id: 'H6', plan: '200.1-04', evidence: ['.planning/phases/200.1-saas-readiness-hardening/threat-models/mcp-stride.md', '.planning/phases/200.1-saas-readiness-hardening/threat-models/webhooks-stride.md', '.planning/phases/200.1-saas-readiness-hardening/threat-models/marketplace-stride.md'] },
  { id: 'H7', plan: '200.1-11', evidence: [VERIFICATION_PATH, 'scripts/verify/verify-phase-200.cjs', 'test/verify/verify-phase-200.test.js'] },
  { id: 'M3', plan: '200.1-02', evidence: ['supabase/migrations/rollback/70_markos_webhook_subscriptions.down.sql'] },
  { id: 'M4', plan: '200.1-08', evidence: ['lib/markos/evals/mcp/draft_message.eval.js'] },
  { id: 'M5', plan: '200.1-09', evidence: ['lib/markos/observability/otel.cjs'] },
  { id: 'M9', plan: '200.1-03', evidence: ['scripts/ci/check-preset-parity.cjs', '.github/workflows/preset-parity.yml'] },
  { id: 'M10', plan: '200.1-11', evidence: [VERIFICATION_PATH] },
];

function resolvePath(root, targetPath) {
  return path.resolve(root, targetPath);
}

function fileExists(root, targetPath) {
  return fs.existsSync(resolvePath(root, targetPath));
}

function readFile(root, targetPath) {
  return fs.readFileSync(resolvePath(root, targetPath), 'utf8');
}

function ensureRegex(pattern) {
  return pattern instanceof RegExp ? pattern : new RegExp(pattern, 'm');
}

function formatCheckLabel(check) {
  if (check.type === 'file') return `${check.path} exists`;
  return `${check.path} matches ${check.type}`;
}

function evaluateCheck(root, check) {
  if (check.type === 'file') {
    const pass = fileExists(root, check.path);
    return {
      pass,
      evidence: formatCheckLabel(check),
      missing: `${check.path}: missing file`,
    };
  }

  if (!fileExists(root, check.path)) {
    return {
      pass: false,
      evidence: formatCheckLabel(check),
      missing: `${check.path}: missing file for ${check.type}`,
    };
  }

  const source = readFile(root, check.path);

  if (check.type === 'grep') {
    const pass = ensureRegex(check.pattern).test(source);
    return {
      pass,
      evidence: `${check.path}: pattern present`,
      missing: `${check.path}: pattern missing (${check.pattern})`,
    };
  }

  if (check.type === 'grep-any') {
    const pass = check.patterns.some((pattern) => ensureRegex(pattern).test(source));
    return {
      pass,
      evidence: `${check.path}: one-of pattern present`,
      missing: `${check.path}: none of the expected patterns were present`,
    };
  }

  if (check.type === 'coverage-exclusion-list') {
    if (/0 excluded tests after gate-4 remediation/.test(source)) {
      return {
        pass: true,
        evidence: `${check.path}: explicit zero-exclusion escape hatch present`,
        missing: `${check.path}: missing coverage exclusion table or zero-exclusion escape hatch`,
      };
    }

    const hasHeading = /###\s+Coverage Exclusion List/.test(source);
    const hasColumns = /\|\s*Test File\s*\|\s*Status\s*\|\s*Owner Phase\s*\|\s*Rationale\s*\|/.test(source);
    const rowLines = source.split(/\r?\n/).filter((line) => /^\|\s*[^-].*\|/.test(line));
    const dataRows = rowLines.filter((line) => !/\|\s*Test File\s*\|/.test(line)).length;
    const pass = hasHeading && hasColumns && dataRows >= 10;
    return {
      pass,
      evidence: `${check.path}: coverage exclusion table with ${dataRows} data rows`,
      missing: `${check.path}: coverage exclusion list must have heading, columns, and >=10 data rows`,
    };
  }

  throw new Error(`Unsupported check type: ${check.type}`);
}

function checkGate(root, gate) {
  const evidence = [];
  const missing = [];

  for (const check of gate.checks || []) {
    const result = evaluateCheck(root, check);
    if (result.pass) evidence.push(result.evidence);
    else missing.push(result.missing);
  }

  return {
    pass: missing.length === 0,
    evidence,
    missing,
  };
}

function parseArgs(argv = process.argv) {
  const raw = Array.isArray(argv)
    ? (argv.length && String(argv[0]).startsWith('--') ? argv.slice() : argv.slice(2))
    : [];
  const args = {
    dryRun: false,
    fixtureRoot: process.cwd(),
  };

  for (let index = 0; index < raw.length; index += 1) {
    const token = raw[index];
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--fixture-root') {
      index += 1;
      if (index >= raw.length) throw new Error('--fixture-root requires a value');
      args.fixtureRoot = path.resolve(raw[index]);
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function formatScalar(value) {
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function toYaml(value, indent = '') {
  if (Array.isArray(value)) {
    if (value.length === 0) return `${indent}[]`;
    return value.map((item) => {
      if (item && typeof item === 'object') {
        const body = toYaml(item, `${indent}  `).split('\n');
        return `${indent}- ${body[0].trimStart()}\n${body.slice(1).join('\n')}`;
      }
      return `${indent}- ${formatScalar(item)}`;
    }).join('\n');
  }

  if (value && typeof value === 'object') {
    const lines = [];
    for (const [key, child] of Object.entries(value)) {
      if (child && typeof child === 'object') {
        if (Array.isArray(child) && child.length === 0) {
          lines.push(`${indent}${key}: []`);
          continue;
        }
        lines.push(`${indent}${key}:`);
        lines.push(toYaml(child, `${indent}  `));
        continue;
      }
      lines.push(`${indent}${key}: ${formatScalar(child)}`);
    }
    return lines.join('\n');
  }

  return `${indent}${formatScalar(value)}`;
}

function writeStdout(io, message) {
  if (io && typeof io.stdout === 'function') {
    io.stdout(message);
    return;
  }
  console.log(message);
}

function writeStderr(io, message) {
  if (io && typeof io.stderr === 'function') {
    io.stderr(message);
    return;
  }
  console.error(message);
}

function appendVerifierBlock(root, payload) {
  const verificationFile = resolvePath(root, VERIFICATION_PATH);
  if (!fs.existsSync(verificationFile)) {
    throw new Error(`${VERIFICATION_PATH}: missing verification report for write-back`);
  }

  const yaml = toYaml(payload);
  const block = `${GENERATED_BLOCK_START}\n\`\`\`yaml\n${yaml}\n\`\`\`\n${GENERATED_BLOCK_END}`;
  const source = fs.readFileSync(verificationFile, 'utf8');
  const pattern = new RegExp(`${GENERATED_BLOCK_START}[\\s\\S]*?${GENERATED_BLOCK_END}`, 'm');
  const next = pattern.test(source)
    ? source.replace(pattern, block)
    : `${source.trimEnd()}\n\n${block}\n`;
  fs.writeFileSync(verificationFile, next, 'utf8');
}

function main(argv = process.argv, io = console) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    writeStderr(io, `verify-phase-200 argument error: ${error.message}`);
    return { exitCode: 2, error: error.message };
  }

  const root = args.fixtureRoot;
  const missingPrerequisites = REQUIRED_SUMMARIES.filter((summaryPath) => !fileExists(root, summaryPath));
  const gateResults = {};
  const concernResults = {};
  let anyFailed = false;

  for (const gate of GATES) {
    if (gate.deferred && (!gate.checks || gate.checks.length === 0) && !EMPTY_CHECKS_ALLOWLIST.has(gate.name)) {
      const message = `gate ${gate.id} (${gate.name}) has empty checks array but is not on EMPTY_CHECKS_ALLOWLIST - refusing to silently pass`;
      writeStderr(io, message);
      return { exitCode: 2, error: message };
    }

    if (gate.deferred && (!gate.checks || gate.checks.length === 0)) {
      gateResults[gate.id] = { name: gate.name, status: `deferred-${gate.deferred}`, checks: 0 };
      continue;
    }

    const result = checkGate(root, gate);
    const status = result.pass
      ? (gate.deferred ? `deferred-${gate.deferred}` : 'pass')
      : 'fail';
    gateResults[gate.id] = {
      name: gate.name,
      status,
      evidence: result.evidence,
      missing: result.missing,
    };
    if (!result.pass) anyFailed = true;
  }

  for (const concern of CONCERNS) {
    const missingEvidence = concern.evidence.filter((targetPath) => !fileExists(root, targetPath));
    concernResults[concern.id] = {
      plan: concern.plan,
      status: missingEvidence.length === 0 ? 'closed' : 'open',
      evidence: concern.evidence,
      missing: missingEvidence,
    };
    if (missingEvidence.length > 0) anyFailed = true;
  }

  if (missingPrerequisites.length > 0) {
    anyFailed = true;
  }

  const summary = {
    gates_passed: Object.values(gateResults).filter((gate) => gate.status === 'pass').length,
    gates_failed: Object.values(gateResults).filter((gate) => gate.status === 'fail').length,
    gates_deferred: Object.values(gateResults).filter((gate) => String(gate.status).startsWith('deferred-')).length,
    concerns_closed: Object.values(concernResults).filter((concern) => concern.status === 'closed').length,
    concerns_open: Object.values(concernResults).filter((concern) => concern.status === 'open').length,
  };

  const verdict = anyFailed ? 'FAIL' : 'PASS-with-deferred-items';
  const payload = {
    run_at: new Date().toISOString(),
    version: '1.0.0',
    verdict,
    missing_prerequisites: missingPrerequisites,
    summary,
    gates: gateResults,
    concerns: concernResults,
  };

  if (args.dryRun) {
    writeStdout(io, JSON.stringify(payload, null, 2));
    return { exitCode: anyFailed ? 1 : 0, payload };
  }

  try {
    appendVerifierBlock(root, payload);
  } catch (error) {
    writeStderr(io, `verify-phase-200 write error: ${error.message}`);
    return { exitCode: 1, payload, error: error.message };
  }

  if (missingPrerequisites.length > 0) {
    writeStderr(io, `verify-phase-200 missing-prerequisites: ${missingPrerequisites.join(', ')}`);
  }

  writeStdout(
    io,
    `verify-phase-200: verdict=${verdict} gates=${Object.keys(gateResults).length} concerns=${Object.keys(concernResults).length}`,
  );
  return { exitCode: anyFailed ? 1 : 0, payload };
}

if (require.main === module) {
  const result = main(process.argv, console);
  process.exit(result.exitCode);
}

module.exports = { GATES, CONCERNS, EMPTY_CHECKS_ALLOWLIST, checkGate, parseArgs, main };
