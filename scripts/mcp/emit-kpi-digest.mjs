#!/usr/bin/env node
// Phase 202 Plan 10 Task 3: weekly KPI digest. D-23 target: >= 50 installs in 30 days.
//
// Pure function module — computeWeeklyKpi + sendDigest are exported for CLI use + wrapping
// by api/cron/mcp-kpi-digest.js (Vercel cron).
//
// Env (when called directly as CLI):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   — datastore
//   RESEND_API_KEY                                        — email (optional; falls back to console)
//   KPI_DIGEST_TO                                         — target email (default founders@markos.dev)

export async function computeWeeklyKpi(supabase) {
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const installsQuery = await supabase
    .from('markos_audit_log')
    .select('tenant_id, created_at')
    .eq('source_domain', 'mcp')
    .eq('action', 'session.created')
    .gt('created_at', weekAgoIso);
  const installs = installsQuery.data || [];

  const invocationsQuery = await supabase
    .from('markos_audit_log')
    .select('payload')
    .eq('source_domain', 'mcp')
    .eq('action', 'tool.invoked')
    .gt('created_at', weekAgoIso);
  const invocations = invocationsQuery.data || [];

  const byTool = new Map();
  let totalCost = 0;
  const durations = [];
  for (const row of invocations) {
    const p = row.payload || {};
    const tool = p.tool_id;
    const cost = Number(p.cost_cents || 0);
    if (!tool) continue;
    const cur = byTool.get(tool) || { tool, calls: 0, cost_cents: 0 };
    cur.calls += 1;
    cur.cost_cents += cost;
    byTool.set(tool, cur);
    totalCost += cost;
    if (typeof p.duration_ms === 'number') durations.push(p.duration_ms);
  }
  durations.sort((a, b) => a - b);
  const p95 = durations.length ? durations[Math.floor(durations.length * 0.95)] : 0;
  const top_tools = Array.from(byTool.values())
    .sort((a, b) => b.cost_cents - a.cost_cents || a.calls - b.calls)
    .slice(0, 5);

  return {
    window: '7d',
    installs: installs.length,
    tenants_with_installs: new Set(installs.map((i) => i.tenant_id)).size,
    invocations: invocations.length,
    total_cost_cents: totalCost,
    p95_ms: p95,
    top_tools,
    generated_at: new Date().toISOString(),
  };
}

export async function sendDigest(digest, resendKey) {
  if (!resendKey) {
    console.log(JSON.stringify(digest, null, 2));
    return { sent: false, reason: 'no_resend_key' };
  }
  let Resend;
  try {
    const mod = await import('resend');
    Resend = mod.Resend || mod.default || null;
  } catch {
    console.log(JSON.stringify(digest, null, 2));
    return { sent: false, reason: 'resend_unavailable' };
  }
  if (!Resend) {
    console.log(JSON.stringify(digest, null, 2));
    return { sent: false, reason: 'resend_unavailable' };
  }
  const resend = new Resend(resendKey);
  const subject = `MarkOS MCP — Weekly KPI (${digest.installs} installs)`;
  const html = [
    '<h2>Weekly KPI</h2>',
    `<p>Installs: ${digest.installs}</p>`,
    `<p>Tenants with installs: ${digest.tenants_with_installs}</p>`,
    `<p>Invocations: ${digest.invocations}</p>`,
    `<p>Total cost: $${(digest.total_cost_cents / 100).toFixed(2)}</p>`,
    `<p>p95 latency: ${digest.p95_ms}ms</p>`,
    '<h3>Top tools by cost</h3>',
    '<ul>',
    ...digest.top_tools.map(
      (t) => `<li>${t.tool} — ${t.calls} calls / $${(t.cost_cents / 100).toFixed(2)}</li>`
    ),
    '</ul>',
  ].join('\n');
  await resend.emails.send({
    from: 'kpi@markos.dev',
    to: process.env.KPI_DIGEST_TO || 'founders@markos.dev',
    subject,
    html,
  });
  return { sent: true };
}

// CLI entry — only runs when invoked directly.
const isDirectRun = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`
  || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/').split('/').pop() || '');
if (isDirectRun) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const digest = await computeWeeklyKpi(supabase);
  const outcome = await sendDigest(digest, process.env.RESEND_API_KEY);
  console.log(JSON.stringify({ digest, outcome }, null, 2));
}
