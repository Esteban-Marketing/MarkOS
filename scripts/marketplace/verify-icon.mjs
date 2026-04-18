#!/usr/bin/env node
// Phase 202 Plan 10 Task 1: Verify marketplace icon is a real 512x512 PNG.
// M3 acceptance gate: exits non-zero if icon is not 512x512 PNG.

import { readFileSync } from 'node:fs';

const path = 'public/mcp-icon.png';
const buf = readFileSync(path);

if (buf.length < 24) {
  console.error(`FAIL: icon too small (${buf.length} bytes)`);
  process.exit(1);
}

// PNG signature check
if (buf.readUInt32BE(0) !== 0x89504E47) {
  console.error('FAIL: not a PNG (bad signature)');
  process.exit(1);
}

// IHDR chunk dimensions at bytes 16-23
const w = buf.readUInt32BE(16);
const h = buf.readUInt32BE(20);

if (w !== 512 || h !== 512) {
  console.error(`FAIL: icon dims ${w}x${h}, expected 512x512`);
  process.exit(1);
}

console.log(`OK: icon verified 512x512 PNG (${buf.length} bytes)`);
