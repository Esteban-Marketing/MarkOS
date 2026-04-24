'use strict';

// Phase 204 Plan 01 Task 2: output primitive tests.

const test = require('node:test');
const assert = require('node:assert/strict');
const { EXIT_CODES, shouldUseJson, renderTable, renderJson } = require('../../bin/lib/cli/output.cjs');

function captureStdout(fn) {
  const chunks = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, enc, cb) => {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString(enc || 'utf8'));
    if (cb) cb();
    return true;
  };
  try {
    fn();
  } finally {
    process.stdout.write = origWrite;
  }
  return chunks.join('');
}

test('output-01: shouldUseJson returns true when NO_COLOR set', () => {
  const saved = process.env.NO_COLOR;
  process.env.NO_COLOR = '1';
  try {
    assert.equal(shouldUseJson({}), true);
  } finally {
    if (saved === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = saved;
  }
});

test('output-02: shouldUseJson returns false in TTY with no flags (mocked)', () => {
  const saved = { isTTY: process.stdout.isTTY, NO_COLOR: process.env.NO_COLOR };
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  delete process.env.NO_COLOR;
  try {
    assert.equal(shouldUseJson({}), false);
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: saved.isTTY, configurable: true });
    if (saved.NO_COLOR !== undefined) process.env.NO_COLOR = saved.NO_COLOR;
  }
});

test('output-02b: shouldUseJson returns true when opts.json', () => {
  assert.equal(shouldUseJson({ json: true }), true);
});

test('output-02c: shouldUseJson returns true when opts.format === "json"', () => {
  assert.equal(shouldUseJson({ format: 'json' }), true);
});

test('output-03: EXIT_CODES has exactly 6 entries matching D-10', () => {
  assert.equal(Object.keys(EXIT_CODES).length, 6);
  assert.equal(EXIT_CODES.SUCCESS, 0);
  assert.equal(EXIT_CODES.USER_ERROR, 1);
  assert.equal(EXIT_CODES.TRANSIENT, 2);
  assert.equal(EXIT_CODES.AUTH_FAILURE, 3);
  assert.equal(EXIT_CODES.QUOTA_PERMISSION, 4);
  assert.equal(EXIT_CODES.INTERNAL_BUG, 5);
});

test('output-04: renderTable outputs ANSI escape sequence in TTY mode', () => {
  const savedTTY = process.stdout.isTTY;
  const savedNC = process.env.NO_COLOR;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  delete process.env.NO_COLOR;
  try {
    const out = captureStdout(() => {
      renderTable([{ name: 'a', val: 1 }], ['name', 'val']);
    });
    // eslint-disable-next-line no-control-regex
    assert.match(out, /\x1b\[/, 'TTY mode should emit ANSI escape sequences');
    assert.match(out, /name/);
    assert.match(out, /val/);
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: savedTTY, configurable: true });
    if (savedNC !== undefined) process.env.NO_COLOR = savedNC;
  }
});

test('output-05: renderJson emits one object per line', () => {
  const out = captureStdout(() => {
    renderJson({ hello: 'world' });
  });
  assert.equal(out, '{"hello":"world"}\n');
});

test('output-06: renderTable honors NO_COLOR (no ANSI)', () => {
  const savedTTY = process.stdout.isTTY;
  const savedNC = process.env.NO_COLOR;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  process.env.NO_COLOR = '1';
  try {
    const out = captureStdout(() => {
      renderTable([{ name: 'a' }], ['name']);
    });
    // eslint-disable-next-line no-control-regex
    assert.doesNotMatch(out, /\x1b\[/, 'NO_COLOR should disable ANSI');
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: savedTTY, configurable: true });
    if (savedNC === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = savedNC;
  }
});
