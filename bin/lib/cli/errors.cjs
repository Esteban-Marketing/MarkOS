'use strict';

// Phase 204 Plan 01 Task 2: Error formatting primitive.
//
// Maps structured error codes to D-10 exit codes. Renders a 3-line box to
// stderr in TTY mode; JSON one-line in non-TTY. Does NOT call process.exit()
// by default; callers explicitly pass { exit: true } to terminate.

const { EXIT_CODES, shouldUseJson, shouldUseColor, ANSI, pickGlyphs } = require('./output.cjs');

const ERROR_TO_EXIT = Object.freeze({
  INVALID_BRIEF: EXIT_CODES.USER_ERROR,
  INVALID_ARGS: EXIT_CODES.USER_ERROR,
  NOT_FOUND: EXIT_CODES.USER_ERROR,
  NETWORK_ERROR: EXIT_CODES.TRANSIENT,
  TIMEOUT: EXIT_CODES.TRANSIENT,
  SERVER_ERROR: EXIT_CODES.TRANSIENT,
  UNAUTHORIZED: EXIT_CODES.AUTH_FAILURE,
  NO_TOKEN: EXIT_CODES.AUTH_FAILURE,
  TOKEN_EXPIRED: EXIT_CODES.AUTH_FAILURE,
  FORBIDDEN: EXIT_CODES.QUOTA_PERMISSION,
  RATE_LIMITED: EXIT_CODES.QUOTA_PERMISSION,
  QUOTA_EXCEEDED: EXIT_CODES.QUOTA_PERMISSION,
  INTERNAL: EXIT_CODES.INTERNAL_BUG,
});

function exitCodeFor(code) {
  if (Object.prototype.hasOwnProperty.call(ERROR_TO_EXIT, code)) {
    return ERROR_TO_EXIT[code];
  }
  return EXIT_CODES.INTERNAL_BUG;
}

function formatError(payload, opts = {}) {
  const envelope = {
    error: payload.error || 'INTERNAL',
    message: payload.message || 'Unknown error',
  };

  if (payload.hint) {
    envelope.hint = payload.hint;
  }
  if (Number.isFinite(payload.retry_after_seconds)) {
    envelope.retry_after_seconds = payload.retry_after_seconds;
  }

  const asJson = shouldUseJson(opts) || !process.stderr.isTTY;

  if (asJson) {
    process.stderr.write(JSON.stringify(envelope) + '\n');
  } else {
    const color = shouldUseColor(opts) && process.stderr.isTTY;
    const G = pickGlyphs();
    const errTag = color ? (ANSI.RED + ANSI.BOLD + envelope.error + ANSI.RESET) : envelope.error;
    const header = G.topLeft + G.horiz + G.horiz + ' ' + errTag + ' ';
    const body = G.vert + ' ' + envelope.message;
    const footer = envelope.hint
      ? (G.bottomLeft + G.horiz + G.horiz + ' hint: ' + envelope.hint)
      : (G.bottomLeft + G.horiz + G.horiz);

    process.stderr.write(header + '\n');
    process.stderr.write(body + '\n');
    if (envelope.retry_after_seconds !== undefined) {
      process.stderr.write(G.vert + ' retry after: ' + envelope.retry_after_seconds + 's\n');
    }
    process.stderr.write(footer + '\n');
  }

  if (opts.exit) {
    process.exit(exitCodeFor(envelope.error));
  }
  return envelope;
}

module.exports = {
  ERROR_TO_EXIT,
  exitCodeFor,
  formatError,
};
