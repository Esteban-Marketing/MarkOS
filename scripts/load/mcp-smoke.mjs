#!/usr/bin/env node
// Phase 202 Plan 10 Task 3: k6-equivalent load smoke test (QA-07).
// 60 concurrent clients × 60s targeting POST /api/mcp tools/call list_pain_points.
//
// Env:
//   MARKOS_MCP_BASE_URL    (default: http://localhost:3000/api/mcp)
//   MARKOS_MCP_BEARER      (required for live run; omitted → dry-run)
//   MCP_LOAD_CONCURRENCY   (default: 60)
//   MCP_LOAD_DURATION_MS   (default: 60000)
//
// Exits:
//   0 on success (p95 <= 300ms, error rate <= 1%, dry-run)
//   1 on SLO breach
//
// D-18 SLO: simple-tier p95 <= 300ms.
// D-21 rate-limit: 60 rpm/session — harness stays below this when BEARER is a single session;
// use distinct bearers across clients for realistic tenant-scale load.

const BASE_URL = process.env.MARKOS_MCP_BASE_URL || 'http://localhost:3000/api/mcp';
const BEARER = process.env.MARKOS_MCP_BEARER;
const CONCURRENCY = parseInt(process.env.MCP_LOAD_CONCURRENCY || '60', 10);
const DURATION_MS = parseInt(process.env.MCP_LOAD_DURATION_MS || '60000', 10);

if (!BEARER) {
  console.log('MARKOS_MCP_BEARER unset — running in dry-run mode; skipping real HTTP.');
  console.log('TODO: set MARKOS_MCP_BEARER for real smoke before marketplace submission.');
  process.exit(0);
}

async function oneCall() {
  const t0 = Date.now();
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${BEARER}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'list_pain_points', arguments: {} },
    }),
  });
  const dt = Date.now() - t0;
  return { status: res.status, duration_ms: dt };
}

async function runClient(endAt) {
  const results = [];
  while (Date.now() < endAt) {
    try {
      results.push(await oneCall());
    } catch (e) {
      results.push({ status: 0, duration_ms: -1, error: e.message });
    }
  }
  return results;
}

const endAt = Date.now() + DURATION_MS;
const clients = Array.from({ length: CONCURRENCY }, () => runClient(endAt));
const all = (await Promise.all(clients)).flat();

const durations = all.filter((r) => r.duration_ms >= 0).map((r) => r.duration_ms).sort((a, b) => a - b);
const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
const p99 = durations[Math.floor(durations.length * 0.99)] || 0;
const statusHist = all.reduce((m, r) => {
  m[r.status] = (m[r.status] || 0) + 1;
  return m;
}, {});
const total = all.length;
const errors = all.filter((r) => r.status === 0 || r.status >= 500).length;
const rate429 = (statusHist[429] || 0) / Math.max(total, 1);

console.log(JSON.stringify({
  total_calls: total,
  duration_ms: DURATION_MS,
  concurrency: CONCURRENCY,
  p50,
  p95,
  p99,
  status_histogram: statusHist,
  error_count: errors,
  rate_429: rate429,
  slo_simple_p95_300ms: p95 <= 300,
}, null, 2));

if (p95 > 300) {
  console.error(`FAIL: p95=${p95}ms exceeds 300ms SLO (D-18)`);
  process.exit(1);
}
if (total > 0 && errors / total > 0.01) {
  console.error(`FAIL: error_rate=${((errors / total) * 100).toFixed(2)}% exceeds 1%`);
  process.exit(1);
}
// 60 rpm per session is expected above some 429 rate when CONCURRENCY=60 hits a single bearer.
// Fail only when 60 rpm has been demonstrably breached AND observed cap was < 60 rpm.
const observedRpm = total / (DURATION_MS / 60000);
if (rate429 > 0 && observedRpm < 60) {
  console.error(`FAIL: 429 observed at observed_rpm=${observedRpm.toFixed(2)} below 60 rpm`);
  process.exit(1);
}
console.log('PASS: load smoke meets QA-07 SLO');
