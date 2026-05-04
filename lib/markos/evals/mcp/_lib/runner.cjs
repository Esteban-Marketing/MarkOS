'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {
  brandVoiceScore,
  claimCheckScore,
  neuroSpecScore,
  scoringTextFromArtifact,
  buildBrandVoiceDebug,
  buildClaimCheckDebug,
  buildNeuroDebug,
} = require('./scorers.cjs');

const FIXTURE_ROOT = path.resolve(__dirname, '../../../../../test/fixtures/evals/mcp');

function loadFixtures(toolName) {
  const toolDir = path.join(FIXTURE_ROOT, toolName);
  const fixtureFiles = fs.readdirSync(toolDir)
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  return fixtureFiles.map((fileName) => {
    const fullPath = path.join(toolDir, fileName);
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return Object.freeze({ ...parsed, __file: fullPath });
  });
}

function normalizeExpectedLlmText(fixture) {
  if (typeof fixture.expected_llm_output === 'string') return fixture.expected_llm_output;
  if (fixture.expected_llm_output && typeof fixture.expected_llm_output === 'object') {
    return JSON.stringify(fixture.expected_llm_output);
  }
  return '{}';
}

function defaultUsage(fixture) {
  return fixture.token_usage || { input_tokens: 240, output_tokens: 180 };
}

function makeMockLlmAdapter(fixture) {
  const text = normalizeExpectedLlmText(fixture);
  const usage = defaultUsage(fixture);
  return {
    __text: text,
    __usage: usage,
    messages: {
      async create() {
        return {
          content: [{ text }],
          usage,
        };
      },
    },
    async chat() {
      return { content: text, usage };
    },
    async complete() {
      return { content: text, usage };
    },
  };
}

function makeMockDraftLlm(fixture) {
  const adapter = makeMockLlmAdapter(fixture);
  return async function mockDraftLlm() {
    return {
      ok: true,
      text: adapter.__text,
      provider: 'eval-mock',
      model: 'eval-draft-v1',
    };
  };
}

function buildDeps(fixture) {
  const adapter = makeMockLlmAdapter(fixture);
  return {
    llm: adapter,
    loadPack: async () => fixture.pack || { pains: [], archetypes: [], canon: [] },
    loadCanon: async () => fixture.canon || (fixture.pack && fixture.pack.canon) || [],
    rank: async () => ({ ranked: fixture.ranked || [] }),
    enqueue: async () => fixture.enqueue_result || { post_id: 'post-eval-default', status: 'queued' },
    _adapter: adapter,
  };
}

function defaultSession(fixture) {
  return {
    tenant_id: fixture.tenant_id || 'tenant-eval',
    user_id: fixture.user_id || 'user-eval',
    plan_tier: fixture.plan_tier || 'team',
  };
}

function extractPayload(raw) {
  if (!raw) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (raw && Array.isArray(raw.content) && raw.content[0] && typeof raw.content[0].text === 'string') {
    try {
      return JSON.parse(raw.content[0].text);
    } catch {
      return raw.content[0].text;
    }
  }
  return raw;
}

function buildScoringText(fixture, raw, payload, extras = {}) {
  const textParts = [];

  const payloadText = scoringTextFromArtifact(payload);
  if (payloadText) textParts.push(payloadText);

  if (extras.preview) {
    const previewText = scoringTextFromArtifact(extras.preview);
    if (previewText) textParts.push(previewText);
  }

  if (extras.scoring_input) {
    const scoringInputText = scoringTextFromArtifact(extras.scoring_input);
    if (scoringInputText) textParts.push(scoringInputText);
  }

  if (fixture.expected_llm_output) {
    const llmText = normalizeExpectedLlmText(fixture);
    if (llmText) textParts.push(llmText);
  }

  if (fixture.tool_input) {
    const inputText = scoringTextFromArtifact(fixture.tool_input);
    if (inputText) textParts.push(inputText);
  }

  return textParts.join('\n');
}

function buildArtifact(toolName, fixture, executionResult) {
  const raw = executionResult && executionResult.raw ? executionResult.raw : executionResult;
  const payload = extractPayload(raw);
  const preview = executionResult && executionResult.preview ? executionResult.preview : null;
  const scoringInput = executionResult && executionResult.scoring_input ? executionResult.scoring_input : null;
  const scoringText = buildScoringText(fixture, raw, payload, {
    preview,
    scoring_input: scoringInput,
  });

  return {
    tool_name: toolName,
    fixture_name: fixture.name,
    raw,
    payload,
    preview,
    fixture_snapshot: fixture,
    scoring_text: scoringText,
  };
}

async function runEval(toolName, fixture, execute, opts = {}) {
  const session = defaultSession(fixture);
  const deps = buildDeps(fixture);
  const req_id = `eval-${toolName}-${path.basename(fixture.__file || fixture.name || 'fixture', '.json')}`;

  const executionResult = await execute({
    fixture,
    session,
    deps,
    req_id,
    mockLlm: deps._adapter,
  });

  const artifact = buildArtifact(toolName, fixture, executionResult);
  const brand_voice = brandVoiceScore(artifact.scoring_text, opts.brand_stance || {});
  const claim_check = claimCheckScore(artifact, fixture.expected_evidence_ids || []);
  const neuro_spec = neuroSpecScore(artifact, fixture.expected_neuro_pillar, fixture.expected_archetype);

  return {
    ...artifact,
    brand_voice,
    claim_check,
    neuro_spec,
    pass: brand_voice >= 85 && claim_check === true && neuro_spec >= 75,
    debug: {
      brand: buildBrandVoiceDebug(artifact.scoring_text, opts.brand_stance || {}),
      claim: buildClaimCheckDebug(artifact, fixture.expected_evidence_ids || []),
      neuro: buildNeuroDebug(artifact.scoring_text, fixture.expected_neuro_pillar, fixture.expected_archetype),
    },
  };
}

function assertEval(result) {
  assert.equal(
    result.pass,
    true,
    `eval failed for ${result.tool_name} :: ${result.fixture_name} :: brand=${result.brand_voice} claim=${result.claim_check} neuro=${result.neuro_spec}\n${JSON.stringify(result.debug, null, 2)}`,
  );
}

module.exports = {
  FIXTURE_ROOT,
  loadFixtures,
  makeMockLlmAdapter,
  makeMockDraftLlm,
  runEval,
  assertEval,
};
