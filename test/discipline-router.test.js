const test = require('node:test');
const assert = require('node:assert/strict');

const { rankDisciplines } = require('../onboarding/backend/agents/discipline-router.cjs');

test('rankDisciplines maps active_channels into deterministic discipline order', () => {
  const seed = {
    content: { active_channels: ['Google Ads', 'LinkedIn', 'Email'] },
    audience: { pain_points: [] },
  };

  const ranked = rankDisciplines(seed);
  assert.deepEqual(ranked.slice(0, 3), ['Paid_Media', 'Social', 'Lifecycle_Email']);
});

test('rankDisciplines boosts taxonomy-matched pain points without using business_model', () => {
  const seed = {
    content: { active_channels: [] },
    audience: { pain_points: ['high churn', 'retention drop'] },
    company: { business_model: 'SaaS' },
  };

  const ranked = rankDisciplines(seed);
  assert.equal(ranked[0], 'Lifecycle_Email');
  assert.equal(ranked.length, 3);
});

test('rankDisciplines falls back to Paid_Media, Content_SEO, Lifecycle_Email when signals are empty', () => {
  const seed = {
    content: { active_channels: [] },
    audience: { pain_points: [] },
  };

  const ranked = rankDisciplines(seed);
  assert.deepEqual(ranked.slice(0, 3), ['Paid_Media', 'Content_SEO', 'Lifecycle_Email']);
});

test('rankDisciplines ignores business_model when routing signals are absent', () => {
  const seed = {
    content: { active_channels: [] },
    audience: { pain_points: [] },
    company: { business_model: 'SaaS' },
  };

  const ranked = rankDisciplines(seed);
  assert.deepEqual(ranked.slice(0, 3), ['Paid_Media', 'Content_SEO', 'Lifecycle_Email']);
});