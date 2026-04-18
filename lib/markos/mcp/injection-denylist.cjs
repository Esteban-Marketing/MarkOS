'use strict';

// Phase 202 Plan 04 D-14: static deny-list for prompt-injection attempts in tool input strings.
// NFKC-normalize to defeat Unicode confusable attacks (Cyrillic/Greek lookalikes, fullwidth Latin)
// per 202-RESEARCH Pitfall 6. Patterns cover: instruction-frame reset, system-role injection,
// model-specific tokens ([INST], <|im_start|>), mode-escalation, jailbreak keywords, prompt-leak.

const PATTERNS = Object.freeze([
  /ignore\s+(all\s+)?previous\s+(instructions|messages|rules)/i,
  /system\s*:\s*you\s+are/i,
  /\[INST\]/i,                             // Llama instruction token
  /<\|im_start\|>/i,                       // ChatML-style injection
  /<\|im_end\|>/i,
  /sudo\s+mode/i,
  /enable\s+(dev|developer|admin)\s+mode/i,
  /forget\s+(everything|all)/i,
  /you\s+are\s+now\s+(dan|the|a\s+free)/i,
  /jailbreak/i,
  /disregard\s+(all\s+)?(above|prior)/i,
  /reveal\s+(your|the)\s+(system\s+)?prompt/i,
]);

function* walk(obj, path = '') {
  if (obj == null) return;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    yield [path, obj];
    return;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) yield* walk(obj[i], `${path}[${i}]`);
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) yield* walk(v, path ? `${path}.${k}` : k);
  }
}

function checkInjectionDenylist(args) {
  for (const [key, val] of walk(args)) {
    if (typeof val !== 'string') continue;
    const normalized = val.normalize('NFKC').toLowerCase();
    for (const p of PATTERNS) {
      if (p.test(normalized)) return { key, pattern: p.source };
    }
  }
  return null;
}

module.exports = { PATTERNS, checkInjectionDenylist };
