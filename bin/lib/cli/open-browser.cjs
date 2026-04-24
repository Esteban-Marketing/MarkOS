'use strict';

// Phase 204 Plan 01 Task 2: Cross-platform browser launch (zero-dep).
//
// Source pattern: sindresorhus/open, inlined per D-08 (zero-dep rule, <20 LOC).
// - win32: cmd.exe /c start "" <url>   (empty "" is mandatory window-title arg)
// - darwin: open <url>
// - linux / other: xdg-open <url>
// - Headless / CI / !isTTY: print URL only; never throws.

const { spawn } = require('node:child_process');

function openBrowser(url) {
  if (!url) return null;

  // Headless / CI / non-TTY — print URL only.
  if (!process.stdout.isTTY || process.env.CI) {
    process.stdout.write(`\n  Open this URL in a browser: ${url}\n\n`);
    return null;
  }

  let cmd;
  let args;
  if (process.platform === 'win32') {
    cmd = 'cmd.exe';
    args = ['/c', 'start', '""', url];
  } else if (process.platform === 'darwin') {
    cmd = 'open';
    args = [url];
  } else {
    cmd = 'xdg-open';
    args = [url];
  }

  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.on('error', () => {
      // swallow — print fallback URL instead.
      process.stdout.write(`\n  (browser didn't launch) Open: ${url}\n\n`);
    });
    child.unref();
    return child;
  } catch {
    process.stdout.write(`\n  (browser didn't launch) Open: ${url}\n\n`);
    return null;
  }
}

module.exports = { openBrowser };
