'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { stripBadRefs, resolveRef, normalizeResponseKeys, coerceStringSchemasToLoose } = require('../../scripts/sdk/prepare-openapi.cjs');
const { readOpenApiVersion, bumpTsPackage, bumpPythonProject } = require('../../scripts/sdk/bump-semver.cjs');

test('resolveRef returns node for known ref', () => {
  const doc = { components: { schemas: { Foo: { type: 'string' } } } };
  const resolved = resolveRef(doc, '#/components/schemas/Foo');
  assert.deepEqual(resolved, { type: 'string' });
});

test('resolveRef returns null for missing ref', () => {
  const doc = { components: { schemas: {} } };
  assert.equal(resolveRef(doc, '#/components/schemas/Missing'), undefined);
});

test('stripBadRefs replaces unresolvable refs with loose objects', () => {
  const doc = {
    components: { schemas: { Known: { type: 'string' } } },
    paths: {
      '/x': { get: { responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Missing' } } } } } } },
    },
  };
  const count = stripBadRefs(doc);
  assert.equal(count, 1);
  const node = doc.paths['/x'].get.responses['200'].content['application/json'].schema;
  assert.equal(node.$ref, undefined);
  assert.equal(node.type, 'object');
  assert.equal(node.additionalProperties, true);
});

test('stripBadRefs preserves valid refs', () => {
  const doc = {
    components: { schemas: { Known: { type: 'string' } } },
    paths: { '/x': { get: { responses: { '200': { schema: { $ref: '#/components/schemas/Known' } } } } } },
  };
  const count = stripBadRefs(doc);
  assert.equal(count, 0);
  assert.equal(doc.paths['/x'].get.responses['200'].schema.$ref, '#/components/schemas/Known');
});

test('normalizeResponseKeys unquotes single-quoted keys', () => {
  const doc = {
    paths: {
      '/x': {
        get: {
          responses: {
            "'200'": { description: 'OK' },
            "'404'": { description: 'Not found' },
          },
        },
      },
    },
  };
  const count = normalizeResponseKeys(doc);
  assert.equal(count, 2);
  const keys = Object.keys(doc.paths['/x'].get.responses);
  assert.deepEqual(keys, ['200', '404']);
});

test('coerceStringSchemasToLoose replaces string schemas and string properties', () => {
  const doc = {
    paths: {
      '/x': {
        post: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: '{ type: boolean }', // accidentally serialized as string
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const count = coerceStringSchemasToLoose(doc);
  assert.ok(count >= 1);
  const prop = doc.paths['/x'].post.responses['200'].content['application/json'].schema.properties.success;
  assert.equal(prop.type, 'object');
  assert.equal(prop.additionalProperties, true);
});

test('readOpenApiVersion returns project openapi version', () => {
  const version = readOpenApiVersion();
  assert.match(version, /^\d+\.\d+\.\d+/);
});

test('bump-semver functions are idempotent when version matches', () => {
  const version = readOpenApiVersion();
  const tsFirst = bumpTsPackage(version);
  const tsSecond = bumpTsPackage(version);
  assert.equal(tsSecond.changed, false);
  assert.equal(tsSecond.previous, version);
  // sanity: first call either bumped or already matched
  assert.ok(tsFirst.previous);
});
