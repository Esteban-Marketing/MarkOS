'use strict';

const { parseBrief, validateBrief, normalizeBrief } = require('./brief-parser.cjs');

const SYSTEM_PROMPT = [
  'You are a marketing draft generator for MarkOS.',
  'Produce a single channel-appropriate draft that speaks to the audience,',
  'acknowledges their pain, and delivers the promise in the brand voice.',
].join(' ');

function buildUserPrompt(brief) {
  return [
    `Channel: ${brief.channel}`,
    `Audience: ${brief.audience}`,
    `Pain: ${brief.pain}`,
    `Promise: ${brief.promise}`,
    `Brand: ${brief.brand}`,
    '',
    'Write one draft suitable for the channel. Keep it concise.',
  ].join('\n');
}

function stubLlm(_system, user) {
  const channelMatch = user.match(/^Channel:\s*(.+)$/m);
  const promiseMatch = user.match(/^Promise:\s*(.+)$/m);
  const audienceMatch = user.match(/^Audience:\s*(.+)$/m);
  const painMatch = user.match(/^Pain:\s*(.+)$/m);
  const text = [
    `[${channelMatch ? channelMatch[1] : 'channel'}] For ${audienceMatch ? audienceMatch[1] : 'you'}:`,
    `We know ${painMatch ? painMatch[1] : 'the blocker'} holds you back.`,
    `${promiseMatch ? promiseMatch[1] : 'We deliver.'}`,
  ].join(' ');
  return Promise.resolve({ ok: true, text, provider: 'stub', model: 'stub-draft-v1' });
}

function auditDraft(draft, brief) {
  const issues = [];
  const text = (draft && draft.text) || '';
  if (!text || text.trim().length < 20) {
    issues.push({ rule: 'min_length', severity: 'error', message: 'draft must be at least 20 characters' });
  }
  if (brief.promise && !text.toLowerCase().includes(String(brief.promise).toLowerCase().slice(0, 10))) {
    issues.push({
      rule: 'promise_presence',
      severity: 'warn',
      message: 'draft does not echo the promise substring (first 10 chars)',
    });
  }
  if (brief.brand && !text.toLowerCase().match(new RegExp(`\\b${String(brief.brand).toLowerCase()}\\b`)) && text.length < 400) {
    issues.push({ rule: 'brand_mention', severity: 'info', message: 'draft omits brand name (short copy — may be intentional)' });
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  const errors = issues.filter((i) => i.severity === 'error').length;
  return {
    status: errors > 0 ? 'fail' : 'pass',
    score: Math.max(0, 100 - issues.length * 10 - errors * 30),
    issues,
    metrics: { characters: text.length, words },
  };
}

async function runDraft(briefSource, options = {}) {
  const raw = parseBrief(briefSource);
  const validation = validateBrief(raw);
  if (!validation.ok) {
    return {
      success: false,
      error: 'INVALID_BRIEF',
      brief_errors: validation.errors,
    };
  }
  const brief = normalizeBrief(raw);
  const llm = options.llm || stubLlm;
  const userPrompt = buildUserPrompt(brief);
  const result = await llm(SYSTEM_PROMPT, userPrompt, options.llmOptions || {});
  if (!result || !result.ok) {
    return {
      success: false,
      error: 'LLM_CALL_FAILED',
      llm_error: (result && result.error) || { code: 'UNKNOWN', message: 'llm returned not-ok' },
    };
  }
  const draft = { text: result.text, provider: result.provider, model: result.model };
  const audit = auditDraft(draft, brief);
  return {
    success: true,
    brief,
    draft,
    audit,
  };
}

module.exports = {
  SYSTEM_PROMPT,
  buildUserPrompt,
  stubLlm,
  auditDraft,
  runDraft,
};
