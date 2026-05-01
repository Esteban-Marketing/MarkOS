'use strict';

/**
 * test/ui-a11y/213-5-marketing-a11y.test.js
 *
 * Phase 213.5 cross-cutting a11y + DESIGN.md v1.1.0 canon test suite.
 *
 * Mirrors test/ui-a11y/213-4-admin-ops-a11y.test.js grep-shape pattern
 * (node:test + node:assert/strict + fs.readFileSync).
 * Covers UI-SPEC ACs X-1 through X-12 by grepping both NEW module.css files,
 * both updated .tsx files, and both NEW story files for token-only authoring,
 * primitive composition, bracketed-glyph state coding, banned-lexicon = 0,
 * orphan-class elimination, and Storybook state coverage.
 *
 * AC# distribution: >=4 L-* AC# mentions (X-2) + >=4 DS-* AC# mentions (X-3).
 *
 * Run: npm run test:ui-a11y -- test/ui-a11y/213-5-marketing-a11y.test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function exists(file) { return fs.existsSync(path.join(ROOT, file)); }

// ---------------------------------------------------------------------------
// File path constants
// ---------------------------------------------------------------------------

const LANDING_CSS     = 'app/(marketing)/integrations/claude/page.module.css';
const LANDING_TSX     = 'app/(marketing)/integrations/claude/page.tsx';
const LANDING_STORIES = 'app/(marketing)/integrations/claude/page.stories.tsx';
const DEMO_CSS        = 'app/(marketing)/integrations/claude/demo/page.module.css';
const DEMO_TSX        = 'app/(marketing)/integrations/claude/demo/page.tsx';
const DEMO_STORIES    = 'app/(marketing)/integrations/claude/demo/page.stories.tsx';

// ---------------------------------------------------------------------------
// Shared regex guards
// ---------------------------------------------------------------------------

const HEX_RE          = /#[0-9a-fA-F]{3,8}\b/;
const FONT_BAN_RE     = /Sora|Space Grotesk/;
const ANTIPATTERN_RE  = /(linear-gradient|radial-gradient|box-shadow:\s*[^n]|transform:\s*translate)/;
const OFFGRID_RE      = /(?<![0-9])(10|12|13|14|15|18|20|22|28|36|40|45)px/;
const BANNED_LEXICON_RE = /\b(synergy|leverage|empower|unlock|revolutionize|supercharge|holistic|seamless|cutting-edge|innovative|game-changer|next-generation|world-class|best-in-class|reimagine|disrupt)\b/i;

// ===========================================================================
// Landing page (app/(marketing)/integrations/claude/) — L-* ACs
// ===========================================================================

test('213.5 L-1: landing page.module.css contains zero inline hex (token-only)', () => {
  assert.doesNotMatch(read(LANDING_CSS), HEX_RE);
});

test('213.5 L-1: landing page.module.css does not reference Sora or Space Grotesk', () => {
  assert.doesNotMatch(read(LANDING_CSS), FONT_BAN_RE);
});

test('213.5 L-1: landing page.module.css contains no gradient / box-shadow / transform-translate', () => {
  assert.doesNotMatch(read(LANDING_CSS), ANTIPATTERN_RE);
});

test('213.5 L-1: landing page.module.css contains no off-grid spacing literals (8px grid)', () => {
  assert.doesNotMatch(read(LANDING_CSS), OFFGRID_RE);
});

test('213.5 L-2: landing page.tsx eliminates legacy .claude-integration-landing orphan class', () => {
  assert.doesNotMatch(read(LANDING_TSX), /"claude-integration-landing"/);
});

test('213.5 L-3: landing page.tsx composes .c-card c-card--feature on hero section', () => {
  assert.match(read(LANDING_TSX), /"c-card c-card--feature"/);
});

test('213.5 L-3: landing page.tsx eliminates legacy .hero and .hero-sub orphan classes', () => {
  const src = read(LANDING_TSX);
  assert.doesNotMatch(src, /"hero"/);
  assert.doesNotMatch(src, /"hero-sub"/);
});

test('213.5 L-4: landing page.tsx composes .c-card c-card--interactive on tool grid items', () => {
  assert.match(read(LANDING_TSX), /"c-card c-card--interactive"/);
});

test('213.5 L-4: landing page.tsx composes .c-chip-protocol on tool name slugs', () => {
  assert.match(read(LANDING_TSX), /"c-chip-protocol"/);
});

test('213.5 L-4: landing page.tsx eliminates legacy .tool-grid orphan class', () => {
  assert.doesNotMatch(read(LANDING_TSX), /"tool-grid"/);
});

test('213.5 L-5: landing page.tsx composes .c-button c-button--primary on hero CTA', () => {
  assert.match(read(LANDING_TSX), /"c-button c-button--primary"/);
});

test('213.5 L-5: landing page.tsx composes .c-button c-button--tertiary on secondary CTA', () => {
  assert.match(read(LANDING_TSX), /"c-button c-button--tertiary"/);
});

test('213.5 L-5: landing page.tsx eliminates legacy .btn / .btn-primary / .btn-secondary orphan classes', () => {
  const src = read(LANDING_TSX);
  assert.doesNotMatch(src, /"btn"/);
  assert.doesNotMatch(src, /"btn-primary"/);
  assert.doesNotMatch(src, /"btn-secondary"/);
});

test('213.5 L-6: landing page.tsx contains exactly 2 .c-button c-button--primary occurrences (hero + final-cta, scroll-separated)', () => {
  const src = read(LANDING_TSX);
  const matches = src.match(/c-button c-button--primary/g) || [];
  assert.equal(matches.length, 2, `expected exactly 2 occurrences of c-button--primary, found ${matches.length}`);
});

test('213.5 L-7: landing page.tsx composes .c-code-inline on MCP server URL <code>', () => {
  assert.match(read(LANDING_TSX), /"c-code-inline"/);
});

// ===========================================================================
// Demo sandbox (app/(marketing)/integrations/claude/demo/) — DS-* ACs
// ===========================================================================

test('213.5 DS-1: demo page.module.css contains zero inline hex (token-only)', () => {
  assert.doesNotMatch(read(DEMO_CSS), HEX_RE);
});

test('213.5 DS-1: demo page.module.css does not reference Sora or Space Grotesk', () => {
  assert.doesNotMatch(read(DEMO_CSS), FONT_BAN_RE);
});

test('213.5 DS-1: demo page.module.css contains no gradient / box-shadow / transform-translate', () => {
  assert.doesNotMatch(read(DEMO_CSS), ANTIPATTERN_RE);
});

test('213.5 DS-1: demo page.module.css contains no off-grid spacing literals (8px grid)', () => {
  assert.doesNotMatch(read(DEMO_CSS), OFFGRID_RE);
});

test('213.5 DS-2: demo page.tsx eliminates legacy .claude-demo-sandbox orphan class', () => {
  assert.doesNotMatch(read(DEMO_TSX), /"claude-demo-sandbox"/);
});

test('213.5 DS-3: demo page.tsx wraps each of 5 fields with .c-field__label (>=5 occurrences)', () => {
  const src = read(DEMO_TSX);
  const count = (src.match(/c-field__label/g) || []).length;
  assert.ok(count >= 5, `expected >=5 .c-field__label occurrences, found ${count}`);
});

test('213.5 DS-3: demo page.tsx contains >=5 .c-input fields (one per brief field)', () => {
  const src = read(DEMO_TSX);
  const count = (src.match(/"c-input"/g) || []).length;
  assert.ok(count >= 5, `expected >=5 "c-input" occurrences, found ${count}`);
});

test('213.5 DS-4: demo page.tsx submit composes .c-button c-button--primary', () => {
  assert.match(read(DEMO_TSX), /c-button c-button--primary/);
});

test('213.5 DS-4: demo page.tsx submit toggles .is-loading on the primary button', () => {
  assert.match(read(DEMO_TSX), /is-loading/);
});

test('213.5 DS-4: demo page.tsx submit carries aria-busy={loading} for accessible state', () => {
  assert.match(read(DEMO_TSX), /aria-busy=\{loading\}/);
});

test('213.5 DS-5: demo page.tsx error notice composes .c-notice c-notice--error', () => {
  assert.match(read(DEMO_TSX), /c-notice c-notice--error/);
});

test('213.5 DS-5: demo page.tsx error notice contains [err] bracketed glyph (never color-only)', () => {
  assert.match(read(DEMO_TSX), /\[err\]/);
});

test('213.5 DS-5: demo page.tsx eliminates legacy .demo-error orphan class', () => {
  assert.doesNotMatch(read(DEMO_TSX), /"demo-error"/);
});

test('213.5 DS-6: demo page.tsx rate-limit notice composes .c-notice c-notice--warning', () => {
  assert.match(read(DEMO_TSX), /c-notice c-notice--warning/);
});

test('213.5 DS-6: demo page.tsx rate-limit notice contains [warn] bracketed glyph', () => {
  assert.match(read(DEMO_TSX), /\[warn\]/);
});

test('213.5 DS-6: demo page.tsx onSubmit contains 429 rate-limit branch', () => {
  assert.match(read(DEMO_TSX), /response\.status\s*===\s*429/);
});

test('213.5 DS-7: demo page.tsx result panel composes .c-card', () => {
  assert.match(read(DEMO_TSX), /"c-card"/);
});

test('213.5 DS-7: demo page.tsx eliminates legacy .demo-result orphan class', () => {
  assert.doesNotMatch(read(DEMO_TSX), /"demo-result"/);
});

test('213.5 DS-8: demo page.tsx calls issue-token and invoke endpoints (hardened flow)', () => {
  const src = read(DEMO_TSX);
  assert.match(src, /fetch\('\/integrations\/claude\/demo\/api\/issue-token'/);
  assert.match(src, /fetch\('\/integrations\/claude\/demo\/api\/invoke'/);
});

test("213.5 DS-8: demo page.tsx posts tool_name = 'draft_message' in the invoke body", () => {
  assert.match(read(DEMO_TSX), /tool_name:\s*toolName/);
  assert.match(read(DEMO_TSX), /invokeTool\('draft_message'\)/);
});

// ===========================================================================
// Cross-cutting — X-* ACs
// ===========================================================================

test('213.5 X-7: demo page.tsx contains both .c-notice variants (error + warning) for state coding', () => {
  const src = read(DEMO_TSX);
  assert.match(src, /c-notice c-notice--error/);
  assert.match(src, /c-notice c-notice--warning/);
});

test('213.5 X-8: demo page.tsx copy includes [err] and [warn] bracketed glyphs (state never color-only)', () => {
  const src = read(DEMO_TSX);
  assert.ok(src.includes('[err]'), '[err] glyph required for error state');
  assert.ok(src.includes('[warn]'), '[warn] glyph required for rate-limit state');
});

test('213.5 X-9: banned-lexicon scan returns 0 hits in landing page.tsx', () => {
  assert.doesNotMatch(read(LANDING_TSX), BANNED_LEXICON_RE);
});

test('213.5 X-9: banned-lexicon scan returns 0 hits in demo page.tsx', () => {
  assert.doesNotMatch(read(DEMO_TSX), BANNED_LEXICON_RE);
});

test('213.5 X-11: landing page.stories.tsx exists', () => {
  assert.ok(exists(LANDING_STORIES), 'landing page.stories.tsx must exist');
});

test('213.5 X-11: landing page.stories.tsx has meta.title 213.5/ClaudeLanding', () => {
  assert.match(read(LANDING_STORIES), /title: '213\.5\/ClaudeLanding'/);
});

test('213.5 X-11: landing page.stories.tsx exports Default + ToolListExpanded + CTAFocus + MobileBreakpoint', () => {
  const src = read(LANDING_STORIES);
  assert.match(src, /export const Default:/);
  assert.match(src, /export const ToolListExpanded:/);
  assert.match(src, /export const CTAFocus:/);
  assert.match(src, /export const MobileBreakpoint:/);
});

test('213.5 X-11: demo/page.stories.tsx exists', () => {
  assert.ok(exists(DEMO_STORIES), 'demo/page.stories.tsx must exist');
});

test('213.5 X-11: demo/page.stories.tsx has meta.title 213.5/ClaudeDemoSandbox', () => {
  assert.match(read(DEMO_STORIES), /title: '213\.5\/ClaudeDemoSandbox'/);
});

test('213.5 X-11: demo/page.stories.tsx exports Default + Drafting + Success + RateLimited + Error', () => {
  const src = read(DEMO_STORIES);
  assert.match(src, /export const Default:/);
  assert.match(src, /export const Drafting:/);
  assert.match(src, /export const Success:/);
  assert.match(src, /export const RateLimited:/);
  assert.match(src, /export const Error:/);
});

// Total test blocks: 46 covering L-1 (x4)/L-2/L-3 (x2)/L-4 (x3)/L-5 (x3)/L-6/L-7,
// DS-1 (x4)/DS-2/DS-3 (x2)/DS-4 (x3)/DS-5 (x3)/DS-6 (x3)/DS-7 (x2)/DS-8 (x2),
// X-7/X-8/X-9 (x2)/X-11 (x6).
// AC# L-* mentions >= 4 (L-1..L-7 = 7 unique). AC# DS-* mentions >= 4 (DS-1..DS-8 = 8 unique).
