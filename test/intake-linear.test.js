/**
 * test/intake-linear.test.js — Integration tests for Linear ticket automation
 */

const test = require('node:test');
const assert = require('assert/strict');
const validSeeds = require('./fixtures/valid-seeds.json');
const { buildLinearTasks } = require('../onboarding/backend/handlers/submit.cjs');

test('LINK-01: buildLinearTasks produces proper payload', (t) => {
  const seed = validSeeds[0];
  const slug = 'test-company';
  const tasks = buildLinearTasks(seed, slug);
  
  assert.ok(Array.isArray(tasks));
  assert.equal(tasks.length, 2);
  const tokens = tasks.map(t => t.token);
  assert.ok(tokens.includes('MARKOS-ITM-OPS-03'));
  assert.ok(tokens.includes('MARKOS-ITM-INT-01'));
});

test('LINK-02: Linear task includes client name and stage', (t) => {
  const seed = validSeeds[0];
  const slug = 'test-company';
  const tasks = buildLinearTasks(seed, slug);
  
  const opsTask = tasks.find(t => t.token === 'MARKOS-ITM-OPS-03');
  assert.ok(opsTask);
  assert.equal(opsTask.variables.client_name, seed.company.name);
  assert.equal(opsTask.variables.company_stage, seed.company.stage);
});

test('LINK-03: Token whitelist enforced', (t) => {
  const seed = validSeeds[0];
  const slug = 'test-company';
  const tasks = buildLinearTasks(seed, slug);
  
  const allowedTokens = ['MARKOS-ITM-OPS-03', 'MARKOS-ITM-INT-01'];
  tasks.forEach(task => {
    assert.ok(allowedTokens.includes(task.token));
  });
});

test('LINK-04: Both tasks have required fields', (t) => {
  const seed = validSeeds[0];
  const slug = 'test-company';
  const tasks = buildLinearTasks(seed, slug);
  
  for (const task of tasks) {
    assert.ok(task.token, 'Task should have token');
    assert.ok(task.variables, 'Task should have variables');
    assert.ok(task.variables.client_name, 'Variables should have client_name');
  }
});

test('LINK-05: INT-01 task has validation timestamp', (t) => {
  const seed = validSeeds[0];
  const slug = 'test-company';
  const tasks = buildLinearTasks(seed, slug);
  
  const intTask = tasks.find(t => t.token === 'MARKOS-ITM-INT-01');
  assert.ok(intTask);
  assert.ok(intTask.variables.validation_timestamp);
  assert.match(intTask.variables.validation_timestamp, /^\d{4}-\d{2}-\d{2}/);
});
