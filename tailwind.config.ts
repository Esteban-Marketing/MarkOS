/**
 * MarkOS Tailwind theme — generated from DESIGN.md (canonical).
 * To regenerate: npx @google/design.md export --format tailwind DESIGN.md
 * Drift between DESIGN.md and this file is a CI failure.
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './stories/**/*.{ts,tsx,mdx}',
    './.storybook/**/*.{ts,tsx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary:    { DEFAULT: '#00D9A3', hover: '#00C492', pressed: '#00B083', subtle: 'rgb(0 217 163 / 0.10)' },
        secondary:  { DEFAULT: '#7B8DA6', hover: '#8C9DB5' },
        accent:     { DEFAULT: '#FFB800', hover: '#FFC633' },
        surface:    { DEFAULT: '#0A0E14', raised: '#1A1F2A', overlay: '#242B38', inverse: '#F4F4F0' },
        border:     { DEFAULT: '#2D3441', strong: '#3A4250', subtle: 'rgb(45 52 65 / 0.40)' },
        on: {
          primary: '#0A0E14',
          accent:  '#0A0E14',
          surface: '#E6EDF3',
          'surface-muted':  '#7B8DA6',
          'surface-subtle': '#6B7785',
        },
        success: { DEFAULT: '#3FB950', hover: '#4ED561' },
        warning: { DEFAULT: '#FFB800', hover: '#FFC633' },
        error:   { DEFAULT: '#F85149', hover: '#FF6961' },
        info:    { DEFAULT: '#58A6FF', hover: '#79B8FF' },
      },

      fontFamily: {
        mono: ['"JetBrains Mono"', '"Source Code Pro"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },

      fontSize: {
        display:   ['3.052rem', { lineHeight: '1.05',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        h1:        ['2.441rem', { lineHeight: '1.10',  letterSpacing: '-0.015em', fontWeight: '700' }],
        h2:        ['1.953rem', { lineHeight: '1.20',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        h3:        ['1.563rem', { lineHeight: '1.30',  letterSpacing: '-0.005em', fontWeight: '600' }],
        h4:        ['1.250rem', { lineHeight: '1.40',  letterSpacing: '0',        fontWeight: '500' }],
        lead:      ['1.250rem', { lineHeight: '1.50',  letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-md': ['1.000rem', { lineHeight: '1.60',  letterSpacing: '0',        fontWeight: '400' }],
        'body-sm': ['0.800rem', { lineHeight: '1.50',  letterSpacing: '0.01em',   fontWeight: '500' }],
        'label-caps': ['0.640rem', { lineHeight: '1.40', letterSpacing: '0.04em', fontWeight: '600' }],
        'code-inline': ['0.875rem', { lineHeight: '1.50', letterSpacing: '0',     fontWeight: '400' }],
        'code-block':  ['0.875rem', { lineHeight: '1.65', letterSpacing: '0',     fontWeight: '400' }],
      },

      spacing: {
        none: '0',
        xxs: '2px',
        xs:  '8px',
        sm:  '16px',
        md:  '24px',
        lg:  '32px',
        xl:  '48px',
        xxl: '96px',
      },

      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },

      boxShadow: {
        flat:    'none',
        raised:  '0 1px 0 0 #2D3441',
        card:    '0 1px 2px 0 rgba(0,0,0,0.35)',
        popover: '0 8px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px #2D3441',
        modal:   '0 24px 64px -8px rgba(0,0,0,0.55), 0 0 0 1px #3A4250',
      },

      transitionDuration: {
        instant: '0ms',
        fast:    '100ms',
        base:    '150ms',
        slow:    '300ms',
        pulse:   '2000ms',
      },

      transitionTimingFunction: {
        out:   'cubic-bezier(0.2, 0, 0, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      maxWidth: {
        prose:     '720px',
        container: '1280px',
        modal:     '560px',
        toast:     '360px',
      },

      ringColor:       { DEFAULT: '#00D9A3' },
      ringOffsetColor: { DEFAULT: '#0A0E14' },
      ringWidth:       { DEFAULT: '2px' },
      ringOffsetWidth: { DEFAULT: '2px' },

      keyframes: {
        'kernel-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'kernel-pulse': 'kernel-pulse 2000ms linear infinite',
      },
    },
  },

  plugins: [],
};

export default config;
