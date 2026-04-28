import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  stories: [
    "../app/**/*.stories.tsx",
    "../lib/markos/**/*.stories.tsx",
    "../onboarding/**/*.stories.tsx",
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
  ],

  docs: {
    autodocs: "tag",
    defaultName: "Documentation",
  },

  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesAsTypes: true,
      propFilter: (prop) => {
        if (
          prop.parent?.fileName.includes("node_modules/@types") ||
          prop.parent?.fileName.includes("@types/react")
        ) {
          return false;
        }
        return true;
      },
    },
  },

  // Force automatic JSX runtime regardless of tsconfig `jsx: "preserve"` (Next.js setting).
  // Without this, esbuild compiles `<X />` to `React.createElement(...)` and story bundles
  // throw `ReferenceError: React is not defined` because component files don't import React
  // (they use JSX only). Phase 213.1 chrome stories surfaced this; fix is global.
  viteFinal: async (config) => {
    config.esbuild = {
      ...(config.esbuild || {}),
      jsx: "automatic",
      jsxImportSource: "react",
    };
    return config;
  },

  core: {
    disableTelemetry: true,
  },

  staticDirs: ["../public"],
};

export default config;
