'use strict';

// Phase 204 Plan 01 Task 2: TTY-adaptive output primitive.
//
// D-10 locked exit codes:
//   0 SUCCESS
//   1 USER_ERROR       (invalid flags, validation fail, no brief)
//   2 TRANSIENT        (network timeout, 5xx, queue backpressure)
//   3 AUTH_FAILURE     (401, no keychain entry, expired token)
//   4 QUOTA_PERMISSION (403, 429 quota)
//   5 INTERNAL_BUG     (unexpected exception)
//
// NO_COLOR compliance (no-color.org): any non-empty NO_COLOR disables color.
// Hand-rolled ANSI (D-08 zero-dep rule; no chalk/cli-table).

const EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  USER_ERROR: 1,
  TRANSIENT: 2,
  AUTH_FAILURE: 3,
  QUOTA_PERMISSION: 4,
  INTERNAL_BUG: 5,
});

const ANSI = Object.freeze({
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
});

function shouldUseJson(opts = {}) {
  if (!process.stdout.isTTY) return true;
  if (opts.json === true) return true;
  if (opts.format === 'json') return true;
  if (process.env.NO_COLOR) return true;
  return false;
}

function shouldUseColor(opts = {}) {
  if (!process.stdout.isTTY) return false;
  if (process.env.NO_COLOR) return false;
  if (opts.json === true || opts.format === 'json') return false;
  return true;
}

function stripAnsi(s) {
  // Minimal stripper for width calculation.
  // eslint-disable-next-line no-control-regex
  return String(s).replace(/\x1b\[[0-9;]*m/g, '');
}

function padCell(s, width) {
  const visible = stripAnsi(s);
  const pad = Math.max(0, width - visible.length);
  return s + ' '.repeat(pad);
}

function renderJson(obj) {
  // One object per line to stdout.
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function renderTable(rows, columns, opts = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    if (shouldUseColor(opts)) {
      process.stdout.write(ANSI.DIM + '(no rows)' + ANSI.RESET + '\n');
    } else {
      process.stdout.write('(no rows)\n');
    }
    return;
  }

  const cols = Array.isArray(columns) && columns.length
    ? columns
    : Object.keys(rows[0]);

  // Compute widths from header + each cell.
  const widths = cols.map((col) => {
    let w = String(col).length;
    for (const row of rows) {
      const cell = row == null ? '' : row[col];
      w = Math.max(w, String(cell == null ? '' : cell).length);
    }
    return w;
  });

  const color = shouldUseColor(opts);
  const sep = '  ';

  // Header.
  const header = cols.map((col, i) => {
    const text = padCell(String(col), widths[i]);
    return color ? (ANSI.BOLD + ANSI.CYAN + text + ANSI.RESET) : text;
  }).join(sep);
  process.stdout.write(header + '\n');

  // Underline.
  const underline = cols.map((_col, i) => '-'.repeat(widths[i])).join(sep);
  process.stdout.write((color ? ANSI.DIM + underline + ANSI.RESET : underline) + '\n');

  // Rows.
  for (const row of rows) {
    const line = cols.map((col, i) => {
      const val = row == null ? '' : row[col];
      return padCell(String(val == null ? '' : val), widths[i]);
    }).join(sep);
    process.stdout.write(line + '\n');
  }
}

function render(data, opts = {}) {
  if (shouldUseJson(opts)) {
    renderJson(data);
    return;
  }
  if (Array.isArray(data)) {
    renderTable(data, opts.columns, opts);
    return;
  }
  renderTable([data], opts.columns, opts);
}

module.exports = {
  EXIT_CODES,
  ANSI,
  shouldUseJson,
  shouldUseColor,
  renderJson,
  renderTable,
  render,
};
