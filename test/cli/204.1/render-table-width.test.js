'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ANSI, renderTable } = require('../../../bin/lib/cli/output.cjs');

function stripAnsi(value) {
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/\x1b\[[0-9;]*m/g, '');
}

async function withStdoutState({ isTTY = true, columns = 80, noColor = null }, fn) {
  const prevTTY = process.stdout.isTTY;
  const prevColumns = process.stdout.columns;
  const prevNoColor = process.env.NO_COLOR;
  Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, configurable: true, writable: true });
  Object.defineProperty(process.stdout, 'columns', { value: columns, configurable: true, writable: true });
  if (noColor == null) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = noColor;

  const originalWrite = process.stdout.write.bind(process.stdout);
  let stdout = '';
  process.stdout.write = (chunk) => {
    stdout += String(chunk);
    return true;
  };

  try {
    await fn();
  } finally {
    process.stdout.write = originalWrite;
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
    Object.defineProperty(process.stdout, 'columns', { value: prevColumns, configurable: true, writable: true });
    if (prevNoColor == null) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = prevNoColor;
  }

  return stdout;
}

const ROWS = [
  { key: 'FOO', value_preview: '***1234', updated_at: '2026-04-30T00:00:00Z', status: 'active' },
  { key: 'BAR', value_preview: '***5678', updated_at: '2026-04-29T00:00:00Z', status: 'pending' },
];

const COLUMNS = ['key', 'value_preview', 'updated_at', 'status'];

test('204.1 renderTable: columns < 60 uses vertical layout', async () => {
  const stdout = await withStdoutState({ isTTY: true, columns: 50 }, async () => {
    renderTable(ROWS, COLUMNS);
  });
  const plain = stripAnsi(stdout);
  assert.match(plain, /^key: FOO/m);
  assert.match(plain, /^value_preview: \*\*\*1234/m);
  assert.match(plain, /^status: active/m);
  assert.match(plain, /\n\nkey: BAR/m);
  assert.doesNotMatch(plain, /^-+$/m);
});

test('204.1 renderTable: columns >= 60 keeps horizontal layout', async () => {
  const stdout = await withStdoutState({ isTTY: true, columns: 80 }, async () => {
    renderTable(ROWS, COLUMNS);
  });
  const plain = stripAnsi(stdout);
  assert.match(plain, /key\s+value_preview\s+updated_at\s+status/);
  assert.match(plain, /^-+\s+-+\s+-+\s+-+$/m);
  assert.doesNotMatch(plain, /^key: /m);
});

test('204.1 renderTable: undefined columns defaults to horizontal rendering', async () => {
  const stdout = await withStdoutState({ isTTY: true, columns: undefined }, async () => {
    renderTable(ROWS, COLUMNS);
  });
  const plain = stripAnsi(stdout);
  assert.match(plain, /key\s+value_preview\s+updated_at\s+status/);
  assert.match(plain, /^-+\s+-+\s+-+\s+-+$/m);
});

test('204.1 renderTable: empty rows keep the existing empty-state copy', async () => {
  const stdout = await withStdoutState({ isTTY: true, columns: 50 }, async () => {
    renderTable([], COLUMNS);
  });
  assert.equal(stripAnsi(stdout).trim(), '(no rows)');
});

test('204.1 renderTable: narrow labels are dimmed when color is enabled', async () => {
  const stdout = await withStdoutState({ isTTY: true, columns: 50 }, async () => {
    renderTable([ROWS[0]], COLUMNS);
  });
  assert.match(stdout, new RegExp(`${ANSI.DIM}key${ANSI.RESET}: FOO`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
