'use strict';

// Phase 202 Plan 07: 30 live tool descriptors.
// Composition:
//   - 2 Phase 200 retained (draft_message, run_neuro_audit) — defined inline below
//   - 8 Plan 202-06 wave-0 graduated (imported)
//   - 20 Plan 202-07 net-new (imported — 10 marketing, 5 crm, 3 literacy, 2 tenancy)
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

// --- Phase 200 retained tools (inline — integrate with generate-runner.cjs) --

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

// --- Net-new (Plan 202-07) -----------------------------------------------------

// 10 marketing net-new
const { descriptor: remixDraft }           = require('./marketing/remix-draft.cjs');
const { descriptor: rankDraftVariants }    = require('./marketing/rank-draft-variants.cjs');
const { descriptor: briefToPlan }          = require('./marketing/brief-to-plan.cjs');
const { descriptor: generateChannelCopy }  = require('./marketing/generate-channel-copy.cjs');
const { descriptor: expandClaimEvidence }  = require('./marketing/expand-claim-evidence.cjs');
const { descriptor: clonePersonaVoice }    = require('./marketing/clone-persona-voice.cjs');
const { descriptor: generateSubjectLines } = require('./marketing/generate-subject-lines.cjs');
const { descriptor: optimizeCta }          = require('./marketing/optimize-cta.cjs');
const { descriptor: generatePreviewText }  = require('./marketing/generate-preview-text.cjs');
const { descriptor: auditClaimStrict }     = require('./marketing/audit-claim-strict.cjs');

// 5 CRM net-new
const { descriptor: listCrmEntities }      = require('./crm/list-crm-entities.cjs');
const { descriptor: queryCrmTimeline }     = require('./crm/query-crm-timeline.cjs');
const { descriptor: snapshotPipeline }     = require('./crm/snapshot-pipeline.cjs');
const { descriptor: readSegment }          = require('./crm/read-segment.cjs');
const { descriptor: summarizeDeal }        = require('./crm/summarize-deal.cjs');

// 3 literacy net-new
const { descriptor: queryCanon }           = require('./literacy/query-canon.cjs');
const { descriptor: explainArchetype }     = require('./literacy/explain-archetype.cjs');
const { descriptor: walkTaxonomy }         = require('./literacy/walk-taxonomy.cjs');

// 2 tenancy net-new (D-01 read-only)
const { descriptor: listMembers }          = require('./tenancy/list-members.cjs');
const { descriptor: queryAudit }           = require('./tenancy/query-audit.cjs');

const TOOL_DEFINITIONS = [
  // Phase 200 retained (2)
  draftMessage,
  runNeuroAudit,
  // Plan 202-06 wave-0 graduated (8)
  planCampaign,
  researchAudience,
  generateBrief,
  auditClaim,
  listPainPoints,
  rankExecutionQueue,
  schedulePost,
  explainLiteracy,
  // Plan 202-07 marketing net-new (10)
  remixDraft,
  rankDraftVariants,
  briefToPlan,
  generateChannelCopy,
  expandClaimEvidence,
  clonePersonaVoice,
  generateSubjectLines,
  optimizeCta,
  generatePreviewText,
  auditClaimStrict,
  // Plan 202-07 CRM net-new (5)
  listCrmEntities,
  queryCrmTimeline,
  snapshotPipeline,
  readSegment,
  summarizeDeal,
  // Plan 202-07 literacy net-new (3)
  queryCanon,
  explainArchetype,
  walkTaxonomy,
  // Plan 202-07 tenancy net-new (2) — D-01 READ-ONLY
  listMembers,
  queryAudit,
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
