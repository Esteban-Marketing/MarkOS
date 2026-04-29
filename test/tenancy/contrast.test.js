'use strict';
// Phase 201.1 D-110 (closes M3): Tests for WCAG 2.2 §1.4.3 luminance + contrast helpers.
const test = require('node:test');
const assert = require('node:assert/strict');

// RED: these tests will fail until contrast.cjs is created.
const { hexToRgb, relativeLuminance, contrastRatio, passesWcagAa, VANITY_LOGIN_BG, WCAG_AA_THRESHOLD } = require('../../lib/markos/tenant/contrast.cjs');

test('Suite 201.1-07: VANITY_LOGIN_BG is #ffffff', () => {
  assert.equal(VANITY_LOGIN_BG, '#ffffff');
});

test('Suite 201.1-07: WCAG_AA_THRESHOLD is 4.5', () => {
  assert.equal(WCAG_AA_THRESHOLD, 4.5);
});

test('Suite 201.1-07: hexToRgb black', () => {
  assert.deepEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0 });
});

test('Suite 201.1-07: hexToRgb white uppercase', () => {
  assert.deepEqual(hexToRgb('#FFFFFF'), { r: 255, g: 255, b: 255 });
});

test('Suite 201.1-07: hexToRgb phase-201 default teal', () => {
  assert.deepEqual(hexToRgb('#0d9488'), { r: 13, g: 148, b: 136 });
});

test('Suite 201.1-07: hexToRgb invalid returns null', () => {
  assert.equal(hexToRgb('not-a-hex'), null);
  assert.equal(hexToRgb(null), null);
  assert.equal(hexToRgb('#12345'), null); // 5-char, not 6
});

test('Suite 201.1-07: relativeLuminance white = 1.0', () => {
  const lum = relativeLuminance({ r: 255, g: 255, b: 255 });
  assert.ok(Math.abs(lum - 1.0) < 0.001, `expected ~1.0, got ${lum}`);
});

test('Suite 201.1-07: relativeLuminance black = 0.0', () => {
  const lum = relativeLuminance({ r: 0, g: 0, b: 0 });
  assert.ok(Math.abs(lum - 0.0) < 0.001, `expected ~0.0, got ${lum}`);
});

test('Suite 201.1-07: contrastRatio white vs black = 21', () => {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const ratio = contrastRatio(white, black);
  assert.ok(Math.abs(ratio - 21.0) < 0.001, `expected ~21.0, got ${ratio}`);
});

test('Suite 201.1-07: contrastRatio is symmetric', () => {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const ab = contrastRatio(white, black);
  const ba = contrastRatio(black, white);
  assert.ok(Math.abs(ab - ba) < 0.0001, `expected symmetric: ${ab} vs ${ba}`);
});

test('Suite 201.1-07: passesWcagAa — #ffffe0 cream on white FAILS (< 1.5)', () => {
  const result = passesWcagAa('#ffffe0', '#ffffff');
  assert.equal(result.ok, false, `Expected fail but got ratio ${result.ratio}`);
  assert.ok(result.ratio < 1.5, `Expected ratio < 1.5, got ${result.ratio}`);
});

test('Suite 201.1-07: passesWcagAa — #000000 black on white PASSES (21:1)', () => {
  const result = passesWcagAa('#000000', '#ffffff');
  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.ratio - 21.0) < 0.001, `Expected ~21.0, got ${result.ratio}`);
});

test('Suite 201.1-07: passesWcagAa — #0d9488 phase-201 teal FAILS (< 4.5)', () => {
  // The Phase 201 default teal fails WCAG AA — this test documents the failure.
  const result = passesWcagAa('#0d9488', '#ffffff');
  assert.equal(result.ok, false, `Expected fail: teal #0d9488 ratio is ~3.86:1`);
  assert.ok(result.ratio < 4.5, `Expected ratio < 4.5, got ${result.ratio}`);
});

test('Suite 201.1-07: passesWcagAa — #0f766e corrected teal PASSES (>= 4.5)', () => {
  // The Plan 07 replacement color that passes WCAG AA.
  const result = passesWcagAa('#0f766e', '#ffffff');
  assert.equal(result.ok, true, `Expected pass but ratio was ${result.ratio}`);
  assert.ok(result.ratio >= 4.5, `Expected ratio >= 4.5, got ${result.ratio}`);
});

test('Suite 201.1-07: passesWcagAa invalid hex returns ok=false with error field', () => {
  const result = passesWcagAa('not-valid', '#ffffff');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'invalid_hex');
});
