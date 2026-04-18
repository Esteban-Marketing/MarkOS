'use strict';

// Phase 202 Plan 06: 10 live tool descriptors (2 retained from Phase 200 + 8 wave-0 wired).
// Plan 202-07 extends to 30 with 20 net-new handler files + F-90..F-93 contracts.
//
// Descriptor contract (ToolDescriptor):
//   { name, description, latency_tier: 'simple'|'llm'|'long',
//     mutating: boolean, cost_model: { base_cents, model, avg_tokens? },
//     inputSchema: JSONSchema, outputSchema: JSONSchema,
//     handler({ args, session, req_id, supabase, redis, deps, _meta }) => { content, _usage? },
//     preview?(args) => object (only when mutating) }
//
// Plan 202-04's pipeline.cjs builds a registry from these descriptors and is the
// sole admission path for tool invocation. `invokeTool` below delegates to the
// handler directly for backwards-compat with Phase 200 callers (api/mcp/session.js
// + api/mcp/tools/[toolName].js + legacy test/mcp/server.test.js).

const { COST_TABLE } = require('../cost-table.cjs');

// --- Phase 200 retained tools (refactored to new descriptor shape) -----------

const draftMessage = {
  name: 'draft_message',
  description: 'Generate a single marketing draft from a channel + audience + pain + promise + brand brief.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.draft_message,
  inputSchema: {
    type: 'object',
    required: ['channel', 'audience', 'pain', 'promise', 'brand'],
    additionalProperties: false,
    properties: {
      channel: { type: 'string', enum: ['email', 'x', 'linkedin', 'sms'] },
      audience: { type: 'string', minLength: 1, maxLength: 500 },
      pain: { type: 'string', minLength: 1, maxLength: 1000 },
      promise: { type: 'string', minLength: 1, maxLength: 1000 },
      brand: { type: 'string', minLength: 1, maxLength: 200 },
    },
  },
  outputSchema: {
    type: 'object', required: ['content', '_usage'], additionalProperties: true,
    properties: {
      content: {
        type: 'array',
        items: {
          type: 'object', required: ['type', 'text'],
          properties: { type: { enum: ['text'] }, text: { type: 'string' } },
        },
      },
      _usage: {
        type: 'object', required: ['input_tokens', 'output_tokens'],
        properties: {
          input_tokens: { type: 'integer', minimum: 0 },
          output_tokens: { type: 'integer', minimum: 0 },
        },
      },
    },
  },
  handler: async (ctx) => {
    const args = ctx?.args || {};
    const { runDraft } = require('../../../../bin/lib/generate-runner.cjs');
    const result = await runDraft(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      _usage: { input_tokens: result.input_tokens || 0, output_tokens: result.output_tokens || 0 },
    };
  },
};

const runNeuroAudit = {
  name: 'run_neuro_audit',
  description: 'Run a neuro-audit pass over a draft and return scored issues.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.run_neuro_audit,
  inputSchema: {
    type: 'object', required: ['text'], additionalProperties: false,
    properties: {
      text: { type: 'string', minLength: 1, maxLength: 10000 },
      brief: { type: 'object', additionalProperties: true },
    },
  },
  outputSchema: {
    type: 'object', required: ['content'], additionalProperties: true,
    properties: {
      content: {
        type: 'array',
        items: {
          type: 'object', required: ['type', 'text'],
          properties: { type: { enum: ['text'] }, text: { type: 'string' } },
        },
      },
    },
  },
  handler: async (ctx) => {
    const args = ctx?.args || {};
    const { auditDraft } = require('../../../../bin/lib/generate-runner.cjs');
    const audit = auditDraft({ text: args.text }, args.brief || {});
    return { content: [{ type: 'text', text: JSON.stringify(audit, null, 2) }] };
  },
};

// --- Wave-0 stubs graduated to live (Plan 202-06) ----------------------------

const { descriptor: planCampaign }       = require('./marketing/plan-campaign.cjs');
const { descriptor: researchAudience }   = require('./marketing/research-audience.cjs');
const { descriptor: generateBrief }      = require('./marketing/generate-brief.cjs');
const { descriptor: auditClaim }         = require('./marketing/audit-claim.cjs');
const { descriptor: listPainPoints }     = require('./literacy/list-pain-points.cjs');
const { descriptor: rankExecutionQueue } = require('./execution/rank-execution-queue.cjs');
const { descriptor: schedulePost }       = require('./execution/schedule-post.cjs');
const { descriptor: explainLiteracy }    = require('./literacy/explain-literacy.cjs');

const TOOL_DEFINITIONS = [
  draftMessage,
  planCampaign,
  researchAudience,
  runNeuroAudit,
  generateBrief,
  auditClaim,
  listPainPoints,
  rankExecutionQueue,
  schedulePost,
  explainLiteracy,
];

const TOOLS_BY_NAME = Object.freeze(Object.fromEntries(TOOL_DEFINITIONS.map((t) => [t.name, t])));

// MCP spec tools/list shape: name + description + inputSchema only.
// (outputSchema + handler + preview + tiering are internals, not exposed to clients.)
function listTools() {
  return TOOL_DEFINITIONS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

// Backwards-compat dispatcher for Phase 200 callers (api/mcp/session.js +
// api/mcp/tools/[toolName].js + legacy server.test.js). In Phase 202, the
// 10-step pipeline (lib/markos/mcp/pipeline.cjs) is the admission gate for
// real MCP traffic — it composes its own toolRegistry from these descriptors
// and enforces auth + rate-limit + approval + cost + audit.
async function invokeTool(name, args, ctx = {}) {
  const tool = TOOLS_BY_NAME[name];
  if (!tool) {
    const err = new Error(`unknown tool: ${name}`);
    err.code = 'tool_not_found';
    throw err;
  }
  // Provide a default session when legacy callers don't pass one, so tenant-scoped
  // handlers don't crash. Production path always runs through the pipeline which
  // populates session from lookupSession(bearer_token).
  const session = ctx.session || { tenant_id: null, user_id: null, plan_tier: 'free' };
  return tool.handler({ args: args || {}, session, ...ctx });
}

function getToolByName(name) {
  return TOOLS_BY_NAME[name] || null;
}

module.exports = {
  TOOL_DEFINITIONS,
  TOOLS_BY_NAME,
  listTools,
  invokeTool,
  getToolByName,
};
