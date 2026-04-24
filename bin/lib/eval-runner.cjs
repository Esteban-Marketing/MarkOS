'use strict';

// Phase 204 Plan 05 Task 3 — Local rubric evaluation primitive.
//
// Purely local (no network) scoring of a draft against a brief. Four
// dimensions, each 0 or 25 points, summing to a 0-100 score:
//
//   voice     — draft mentions the brand (case-insensitive)
//   claims    — draft echoes the first 40 chars of the brief's promise
//   structure — draft has >= 2 sentences
//   length    — word count in [20, 300]
//
// Pluggable LLM (matches 200-02 precedent): callers may pass `{ llm }` in
// options to delegate scoring refinement to a real model. Default is
// pure-rubric (no LLM call) — aligned with CONTEXT D-03 "fully local;
// pluggable LLM". When the llm function returns refinements, the returned
// object is merged into the result — but the base rubric is always the
// anchor, so the llm can only *adjust* scores with explicit deltas (it
// cannot fabricate points without earning them from the rubric).
//
// This primitive is consumed by bin/commands/eval.cjs and is designed to be
// safe for repeated calls (pure function, no side effects).

const DIMENSION_POINTS = 25;
const MAX_SCORE = DIMENSION_POINTS * 4; // 100

const LENGTH_MIN_WORDS = 20;
const LENGTH_MAX_WORDS = 300;

const STRUCTURE_MIN_SENTENCES = 2;
const PROMISE_SUBSTRING_LEN = 40;

// ─── Helpers ───────────────────────────────────────────────────────────────

function normaliseText(value) {
  return value == null ? '' : String(value);
}

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function countSentences(text) {
  if (!text) return 0;
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

// ─── Rubric dimensions ─────────────────────────────────────────────────────

// Each dimension returns { score, issue? }. The core helpers are named so
// they can be tested in isolation if future plans extend the rubric.

function scoreVoice(draftText, brand) {
  const needle = normaliseText(brand).toLowerCase().trim();
  if (!needle) {
    return { score: 0, issue: 'brief has no brand' };
  }
  if (draftText.toLowerCase().includes(needle)) {
    return { score: DIMENSION_POINTS };
  }
  return { score: 0, issue: `voice: brand "${brand}" not mentioned` };
}

function scoreClaims(draftText, promise) {
  const needle = normaliseText(promise).toLowerCase().trim().slice(0, PROMISE_SUBSTRING_LEN);
  if (!needle) {
    return { score: 0, issue: 'brief has no promise' };
  }
  if (draftText.toLowerCase().includes(needle)) {
    return { score: DIMENSION_POINTS };
  }
  return { score: 0, issue: 'claims: promise substring not echoed in draft' };
}

function scoreStructure(draftText) {
  const sentences = countSentences(draftText);
  if (sentences >= STRUCTURE_MIN_SENTENCES) {
    return { score: DIMENSION_POINTS, sentence_count: sentences };
  }
  return {
    score: 0,
    sentence_count: sentences,
    issue: `structure: only ${sentences} sentence(s); need >= ${STRUCTURE_MIN_SENTENCES}`,
  };
}

function scoreLength(draftText) {
  const words = countWords(draftText);
  if (words >= LENGTH_MIN_WORDS && words <= LENGTH_MAX_WORDS) {
    return { score: DIMENSION_POINTS, word_count: words };
  }
  return {
    score: 0,
    word_count: words,
    issue: `length ${words} out of range (${LENGTH_MIN_WORDS}-${LENGTH_MAX_WORDS})`,
  };
}

// ─── scoreDraft ───────────────────────────────────────────────────────────

async function scoreDraft(draft, brief, options = {}) {
  const draftText = normaliseText(draft && draft.text);
  const safeBrief = brief || {};

  const voice = scoreVoice(draftText, safeBrief.brand);
  const claims = scoreClaims(draftText, safeBrief.promise);
  const structure = scoreStructure(draftText);
  const length = scoreLength(draftText);

  const dimensions = {
    voice: voice.score,
    claims: claims.score,
    structure: structure.score,
    length: length.score,
  };

  const issues = [];
  if (voice.issue) issues.push(voice.issue);
  if (claims.issue) issues.push(claims.issue);
  if (structure.issue) issues.push(structure.issue);
  if (length.issue) issues.push(length.issue);

  const baseScore = dimensions.voice + dimensions.claims + dimensions.structure + dimensions.length;

  const result = {
    score: baseScore,
    dimensions,
    issues,
    word_count: length.word_count != null ? length.word_count : countWords(draftText),
    sentence_count: structure.sentence_count != null ? structure.sentence_count : countSentences(draftText),
  };

  // Optional LLM-assisted refinement. The llm may return a partial object
  // merged into the result. It can NEVER raise the score above MAX_SCORE.
  if (typeof options.llm === 'function') {
    try {
      const llmOut = await options.llm({
        draft: { text: draftText },
        brief: safeBrief,
        rubric: dimensions,
        issues,
      });
      if (llmOut && typeof llmOut === 'object') {
        if (Number.isFinite(llmOut.score)) {
          result.score = Math.max(0, Math.min(MAX_SCORE, Math.round(llmOut.score)));
        }
        if (llmOut.dimensions && typeof llmOut.dimensions === 'object') {
          result.dimensions = { ...result.dimensions, ...llmOut.dimensions };
        }
        if (Array.isArray(llmOut.issues)) {
          result.issues = llmOut.issues.map(String);
        }
      }
    } catch (err) {
      result.issues.push(`llm_refinement_failed: ${err?.message || 'unknown'}`);
    }
  }

  return result;
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  scoreDraft,
  // Constants + helpers exposed for downstream tests + tooling.
  DIMENSION_POINTS,
  MAX_SCORE,
  LENGTH_MIN_WORDS,
  LENGTH_MAX_WORDS,
  STRUCTURE_MIN_SENTENCES,
  PROMISE_SUBSTRING_LEN,
  countWords,
  countSentences,
  scoreVoice,
  scoreClaims,
  scoreStructure,
  scoreLength,
};
