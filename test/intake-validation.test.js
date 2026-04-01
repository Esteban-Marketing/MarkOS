/**
 * test/intake-validation.test.js — Unit tests for intake validation rules (R001–R008)
 */

const test = require('node:test');
const assert = require('assert/strict');
const validSeeds = require('./fixtures/valid-seeds.json');
const invalidSeeds = require('./fixtures/invalid-seeds.json');
const { validateIntakeSeed } = require('../onboarding/backend/handlers/submit.cjs');

test('R001: company.name required, non-empty, max 100 chars', (t) => {
  const invalid = invalidSeeds.invalid_r001[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r001Error = result.errors.find(e => e.rule_id === 'R001');
  assert.ok(r001Error);
  assert.match(r001Error.message, /Company name/);
});

test('R001: valid company name passes', (t) => {
  const valid = validSeeds[0];
  const result = validateIntakeSeed(valid);
  assert.equal(result.valid, true);
});

test('R002: company.stage must be in enum', (t) => {
  const invalid = invalidSeeds.invalid_r002[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r002Error = result.errors.find(e => e.rule_id === 'R002');
  assert.ok(r002Error);
});

test('R003: product.name required', (t) => {
  const invalid = invalidSeeds.invalid_r003[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r003Error = result.errors.find(e => e.rule_id === 'R003');
  assert.ok(r003Error);
});

test('R004: audience.pain_points min 2', (t) => {
  const invalid = invalidSeeds.invalid_r004[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r004Error = result.errors.find(e => e.rule_id === 'R004');
  assert.ok(r004Error);
});

test('R005: market.competitors min 2', (t) => {
  const invalid = invalidSeeds.invalid_r005[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r005Error = result.errors.find(e => e.rule_id === 'R005');
  assert.ok(r005Error);
});

test('R006: market.market_trends min 1', (t) => {
  const invalid = invalidSeeds.invalid_r006[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r006Error = result.errors.find(e => e.rule_id === 'R006');
  assert.ok(r006Error);
});

test('R007: content.content_maturity in enum', (t) => {
  const invalid = invalidSeeds.invalid_r007[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r007Error = result.errors.find(e => e.rule_id === 'R007');
  assert.ok(r007Error);
});

test('R008: slug format validation', (t) => {
  const invalid = invalidSeeds.invalid_r008[0];
  const result = validateIntakeSeed(invalid);
  assert.equal(result.valid, false);
  const r008Error = result.errors.find(e => e.rule_id === 'R008');
  assert.ok(r008Error);
});

test('Valid seed passes all checks', (t) => {
  const valid = validSeeds[0];
  const result = validateIntakeSeed(valid);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});
