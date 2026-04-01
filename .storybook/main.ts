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

  webpackFinal: async (config) => {
    return config;
  },

  core: {
    disableTelemetry: true,
  },

  staticDirs: ["../public"],
};

export default config;
