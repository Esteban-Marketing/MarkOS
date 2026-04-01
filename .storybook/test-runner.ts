import type { TestRunnerConfig } from "@storybook/test-runner";
import { injectAxe, checkA11y } from "axe-playwright";

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Inject axe for accessibility testing
    await injectAxe(page);
  },

  async postVisit(page, context) {
    // Run accessibility checks on each story
    await checkA11y(page, "canvas [data-testid=storybook-root]", {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};

export default config;
