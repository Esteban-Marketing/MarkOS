/**
 * test/intake-orchestration.test.js — Integration tests for MIR seed population
 */

const test = require('node:test');
const assert = require('assert/strict');
const validSeeds = require('./fixtures/valid-seeds.json');
const { ensureUniqueSlug } = require('../onboarding/backend/handlers/submit.cjs');

test('ORCH-01: ensureUniqueSlug returns same slug if not taken', async (t) => {
  const proposedSlug = 'test-company';
  const mockVectorMemory = {
    exists: async (key) => false
  };
  
  const finalSlug = await ensureUniqueSlug(proposedSlug, mockVectorMemory);
  assert.equal(finalSlug, proposedSlug);
});

test('ORCH-02: ensureUniqueSlug appends on collision', async (t) => {
  const proposedSlug = 'test-company';
  const mockVectorMemory = {
    exists: async (key) => true
  };
  
  const finalSlug = await ensureUniqueSlug(proposedSlug, mockVectorMemory);
  assert.notEqual(finalSlug, proposedSlug);
  assert.ok(finalSlug.startsWith(proposedSlug));
  assert.match(finalSlug, /-\d+-[a-z0-9]{4}$/);
});

test('ORCH-03: Slug suffix format is correct', async (t) => {
  const proposedSlug = 'acme-corp';
  const mockVectorMemory = {
    exists: async (key) => true
  };
  
  const finalSlug = await ensureUniqueSlug(proposedSlug, mockVectorMemory);
  const parts = finalSlug.split('-');
  assert.ok(parts.length >= 4);
  const lastPart = parts[parts.length - 1];
  assert.equal(lastPart.length, 4);
});

test('ORCH-04: vectorMemory.exists is called', async (t) => {
  const proposedSlug = 'test-slug';
  let checkCalled = false;
  
  const mockVectorMemory = {
    exists: async (key) => {
      checkCalled = true;
      return false;
    }
  };
  
  await ensureUniqueSlug(proposedSlug, mockVectorMemory);
  assert.ok(checkCalled);
});
