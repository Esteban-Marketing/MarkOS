#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const PROVIDERS = Object.freeze(['anthropic', 'openai', 'gemini']);

function parseStatusArgs(cli = {}) {
  const month = cli.month ? String(cli.month).trim() : currentMonthKey(new Date());
  const exportFormat = cli.exportFormat ? String(cli.exportFormat).trim().toLowerCase() : null;
  const providers = Boolean(cli.providers);

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month must be in YYYY-MM format.');
  }

  if (exportFormat && exportFormat !== 'csv') {
    throw new Error('Only --export=csv is supported.');
  }

  return { month, exportFormat, providers };
}

function currentMonthKey(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function monthBounds(monthKey) {
  const [year, month] = monthKey.split('-').map((value) => Number(value));
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

function readProjectSlug(cwd) {
  try {
    const configPath = path.join(cwd, '.markos-project.json');
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return typeof parsed.project_slug === 'string' && parsed.project_slug.trim()
      ? parsed.project_slug.trim()
      : 'default-workspace';
  } catch {
    return 'default-workspace';
  }
}

function createSupabaseClient(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function aggregateEvents(events) {
  const rows = {
    anthropic: { provider: 'anthropic', calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    openai: { provider: 'openai', calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    gemini: { provider: 'gemini', calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
  };

  for (const event of events) {
    const provider = String(event.provider || '').toLowerCase();
    if (!rows[provider]) continue;
    rows[provider].calls += 1;
    rows[provider].inputTokens += Number(event.input_tokens || 0);
    rows[provider].outputTokens += Number(event.output_tokens || 0);
    rows[provider].cost = Number((rows[provider].cost + Number(event.estimated_cost_usd || 0)).toFixed(6));
  }

  return rows;
}

function buildUsageSummary(events, budgetUsd) {
  const byProvider = aggregateEvents(events);
  const providers = PROVIDERS.map((provider) => byProvider[provider]);
  const totals = providers.reduce(
    (acc, item) => {
      acc.calls += item.calls;
      acc.inputTokens += item.inputTokens;
      acc.outputTokens += item.outputTokens;
      acc.cost = Number((acc.cost + item.cost).toFixed(6));
      return acc;
    },
    { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
  );

  const budget = Number(Number(budgetUsd || 0).toFixed(2));
  const percentUsed = budget > 0 ? Number(((totals.cost / budget) * 100).toFixed(2)) : 0;
  const remaining = Number(Math.max(0, budget - totals.cost).toFixed(6));

  return {
    providers,
    totals,
    budget,
    percentUsed,
    remaining,
  };
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function padCell(value, width, align = 'left') {
  const text = String(value);
  if (text.length >= width) return text;
  const padding = ' '.repeat(width - text.length);
  return align === 'right' ? `${padding}${text}` : `${text}${padding}`;
}

function renderStatusTable(monthLabel, summary) {
  const lines = [];
  lines.push(`LLM Usage & Cost (${monthLabel})`);
  lines.push('Provider   Calls   Cost(USD)   % Budget');
  lines.push('---------  ------  ----------  --------');

  for (const provider of summary.providers) {
    const percent = summary.budget > 0 ? `${((provider.cost / summary.budget) * 100).toFixed(2)}%` : '0.00%';
    lines.push(
      [
        padCell(provider.provider, 9),
        padCell(provider.calls, 6, 'right'),
        padCell(formatCurrency(provider.cost), 10, 'right'),
        padCell(percent, 8, 'right'),
      ].join('  '),
    );
  }

  lines.push('---------  ------  ----------  --------');
  lines.push(
    [
      padCell('total', 9),
      padCell(summary.totals.calls, 6, 'right'),
      padCell(formatCurrency(summary.totals.cost), 10, 'right'),
      padCell(`${summary.percentUsed.toFixed(2)}%`, 8, 'right'),
    ].join('  '),
  );
  lines.push(`Budget: ${formatCurrency(summary.budget)} | Remaining: ${formatCurrency(summary.remaining)}`);

  if (summary.percentUsed >= 100) {
    lines.push('WARNING: Budget limit reached (100%).');
  } else if (summary.percentUsed >= 80) {
    lines.push(`WARNING: ${summary.percentUsed.toFixed(2)}% of monthly budget consumed.`);
  }

  return lines.join('\n');
}

function exportCsv(summary) {
  const rows = [['provider', 'calls', 'input_tokens', 'output_tokens', 'cost_usd']];
  for (const provider of summary.providers) {
    rows.push([
      provider.provider,
      String(provider.calls),
      String(provider.inputTokens),
      String(provider.outputTokens),
      provider.cost.toFixed(6),
    ]);
  }

  rows.push([
    'total',
    String(summary.totals.calls),
    String(summary.totals.inputTokens),
    String(summary.totals.outputTokens),
    summary.totals.cost.toFixed(6),
  ]);

  rows.push(['budget', '', '', '', summary.budget.toFixed(2)]);
  rows.push(['remaining', '', '', '', summary.remaining.toFixed(6)]);
  rows.push(['percent_used', '', '', '', summary.percentUsed.toFixed(2)]);

  return rows.map((row) => row.join(',')).join('\n');
}

async function fetchUsageData({ supabase, workspaceId, operatorId, month }) {
  const bounds = monthBounds(month);

  const { data: prefData, error: prefError } = await supabase
    .from('markos_operator_llm_preferences')
    .select('cost_budget_monthly_usd,available_providers,primary_provider')
    .eq('workspace_id', workspaceId)
    .eq('operator_id', operatorId)
    .maybeSingle();

  if (prefError) {
    throw new Error(`Failed to load preferences: ${prefError.message}`);
  }

  const { data: eventData, error: eventsError } = await supabase
    .from('markos_llm_call_events')
    .select('provider,input_tokens,output_tokens,estimated_cost_usd,created_at')
    .eq('workspace_id', workspaceId)
    .eq('operator_id', operatorId)
    .gte('created_at', bounds.from)
    .lt('created_at', bounds.to)
    .order('created_at', { ascending: true });

  if (eventsError) {
    throw new Error(`Failed to load usage events: ${eventsError.message}`);
  }

  return {
    budget: Number(prefData?.cost_budget_monthly_usd || 100),
    events: Array.isArray(eventData) ? eventData : [],
    preferences: prefData || null,
  };
}

async function fetchProviderStatus({ supabase, workspaceId, operatorId }) {
  const { data: prefData, error: prefError } = await supabase
    .from('markos_operator_llm_preferences')
    .select('available_providers,primary_provider')
    .eq('workspace_id', workspaceId)
    .eq('operator_id', operatorId)
    .maybeSingle();

  if (prefError) {
    throw new Error(`Failed to load provider preferences: ${prefError.message}`);
  }

  const { data: keyRows, error: keyError } = await supabase
    .from('markos_operator_api_keys')
    .select('provider,updated_at')
    .eq('workspace_id', workspaceId)
    .eq('operator_id', operatorId);

  if (keyError) {
    throw new Error(`Failed to load provider keys: ${keyError.message}`);
  }

  const configured = new Set((Array.isArray(keyRows) ? keyRows : []).map((row) => String(row.provider || '').toLowerCase()));
  const available = Array.isArray(prefData?.available_providers) ? prefData.available_providers : [];

  return PROVIDERS.map((provider) => ({
    provider,
    configured: configured.has(provider),
    enabled: available.includes(provider),
    primary: prefData?.primary_provider === provider,
  }));
}

async function runLLMStatusCLI(options = {}) {
  const cli = options.cli || {};
  const output = options.output || console.log;
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();
  const args = parseStatusArgs(cli);

  const workspaceId = env.MARKOS_WORKSPACE_ID || readProjectSlug(cwd);
  const operatorId = env.MARKOS_OPERATOR_ID || 'operator-local';

  const supabase = options.supabase || createSupabaseClient(env);

  if (args.providers) {
    const providerRows = await fetchProviderStatus({ supabase, workspaceId, operatorId });
    const lines = ['Configured Providers', 'provider    enabled    configured    primary', '---------   -------    ----------    -------'];

    for (const row of providerRows) {
      lines.push(
        [
          padCell(row.provider, 9),
          padCell(row.enabled ? 'yes' : 'no', 7),
          padCell(row.configured ? 'yes' : 'no', 10),
          padCell(row.primary ? 'yes' : 'no', 7),
        ].join('  '),
      );
    }

    output(lines.join('\n'));
    return { ok: true, mode: 'providers', rows: providerRows };
  }

  const usage = await fetchUsageData({ supabase, workspaceId, operatorId, month: args.month });
  const summary = buildUsageSummary(usage.events, usage.budget);

  if (args.exportFormat === 'csv') {
    const csv = exportCsv(summary);
    output(csv);
    return { ok: true, mode: 'csv', csv, summary };
  }

  output(renderStatusTable(args.month, summary));
  return { ok: true, mode: 'table', summary };
}

if (require.main === module) {
  runLLMStatusCLI()
    .then((result) => {
      if (!result.ok) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(`✗ ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  parseStatusArgs,
  monthBounds,
  aggregateEvents,
  buildUsageSummary,
  renderStatusTable,
  exportCsv,
  runLLMStatusCLI,
};
