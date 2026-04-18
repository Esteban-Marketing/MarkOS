'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ajv, STRICT_OPTS, compileToolSchemas, getToolValidator } = require('../../lib/markos/mcp/ajv.cjs');

test('Suite 202-04: STRICT_OPTS locks in strict mode (no coercion, no removeAdditional, no defaults)', () => {
  assert.equal(STRICT_OPTS.strict, true);
  assert.equal(STRICT_OPTS.coerceTypes, false);
  assert.equal(STRICT_OPTS.removeAdditional, false);
  assert.equal(STRICT_OPTS.useDefaults, false);
  assert.equal(STRICT_OPTS.strictSchema, true);
  assert.equal(STRICT_OPTS.strictTypes, true);
});

test('Suite 202-04: module loads even when _generated/tool-schemas.json is absent', () => {
  // If this test runs, module loaded without throwing — lazy-load worked.
  assert.ok(ajv);
});

test('Suite 202-04: compileToolSchemas registers input + output validators per tool_id', () => {
  compileToolSchemas({
    sample_tool: {
      input: { type: 'object', required: ['a'], properties: { a: { type: 'string' } }, additionalProperties: false },
      output: { type: 'object', required: ['ok'], properties: { ok: { type: 'boolean' } }, additionalProperties: false },
    },
  });
  const v = getToolValidator('sample_tool');
  assert.equal(typeof v.validateInput, 'function');
  assert.equal(typeof v.validateOutput, 'function');
});

test('Suite 202-04: getToolValidator throws no_validator for unknown tool_id', () => {
  compileToolSchemas({});
  assert.throws(() => getToolValidator('unknown'), /no_validator:unknown/);
});

test('Suite 202-04: validator rejects additionalProperties when schema has additionalProperties:false', () => {
  compileToolSchemas({
    t1: {
      input: { type: 'object', required: ['a'], properties: { a: { type: 'string' } }, additionalProperties: false },
      output: { type: 'object', additionalProperties: false, properties: {} },
    },
  });
  const v = getToolValidator('t1');
  assert.equal(v.validateInput({ a: 'x', extra: 'nope' }), false);
  assert.ok(v.validateInput.errors && v.validateInput.errors.length > 0);
});

test('Suite 202-04: validator rejects type coercion (string "5" for number)', () => {
  compileToolSchemas({
    t2: {
      input: { type: 'object', required: ['n'], properties: { n: { type: 'number' } }, additionalProperties: false },
      output: { type: 'object', additionalProperties: false, properties: {} },
    },
  });
  const v = getToolValidator('t2');
  assert.equal(v.validateInput({ n: '5' }), false);
  assert.equal(v.validateInput({ n: 5 }), true);
});

test('Suite 202-04: validator enforces required fields', () => {
  compileToolSchemas({
    t3: {
      input: { type: 'object', required: ['must'], properties: { must: { type: 'string' } }, additionalProperties: false },
      output: { type: 'object', additionalProperties: false, properties: {} },
    },
  });
  const v = getToolValidator('t3');
  assert.equal(v.validateInput({}), false);
  assert.ok(v.validateInput.errors.some(e => /required/.test(e.keyword)));
});

test('Suite 202-04: format date-time works via ajv-formats', () => {
  compileToolSchemas({
    t4: {
      input: { type: 'object', required: ['at'], properties: { at: { type: 'string', format: 'date-time' } }, additionalProperties: false },
      output: { type: 'object', additionalProperties: false, properties: {} },
    },
  });
  const v = getToolValidator('t4');
  assert.equal(v.validateInput({ at: '2026-04-17T12:00:00Z' }), true);
  assert.equal(v.validateInput({ at: 'not-a-date' }), false);
});

test('Suite 202-04: validator accepts fully-valid input', () => {
  compileToolSchemas({
    t5: {
      input: { type: 'object', required: ['title', 'count'], properties: { title: { type: 'string', minLength: 1 }, count: { type: 'integer', minimum: 0 } }, additionalProperties: false },
      output: { type: 'object', additionalProperties: false, properties: {} },
    },
  });
  const v = getToolValidator('t5');
  assert.equal(v.validateInput({ title: 'x', count: 3 }), true);
});

test('Suite 202-04: output validator works independently of input validator', () => {
  compileToolSchemas({
    t6: {
      input: { type: 'object', properties: {}, additionalProperties: false },
      output: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ok', 'err'] } }, additionalProperties: false },
    },
  });
  const v = getToolValidator('t6');
  assert.equal(v.validateOutput({ status: 'ok' }), true);
  assert.equal(v.validateOutput({ status: 'weird' }), false);
  assert.equal(v.validateOutput({}), false);
});

test('Suite 202-04: strict mode refuses schemas with unknown keywords', () => {
  assert.throws(() => {
    compileToolSchemas({
      bad: {
        input: { type: 'object', fancyNewKeyword: 'lol', properties: {} },
        output: { type: 'object' },
      },
    });
  });
});
