'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { pickGlyphs, GLYPHS_ASCII, GLYPHS_UTF8 } = require('../../../bin/lib/cli/output.cjs');

test('204.1 glyphs: UTF-8 locale returns Unicode glyph set', () => {
  assert.deepEqual(pickGlyphs({ LANG: 'en_US.UTF-8' }, 'linux'), GLYPHS_UTF8);
});

test('204.1 glyphs: LANG=C returns ASCII glyph set', () => {
  assert.deepEqual(pickGlyphs({ LANG: 'C' }, 'linux'), GLYPHS_ASCII);
});

test('204.1 glyphs: LC_ALL takes precedence over LANG', () => {
  assert.deepEqual(pickGlyphs({ LC_ALL: 'C', LANG: 'en_US.UTF-8' }, 'linux'), GLYPHS_ASCII);
});

test('204.1 glyphs: Windows codepage override forces ASCII', () => {
  assert.deepEqual(pickGlyphs({ MARKOS_CODEPAGE: '437' }, 'win32'), GLYPHS_ASCII);
});

test('204.1 glyphs: Windows UTF-8 locale keeps Unicode glyphs', () => {
  assert.deepEqual(pickGlyphs({ LANG: 'en_US.UTF-8' }, 'win32'), GLYPHS_UTF8);
});
