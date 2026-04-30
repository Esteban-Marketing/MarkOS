'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CLEAR_LINE,
  FRAMES_ASCII,
  FRAMES_UTF8,
  createSpinner,
  isUtf8Locale,
} = require('../../../bin/lib/cli/spinner.cjs');

async function withTty(fn, { stdout = true, stderr = true } = {}) {
  const prevStdout = process.stdout.isTTY;
  const prevStderr = process.stderr.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: stdout, configurable: true, writable: true });
  Object.defineProperty(process.stderr, 'isTTY', { value: stderr, configurable: true, writable: true });
  try {
    return await fn();
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevStdout, configurable: true, writable: true });
    Object.defineProperty(process.stderr, 'isTTY', { value: prevStderr, configurable: true, writable: true });
  }
}

async function captureStderr(fn) {
  const originalWrite = process.stderr.write.bind(process.stderr);
  let stderr = '';
  process.stderr.write = (chunk) => {
    stderr += String(chunk);
    return true;
  };
  try {
    await fn();
  } finally {
    process.stderr.write = originalWrite;
  }
  return stderr;
}

async function withEnv(overrides, fn) {
  const snapshot = {
    LANG: process.env.LANG,
    LC_ALL: process.env.LC_ALL,
    NO_COLOR: process.env.NO_COLOR,
    MARKOS_FORCE_ASCII: process.env.MARKOS_FORCE_ASCII,
    MARKOS_CODEPAGE: process.env.MARKOS_CODEPAGE,
  };
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('204.1 spinner: UTF-8 frames render in TTY mode', async () => {
  await withEnv({ LANG: 'en_US.UTF-8', LC_ALL: null, NO_COLOR: null }, async () => {
    const stderr = await withTty(() => captureStderr(async () => {
      const spinner = createSpinner({ label: 'fetching keys' });
      spinner.tick();
      spinner.tick();
      spinner.stop();
    }));
    assert.match(stderr, /fetching keys/);
    assert.ok(FRAMES_UTF8.some((frame) => stderr.includes(frame)), 'expected a UTF-8 spinner frame');
  });
});

test('204.1 spinner: ASCII frames render in LANG=C', async () => {
  await withEnv({ LANG: 'C', LC_ALL: null, NO_COLOR: null }, async () => {
    const stderr = await withTty(() => captureStderr(async () => {
      const spinner = createSpinner({ label: 'fetching keys' });
      spinner.tick();
      spinner.tick();
      spinner.stop();
    }));
    assert.match(stderr, /fetching keys/);
    assert.ok(FRAMES_ASCII.some((frame) => stderr.includes(frame)), 'expected an ASCII spinner frame');
    assert.ok(!FRAMES_UTF8.some((frame) => stderr.includes(frame)), 'UTF-8 frames should not appear in ASCII mode');
  });
});

test('204.1 spinner: silent when stderr is not a TTY', async () => {
  await withEnv({ LANG: 'en_US.UTF-8', LC_ALL: null, NO_COLOR: null }, async () => {
    const stderr = await withTty(() => captureStderr(async () => {
      const spinner = createSpinner({ label: 'quiet mode' });
      spinner.tick();
      spinner.stop();
    }), { stdout: true, stderr: false });
    assert.equal(stderr, '');
  });
});

test('204.1 spinner: silent in JSON mode', async () => {
  await withEnv({ LANG: 'en_US.UTF-8', LC_ALL: null, NO_COLOR: null }, async () => {
    const stderr = await withTty(() => captureStderr(async () => {
      const spinner = createSpinner({ label: 'json mode', opts: { json: true } });
      spinner.tick();
      spinner.stop();
    }));
    assert.equal(stderr, '');
  });
});

test('204.1 spinner: silent when NO_COLOR is set', async () => {
  await withEnv({ LANG: 'en_US.UTF-8', LC_ALL: null, NO_COLOR: '1' }, async () => {
    const stderr = await withTty(() => captureStderr(async () => {
      const spinner = createSpinner({ label: 'no color' });
      spinner.tick();
      spinner.stop();
    }));
    assert.equal(stderr, '');
  });
});

test('204.1 spinner: stop clears the line', async () => {
  await withEnv({ LANG: 'en_US.UTF-8', LC_ALL: null, NO_COLOR: null }, async () => {
    const stderr = await withTty(() => captureStderr(async () => {
      const spinner = createSpinner({ label: 'clearing' });
      await new Promise((resolve) => setTimeout(resolve, 170));
      spinner.stop();
    }));
    assert.ok(stderr.endsWith(CLEAR_LINE), `expected stderr to end with ${JSON.stringify(CLEAR_LINE)}`);
  });
});

test('204.1 spinner: isUtf8Locale respects LC_ALL and platform defaults', () => {
  assert.equal(isUtf8Locale({ LANG: 'en_US.UTF-8' }, 'linux'), true);
  assert.equal(isUtf8Locale({ LANG: 'C' }, 'linux'), false);
  assert.equal(isUtf8Locale({ LC_ALL: 'C', LANG: 'en_US.UTF-8' }, 'linux'), false);
  assert.equal(isUtf8Locale({}, 'linux'), true);
});
