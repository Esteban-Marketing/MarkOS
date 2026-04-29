// Phase 201.1 D-110 (closes M3): WCAG 2.2 §1.4.3 luminance + contrast-ratio helpers.
// Pure functions — no I/O. TypeScript mirror of contrast.cjs.

export const VANITY_LOGIN_BG = '#ffffff';
export const WCAG_AA_THRESHOLD = 4.5;
export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface WcagResult {
  ok: boolean;
  ratio: number;
  threshold: number;
  error?: string;
}

/**
 * Parse a #RRGGBB hex string to an RGB object.
 * Returns null for invalid input.
 */
export function hexToRgb(hex: string): RgbColor | null {
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
 * sRGB channel [0-255] -> linear light value per WCAG 2.2 §1.4.3.
 */
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Relative luminance per WCAG 2.2 §1.4.3.
 * Returns a value in [0, 1] where 0 = black, 1 = white.
 */
export function relativeLuminance(rgb: RgbColor): number {
  return (
    0.2126 * srgbToLinear(rgb.r) +
    0.7152 * srgbToLinear(rgb.g) +
    0.0722 * srgbToLinear(rgb.b)
  );
}

/**
 * WCAG 2.2 contrast ratio between two RGB colors.
 * Returns a value in [1.0, 21.0]. Symmetric.
 */
export function contrastRatio(rgbA: RgbColor, rgbB: RgbColor): number {
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether a foreground hex color passes WCAG AA 4.5:1 against a background hex color.
 */
export function passesWcagAa(
  fgHex: string,
  bgHex: string,
  threshold?: number,
): WcagResult {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const t = threshold ?? WCAG_AA_THRESHOLD;
  if (!fg || !bg) {
    return { ok: false, ratio: 0, threshold: t, error: 'invalid_hex' };
  }
  const ratio = contrastRatio(fg, bg);
  return { ok: ratio >= t, ratio, threshold: t };
}
