'use strict';

const {
  AUTHORITY_TOKEN,
  createTailoringAlignmentEnvelope,
  assertTailoringAlignmentEnvelope,
} = require('./tailoring-alignment-contract.cjs');

const BLOCKER_CODES = Object.freeze([
  'GENERIC_OUTPUT_BLOCKED',
  'ICP_FIT_MISSING',
  'NATURALITY_COLLAPSE',
  'UNGROUNDED_NEURO_LANGUAGE',
  'REASONING_CONTRACT_MISSING',
]);

const TEMPLATE_PATTERNS = [
  /in today['’]s fast-paced digital world/i,
  /innovative solutions?/i,
  /unlock growth/i,
  /empower success/i,
  /at scale/i,
  /game-changing/i,
  /seamless/i,
];

function normalizeText(value) {
  return String(value ?? '').trim();
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function normalizeBlockingReason(code, detail) {
  return { code, detail: normalizeText(detail) };
}

function normalizeSignalTokens(signals = {}) {
  const raw = [];
  for (const key of ['pain_point_tags', 'desired_outcome_tags', 'objection_tags', 'trust_driver_tags', 'naturality_tags']) {
    if (Array.isArray(signals[key])) {
      raw.push(...signals[key]);
    }
  }

  if (signals.icp_tailoring_profile && typeof signals.icp_tailoring_profile === 'object') {
    raw.push(...Object.values(signals.icp_tailoring_profile));
  }

  return unique(
    raw
      .map((entry) => normalizeText(entry).toLowerCase().replace(/[_-]+/g, ' '))
      .flatMap((entry) => entry.split(/\s+/))
      .filter((entry) => entry.length >= 4),
  );
}

function includesAny(text, values) {
  return values.some((value) => value && text.includes(value));
}

function fallbackEnvelope(envelope = {}, contextPack = {}) {
  return {
    review: envelope.review && typeof envelope.review === 'object' ? envelope.review : { status: 'passed', blocking_reasons: [], required_fixes: [] },
    reasoning: envelope.reasoning && typeof envelope.reasoning === 'object' ? envelope.reasoning : {},
    tailoring_signals: contextPack.tailoring_signals && typeof contextPack.tailoring_signals === 'object' ? contextPack.tailoring_signals : {},
    authority_token: normalizeText(envelope.authority_token || ''),
  };
}

function evaluateTailoringReviewGate(input = {}) {
  const draft = normalizeText(input.draft || input.output || input.text || '');
  const blocking_reasons = [];
  const required_fixes = [];

  let envelope;
  try {
    envelope = assertTailoringAlignmentEnvelope(input.envelope || createTailoringAlignmentEnvelope(input));
  } catch (error) {
    envelope = fallbackEnvelope(input.envelope || {}, input.contextPack || input.context_pack || {});
    blocking_reasons.push(normalizeBlockingReason('REASONING_CONTRACT_MISSING', error.message));
    required_fixes.push('Restore the shared tailoring_alignment_envelope with the governed Phase 98 winner fields.');
  }

  const review = envelope.review && typeof envelope.review === 'object' ? envelope.review : { status: 'passed', blocking_reasons: [], required_fixes: [] };
  const winner = envelope.reasoning && typeof envelope.reasoning === 'object' ? envelope.reasoning.winner || {} : {};
  const signals = envelope.tailoring_signals && typeof envelope.tailoring_signals === 'object' ? envelope.tailoring_signals : {};
  const signalTokens = normalizeSignalTokens(signals);
  const normalizedDraft = draft.toLowerCase();
  const signalHits = signalTokens.filter((token) => includesAny(normalizedDraft, [token])).length;

  if (!Array.isArray(signals.pain_point_tags) || signals.pain_point_tags.length === 0 || signalHits < 2) {
    blocking_reasons.push(normalizeBlockingReason('ICP_FIT_MISSING', 'The output does not clearly carry the matched ICP pain, objections, or trust posture.'));
    required_fixes.push('Name the ICP pain in the opening and carry the matched trust posture forward.');
  }

  if (!normalizeText(winner.overlay_key) || !normalizeText(winner.primary_trigger) || !normalizeText(winner.why_it_fits_summary)) {
    blocking_reasons.push(normalizeBlockingReason('REASONING_CONTRACT_MISSING', 'The Phase 98 winner contract is incomplete or missing.'));
    required_fixes.push('Restore reasoning.winner.overlay_key, reasoning.winner.primary_trigger, and reasoning.winner.why_it_fits_summary.');
  }

  if (!draft || TEMPLATE_PATTERNS.some((pattern) => pattern.test(draft))) {
    blocking_reasons.push(normalizeBlockingReason('GENERIC_OUTPUT_BLOCKED', 'The output reads like a template and is not premium-ready.'));
    required_fixes.push('Replace vague template language with specific, audience-matched proof.');
  }

  if (/unlock|empower|innovative|solution|business needs/i.test(draft) || !includesAny(normalizedDraft, ['proof', 'operator', 'pipeline', 'objection'])) {
    blocking_reasons.push(normalizeBlockingReason('NATURALITY_COLLAPSE', 'The draft is not plainspoken and specific enough for the shared naturality contract.'));
    required_fixes.push('Rewrite in a plainspoken, specific tone and remove hype phrasing.');
  }

  if ((/dopamine|cortisol|oxytocin|trigger/i.test(draft) && envelope.authority_token !== AUTHORITY_TOKEN) || (!normalizeText(winner.primary_trigger) && /neuro|brain/i.test(draft))) {
    blocking_reasons.push(normalizeBlockingReason('UNGROUNDED_NEURO_LANGUAGE', 'Neuromarketing language is ungrounded or detached from MARKOS-REF-NEU-01.'));
    required_fixes.push('Ground trigger language in MARKOS-REF-NEU-01 and cite why the governed winner fits.');
  }

  const mergedBlockingReasons = unique([
    ...blocking_reasons.map((entry) => JSON.stringify(entry)),
    ...((Array.isArray(review.blocking_reasons) ? review.blocking_reasons : []).map((entry) => JSON.stringify(normalizeBlockingReason(entry.code || 'REVIEW_NOTE', entry.detail || 'Review feedback available.')))),
  ]).map((entry) => JSON.parse(entry));

  const mergedRequiredFixes = unique([
    ...required_fixes,
    ...(Array.isArray(review.required_fixes) ? review.required_fixes.map((entry) => normalizeText(entry)) : []),
  ]);

  return {
    status: mergedBlockingReasons.length > 0 ? 'rewrite_required' : 'passed',
    blocking_reasons: mergedBlockingReasons,
    required_fixes: mergedRequiredFixes,
    blocker_codes: mergedBlockingReasons.map((entry) => entry.code).filter((entry) => BLOCKER_CODES.includes(entry)),
  };
}

module.exports = {
  BLOCKER_CODES,
  evaluateTailoringReviewGate,
};
