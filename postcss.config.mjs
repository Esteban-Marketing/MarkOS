/**
 * PostCSS · MarkOS
 *
 * Tailwind v4 CSS-first pipeline. Loaded by Next.js for any app/(...)/.css and
 * imported via app/globals.css. Storybook (Vite) wires its own postcss config
 * — see .storybook/main.ts when adding Tailwind there.
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
