const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');
const onboardingScriptPath = path.join(root, 'onboarding/onboarding.js');
const onboardingHtmlPath = path.join(root, 'onboarding/index.html');

test('TRK-01: onboarding browser capture targets the MarkOS-owned ingest path', () => {
  const script = fs.readFileSync(onboardingScriptPath, 'utf8');
  const html = fs.readFileSync(onboardingHtmlPath, 'utf8');

  assert.match(script, /TRACKING_ENDPOINT\s*=\s*['"]\/api\/tracking\/ingest['"]/);
  assert.match(script, /captureTrackingEvent\(/);
  assert.doesNotMatch(script, /posthog\.capture\(/);
  assert.doesNotMatch(script, /posthog\.init\(/);
  assert.doesNotMatch(html, /posthog/i);
  assert.doesNotMatch(html, /assets\.i\.posthog\.com/i);
});

test('TRK-03: browser contract names page-view, key interaction, and form lifecycle events explicitly', () => {
  const script = fs.readFileSync(onboardingScriptPath, 'utf8');

  assert.match(script, /onboarding_page_view/);
  assert.match(script, /business_model_selected/);
  assert.match(script, /onboarding_form_started/);
  assert.match(script, /onboarding_completed/);
  assert.match(script, /onboarding_step_completed/);
});

test('TRK-04: onboarding browser copy frames publish as transitional instead of canonical MIR activation', () => {
  const script = fs.readFileSync(onboardingScriptPath, 'utf8');
  const html = fs.readFileSync(onboardingHtmlPath, 'utf8');

  assert.match(html, /Publish Transitional Drafts/);
  assert.match(html, /transitional migration outputs/i);
  assert.doesNotMatch(html, /Publish &amp; Activate MIR/);
  assert.match(script, /legacy migration files written/);
  assert.match(script, /canonical vault scaffold remains your primary MarkOS workspace/i);
});