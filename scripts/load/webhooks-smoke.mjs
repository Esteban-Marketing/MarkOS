#!/usr/bin/env node
// Phase 203 Plan 10 Task 3 — k6-equivalent load smoke test for webhooks (QA-07).
// 60 concurrent clients × 60s targeting POST /api/webhooks/test-fire.
//
// Env:
//   MARKOS_WEBHOOK_SMOKE_BASE_URL   (required for live run; omitted → dry-run exit 0)
//   MARKOS_WEBHOOK_SMOKE_SUB_ID     (required for live run — target subscription)
//   MARKOS_WEBHOOK_SMOKE_TENANT_ID  (required for live run — tenant header)
//   MARKOS_WEBHOOK_SMOKE_USER_ID    (required for live run — user header)
//   WEBHOOK_LOAD_CONCURRENCY        (default: 60)
//   WEBHOOK_LOAD_DURATION_MS        (default: 60000)
//
// Exits:
//   0 on success (p95 <= 500ms, error rate <= 1%, dry-run)
//   1 on SLO breach
//
// Gate: p95 <= 500ms (higher than MCP's 300ms because webhook delivery includes
// subscriber round-trip; QA-07 contract for webhook path specifically).
// Gate: error rate <= 0.01 (1%).
// Mirror shape of scripts/load/mcp-smoke.mjs (202-10).

const BASE_URL = process.env.MARKOS_WEBHOOK_SMOKE_BASE_URL;
const SUB_ID = process.env.MARKOS_WEBHOOK_SMOKE_SUB_ID;
const TENANT_ID = process.env.MARKOS_WEBHOOK_SMOKE_TENANT_ID;
const USER_ID = process.env.MARKOS_WEBHOOK_SMOKE_USER_ID;
const CONCURRENCY = parseInt(process.env.WEBHOOK_LOAD_CONCURRENCY || '60', 10);
const DURATION_MS = parseInt(process.env.WEBHOOK_LOAD_DURATION_MS || '60000', 10);

// p95 + error-rate thresholds — hardcoded so grep assertions (500 / 0.01) catch drift.
const P95_MS_THRESHOLD = 500;
const ERROR_RATE_THRESHOLD = 0.01;

if (!BASE_URL) {
  console.log('[dry-run] webhook smoke skipped — MARKOS_WEBHOOK_SMOKE_BASE_URL unset.');
  console.log('TODO: set MARKOS_WEBHOOK_SMOKE_BASE_URL + SUB_ID + TENANT_ID + USER_ID for real smoke before GA sign-off.');
  process.exit(0);
}

if (!SUB_ID || !TENANT_ID || !USER_ID) {
  console.error('FAIL: MARKOS_WEBHOOK_SMOKE_BASE_URL set but SUB_ID/TENANT_ID/USER_ID missing.');
  process.exit(1);
}

async function oneCall() {
  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}/api/webhooks/test-fire`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-markos-user-id': USER_ID,
      'x-markos-tenant-id': TENANT_ID,
    },
    body: JSON.stringify({ subscription_id: SUB_ID, event: 'smoke.test-fire' }),
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
const errorRate = errors / Math.max(total, 1);

console.log(JSON.stringify({
  total_calls: total,
  duration_ms: DURATION_MS,
  concurrency: CONCURRENCY,
  p50,
  p95,
  p99,
  status_histogram: statusHist,
  error_count: errors,
  error_rate: errorRate,
  rate_429: rate429,
  slo_webhook_p95_500ms: p95 <= P95_MS_THRESHOLD,
  slo_webhook_err_1pct: errorRate <= ERROR_RATE_THRESHOLD,
}, null, 2));

if (p95 > P95_MS_THRESHOLD) {
  console.error(`FAIL: p95=${p95}ms exceeds ${P95_MS_THRESHOLD}ms SLO (QA-07 webhook)`);
  process.exit(1);
}
if (total > 0 && errorRate > ERROR_RATE_THRESHOLD) {
  console.error(`FAIL: error_rate=${(errorRate * 100).toFixed(2)}% exceeds ${ERROR_RATE_THRESHOLD * 100}%`);
  process.exit(1);
}
console.log('PASS: webhook load smoke meets QA-07 SLO (p95 <= 500ms, err <= 1%)');
