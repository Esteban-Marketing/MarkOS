const test = require('node:test');
const assert = require('node:assert/strict');

const {
  classifyResearchComplexity,
  assessEvidenceSufficiency,
} = require('../../onboarding/backend/research/adaptive-research-policy.cjs');

test('93-01 complexity scoring keeps routine requests on the lighter path', () => {
  const simple = classifyResearchComplexity({
    query: 'summarize our current value proposition',
    research_type: 'company',
    business_value: 'normal',
  });

  const complex = classifyResearchComplexity({
    query: 'perform a multi-source competitor analysis with contradictions, fresh proof, and strategic recommendations for enterprise revops buyers',
    research_type: 'competitive_analysis',
    business_value: 'high',
    requires_freshness: true,
  });

  assert.equal(simple.tier, 'light');
  assert.equal(simple.should_use_deep_research, false);
  assert.equal(complex.tier, 'deep');
  assert.equal(complex.should_use_deep_research, true);
  assert.ok(complex.score > simple.score);
});

test('93-01 evidence sufficiency detects when internal grounding is enough', () => {
  const sufficient = assessEvidenceSufficiency({
    internalEvidenceCount: 3,
    contradictions: [],
    requiresFreshness: false,
  });

  const insufficient = assessEvidenceSufficiency({
    internalEvidenceCount: 0,
    contradictions: [],
    requiresFreshness: true,
  });

  assert.equal(sufficient.sufficient, true);
  assert.equal(insufficient.sufficient, false);
});
