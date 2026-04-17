'use strict';

const TOOL_DEFINITIONS = [
  {
    name: 'draft_message',
    description: 'Generate a single marketing draft from a channel + audience + pain + promise + brand brief.',
    inputSchema: {
      type: 'object',
      required: ['channel', 'audience', 'pain', 'promise', 'brand'],
      properties: {
        channel: { type: 'string' },
        audience: { type: 'string' },
        pain: { type: 'string' },
        promise: { type: 'string' },
        brand: { type: 'string' },
      },
    },
    handler: async (args) => {
      const { runDraft } = require('../../../../bin/lib/generate-runner.cjs');
      const result = await runDraft(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  },
  {
    name: 'plan_campaign',
    description: 'Produce a campaign plan outline (stub) for a given objective + audience.',
    inputSchema: {
      type: 'object',
      required: ['objective', 'audience'],
      properties: {
        objective: { type: 'string' },
        audience: { type: 'string' },
        budget: { type: 'string' },
      },
    },
    handler: async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tool: 'plan_campaign',
              status: 'stub',
              note: 'Full campaign planner backend wires in 200-06.1.',
              echo: args,
            },
            null,
            2,
          ),
        },
      ],
    }),
  },
  {
    name: 'research_audience',
    description: 'Return audience research snapshot (stub) for a segment key.',
    inputSchema: {
      type: 'object',
      required: ['segment'],
      properties: {
        segment: { type: 'string' },
      },
    },
    handler: async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tool: 'research_audience',
              status: 'stub',
              segment: args.segment,
              pains: ['placeholder_pain_a', 'placeholder_pain_b'],
              archetypes: ['founder-sam', 'operator-ola'],
            },
            null,
            2,
          ),
        },
      ],
    }),
  },
  {
    name: 'run_neuro_audit',
    description: 'Run a neuro-audit pass over a draft and return scored issues.',
    inputSchema: {
      type: 'object',
      required: ['text'],
      properties: { text: { type: 'string' } },
    },
    handler: async (args) => {
      const { auditDraft } = require('../../../../bin/lib/generate-runner.cjs');
      const audit = auditDraft({ text: args.text }, args.brief || {});
      return { content: [{ type: 'text', text: JSON.stringify(audit, null, 2) }] };
    },
  },
  {
    name: 'generate_brief',
    description: 'Generate a structured brief (YAML-shape JSON) from freeform prompt.',
    inputSchema: {
      type: 'object',
      required: ['prompt'],
      properties: { prompt: { type: 'string' } },
    },
    handler: async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tool: 'generate_brief',
              status: 'stub',
              brief: {
                channel: 'email',
                audience: 'derived-from-prompt',
                pain: args.prompt.slice(0, 80),
                promise: 'derived-promise',
                brand: 'markos',
              },
            },
            null,
            2,
          ),
        },
      ],
    }),
  },
  {
    name: 'audit_claim',
    description: 'Verify whether a marketing claim is supported by canon evidence (stub).',
    inputSchema: {
      type: 'object',
      required: ['claim'],
      properties: { claim: { type: 'string' } },
    },
    handler: async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tool: 'audit_claim',
              status: 'stub',
              claim: args.claim,
              verdict: 'unverified',
              evidence_refs: [],
            },
            null,
            2,
          ),
        },
      ],
    }),
  },
  {
    name: 'list_pain_points',
    description: 'List canonical pain-point taxonomy entries (stub snapshot).',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tool: 'list_pain_points',
              pains: [
                'pipeline_velocity',
                'content_engagement',
                'brand_consistency',
                'attribution_blackbox',
                'bidding_overspend',
              ],
            },
            null,
            2,
          ),
        },
      ],
    }),
  },
  {
    name: 'rank_execution_queue',
    description: 'Rank CRM execution-queue items (stub; wires to lib/markos/crm/execution.ts).',
    inputSchema: {
      type: 'object',
      properties: { tenant_id: { type: 'string' }, scope: { type: 'string' } },
    },
    handler: async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tool: 'rank_execution_queue',
              status: 'stub',
              tenant_id: args.tenant_id || null,
              scope: args.scope || 'personal',
              ranked: [],
            },
            null,
            2,
          ),
        },
      ],
    }),
  },
  {
    name: 'schedule_post',
    description: 'Schedule a post draft onto a channel queue (stub).',
    inputSchema: {
      type: 'object',
      required: ['channel', 'draft_text', 'scheduled_at'],
      properties: {
        channel: { type: 'string' },
        draft_text: { type: 'string' },
        scheduled_at: { type: 'string', format: 'date-time' },
      },
    },
    handler: async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ tool: 'schedule_post', status: 'stub_scheduled', echo: args }, null, 2),
        },
      ],
    }),
  },
  {
    name: 'explain_literacy',
    description: 'Explain a literacy node or archetype slug from the Shared / vertical literacy registry.',
    inputSchema: {
      type: 'object',
      required: ['slug'],
      properties: { slug: { type: 'string' } },
    },
    handler: async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tool: 'explain_literacy',
              status: 'stub',
              slug: args.slug,
              summary: `Stub explanation for literacy node "${args.slug}". Full reader lands in 200-06.1.`,
            },
            null,
            2,
          ),
        },
      ],
    }),
  },
];

const TOOLS_BY_NAME = Object.freeze(Object.fromEntries(TOOL_DEFINITIONS.map((t) => [t.name, t])));

function listTools() {
  return TOOL_DEFINITIONS.map(({ handler, ...rest }) => rest);
}

async function invokeTool(name, args) {
  const def = TOOLS_BY_NAME[name];
  if (!def) {
    throw new Error(`unknown tool: ${name}`);
  }
  return def.handler(args || {});
}

module.exports = {
  TOOL_DEFINITIONS,
  TOOLS_BY_NAME,
  listTools,
  invokeTool,
};
