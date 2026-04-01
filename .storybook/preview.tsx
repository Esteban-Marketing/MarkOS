import type { Preview, Decorator, Parameters } from "@storybook/react";
import React from "react";
import { defaultBrandPack, mergeBrandPack } from "../lib/markos/theme/brand-pack";
import { tokenMap, baseSemanticTokens } from "../lib/markos/theme/tokens";

// ============================================================================
// Deterministic Global State
// ============================================================================

// Freeze date/time for reproducible snapshots
const FROZEN_DATE = new Date("2026-04-01T12:00:00Z");

// Seeded RNG for deterministic fixture generation
function seededRNG(seed: number): () => number {
  const m = 2147483647; // Mersenne prime
  const a = 16807;
  let state = seed;

  return () => {
    state = (a * state) % m;
    return (state - 1) / (m - 1);
  };
}

const deterministicRNG = seededRNG(42);

// ============================================================================
// Theme Provider Decorator
// ============================================================================

type ThemeVariant = "default" | "white-label";

const ThemeProvider: Decorator = (Story, context) => {
  const themeVariant: ThemeVariant = context.parameters.theme || "default";
  const brandPack =
    themeVariant === "white-label"
      ? {
          ...defaultBrandPack,
          tenantId: "white-label-tenant",
          label: "White-label Theme",
          overrides: {
            ...defaultBrandPack.overrides,
            "color.action.primary": "#8b5cf6",
            "color.action.primaryText": "#ffffff",
            "color.text.primary": "#1e1b4b",
            "color.bg.canvas": "#fafaf9",
          },
        }
      : defaultBrandPack;

  const tokens = mergeBrandPack(brandPack);

  return (
    <div
      style={{
        "--color-bg-canvas": tokens["color.bg.canvas"],
        "--color-bg-panel": tokens["color.bg.panel"],
        "--color-text-primary": tokens["color.text.primary"],
        "--color-text-muted": tokens["color.text.muted"],
        "--color-action-primary": tokens["color.action.primary"],
        "--color-action-primary-text": tokens["color.action.primaryText"],
        "--radius-md": tokens["radius.md"],
        "--space-md": tokens["space.md"],
        "--font-body": tokens["font.body"],
        "--font-display": tokens["font.display"],
        backgroundColor: tokens["color.bg.canvas"],
        color: tokens["color.text.primary"],
        fontFamily: tokens["font.body"],
        padding: "2rem",
        minHeight: "100vh",
      } as React.CSSProperties}
    >
      <Story />
    </div>
  );
};

// ============================================================================
// Role Context Decorator
// ============================================================================

import { canAccess, canPublish, type MarkOSRole } from "../lib/markos/rbac/policies";

const RoleContextProvider: Decorator = (Story, context) => {
  const role: MarkOSRole = context.parameters.role || "viewer";
  const roleLabel =
    role === "owner"
      ? "Owner"
      : role === "operator"
        ? "Operator"
        : role === "strategist"
          ? "Strategist"
          : role === "viewer"
            ? "Viewer"
            : "Agent";

  return (
    <div style={{ border: "2px solid #ccc", padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
        <strong>Role Context:</strong> {roleLabel}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#999" }}>
        Can access: company, mir, msp, icps, segments, campaigns
        {role === "owner" || role === "operator" ? ", settings" : ""}
        {canPublish(role) ? " • Can publish" : ""}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Story />
      </div>
    </div>
  );
};

// ============================================================================
// Deterministic Fixtures Decorator
// ============================================================================

function DeterministicFixtureWrapper({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const originalDate = globalThis.Date;
    const originalRandom = Math.random;

    class FrozenDate extends originalDate {
      constructor(...args: ConstructorParameters<DateConstructor>) {
        if (args.length === 0) {
          super(FROZEN_DATE);
        } else {
          super(...args);
        }
      }

      static now() {
        return FROZEN_DATE.getTime();
      }
    }

    globalThis.Date = FrozenDate as DateConstructor;
    Math.random = deterministicRNG;

    return () => {
      globalThis.Date = originalDate;
      Math.random = originalRandom;
    };
  }, []);

  return <>{children}</>;
}

const DeterministicFixtures: Decorator = (Story) => {
  return (
    <DeterministicFixtureWrapper>
      <Story />
    </DeterministicFixtureWrapper>
  );
};

// ============================================================================
// Global Decorators
// ============================================================================

const globalDecorators: Decorator[] = [DeterministicFixtures, ThemeProvider, RoleContextProvider];

// ============================================================================
// Viewport Configuration
// ============================================================================

const viewportConfig = {
  mobile: {
    name: "Mobile",
    styles: {
      width: "375px",
      height: "667px",
    },
  },
  tablet: {
    name: "Tablet",
    styles: {
      width: "768px",
      height: "1024px",
    },
  },
  desktop: {
    name: "Desktop",
    styles: {
      width: "1440px",
      height: "900px",
    },
  },
};

// ============================================================================
// Global Parameters
// ============================================================================

const parameters: Parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
  a11y: {
    config: {
      rules: [
        {
          id: "color-contrast",
          enabled: true,
        },
        {
          id: "valid-aria-role",
          enabled: true,
        },
      ],
    },
  },
  layout: "fullscreen",
  viewport: {
    viewports: viewportConfig,
  },
  testRunner: {
    // Run accessibility tests on all stories
    a11y: {
      enabled: true,
    },
  },
  // Default theme variant
  theme: "default",
  role: "viewer" as MarkOSRole,
};

const preview: Preview = {
  decorators: globalDecorators,
  parameters,
};

export default preview;
