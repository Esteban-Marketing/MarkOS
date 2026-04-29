'use strict';

// Phase 201.1 D-110 (closes M3): WCAG 2.2 §1.4.3 luminance + contrast-ratio helpers.
// Pure functions — no I/O. Mirrors the SQL helper in migration 94.

const VANITY_LOGIN_BG = '#ffffff';
const WCAG_AA_THRESHOLD = 4.5;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Parse a #RRGGBB hex string to an RGB object.
 * Returns null for invalid input.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number } | null}
 */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  if (!HEX_COLOR.test(trimmed)) return null;
  return {
    r: parseInt(trimmed.slice(1, 3), 16),
    g: parseInt(trimmed.slice(3, 5), 16),
    b: parseInt(trimmed.slice(5, 7), 16),
  };
}

/**
 * sRGB channel [0-255] → linear light value per WCAG 2.2 §1.4.3.
 * @param {number} channel
 * @returns {number}
 */
function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Relative luminance per WCAG 2.2 §1.4.3.
 * Returns a value in [0, 1] where 0 = black, 1 = white.
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {number}
 */
function relativeLuminance(rgb) {
  if (!rgb) return 0;
  return (
    0.2126 * srgbToLinear(rgb.r) +
    0.7152 * srgbToLinear(rgb.g) +
    0.0722 * srgbToLinear(rgb.b)
  );
}

/**
 * WCAG 2.2 contrast ratio between two RGB colors.
 * Returns a value in [1.0, 21.0]. Symmetric: contrastRatio(A, B) === contrastRatio(B, A).
 * @param {{ r: number, g: number, b: number }} rgbA
 * @param {{ r: number, g: number, b: number }} rgbB
 * @returns {number}
 */
function contrastRatio(rgbA, rgbB) {
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether a foreground hex color passes WCAG AA 4.5:1 against a background hex color.
 * @param {string} fgHex - Foreground color, e.g. '#0f766e'
 * @param {string} bgHex - Background color, e.g. '#ffffff'
 * @param {number} [threshold] - Default WCAG_AA_THRESHOLD (4.5)
 * @returns {{ ok: boolean, ratio: number, threshold: number, error?: string }}
 */
function passesWcagAa(fgHex, bgHex, threshold) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const t = threshold || WCAG_AA_THRESHOLD;
  if (!fg || !bg) {
    return { ok: false, ratio: 0, threshold: t, error: 'invalid_hex' };
  }
  const ratio = contrastRatio(fg, bg);
  return { ok: ratio >= t, ratio, threshold: t };
}

module.exports = {
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  passesWcagAa,
  VANITY_LOGIN_BG,
  WCAG_AA_THRESHOLD,
  HEX_COLOR,
};
