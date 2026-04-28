/**
 * MarkOS design tokens — TypeScript export.
 * Source of truth: /DESIGN.md
 *
 * Use for:
 *   - Type-safe access in JS/TS code (`import { color, spacing } from '@/tokens'`)
 *   - JS-driven theming where CSS variables aren't viable (canvas, charts, framer-motion)
 *   - Storybook controls
 *
 * Do NOT use as the runtime style source for components — prefer CSS variables in
 * `app/tokens.css` so users can override via `[data-theme]`. This file mirrors them
 * for static contexts only.
 */

export const color = {
  // Brand
  primary:         '#00D9A3',
  primaryHover:    '#00C492',
  primaryPressed:  '#00B083',
  primarySubtle:   'rgb(0 217 163 / 0.10)',
  onPrimary:       '#0A0E14',

  secondary:       '#7B8DA6',
  secondaryHover:  '#8C9DB5',
  onSecondary:     '#0A0E14',

  accent:          '#FFB800',
  accentHover:     '#FFC633',
  onAccent:        '#0A0E14',

  // Surfaces
  surface:         '#0A0E14',
  surfaceRaised:   '#1A1F2A',
  surfaceOverlay:  '#242B38',
  surfaceInverse:  '#F4F4F0',

  // Borders
  border:          '#2D3441',
  borderStrong:    '#3A4250',
  borderSubtle:    'rgb(45 52 65 / 0.40)',

  // Text
  onSurface:       '#E6EDF3',
  onSurfaceMuted:  '#7B8DA6',
  onSurfaceSubtle: '#6B7785',

  // State
  success:         '#3FB950',
  successHover:    '#4ED561',
  warning:         '#FFB800',
  warningHover:    '#FFC633',
  error:           '#F85149',
  errorHover:      '#FF6961',
  info:            '#58A6FF',
  infoHover:       '#79B8FF',
} as const;

export const fontFamily = {
  mono: '"JetBrains Mono", "Source Code Pro", Menlo, Consolas, monospace',
  sans: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;

export const fontWeight = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

export const fontSize = {
  display:  '3.052rem',
  h1:       '2.441rem',
  h2:       '1.953rem',
  h3:       '1.563rem',
  h4:       '1.250rem',
  lead:     '1.250rem',
  bodyMd:   '1.000rem',
  bodySm:   '0.800rem',
  label:    '0.640rem',
  code:     '0.875rem',
} as const;

export const spacing = {
  none: '0',
  xxs:  '2px',
  xs:   '8px',
  sm:   '16px',
  md:   '24px',
  lg:   '32px',
  xl:   '48px',
  xxl:  '96px',
} as const;

export const radius = {
  none: '0',
  xs:   '2px',
  sm:   '4px',
  md:   '6px',
  lg:   '8px',
  xl:   '12px',
  full: '9999px',
} as const;

export const shadow = {
  flat:    'none',
  raised:  '0 1px 0 0 #2D3441',
  card:    '0 1px 2px 0 rgba(0,0,0,0.35)',
  popover: '0 8px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px #2D3441',
  modal:   '0 24px 64px -8px rgba(0,0,0,0.55), 0 0 0 1px #3A4250',
} as const;

export const duration = {
  instant: 0,
  fast:    100,
  base:    150,
  slow:    300,
  pulse:   2000,
} as const;

export const easing = {
  out:    'cubic-bezier(0.2, 0, 0, 1)',
  inOut:  'cubic-bezier(0.4, 0, 0.2, 1)',
  linear: 'linear',
} as const;

export const breakpoint = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  xxl: 1536,
} as const;

export const container = {
  prose:     720,
  container: 1280,
  modal:     560,
  toast:     360,
} as const;

export const sizing = {
  controlHeight:      40,
  controlHeightTouch: 44,
  topbar:             64,
  sidebar:            240,
  sidebarMd:          200,
  iconSm:             16,
  iconMd:             20,
  iconLg:             24,
  iconXl:             32,
  statusDot:          6,
  statusDotHit:       12,
} as const;

export const focus = {
  ringWidth:  2,
  ringOffset: 2,
  ringColor:  color.primary,
} as const;

export const tokens = {
  color,
  fontFamily,
  fontWeight,
  fontSize,
  spacing,
  radius,
  shadow,
  duration,
  easing,
  breakpoint,
  container,
  sizing,
  focus,
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof color;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export default tokens;
