import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Theme Settings
 *
 * Brand customization, color palette configuration, and white-label tenant styling.
 *
 * **Coverage:** State (loading, empty, success, error, unauthorized, forbidden) | Role (owner, operator only)
 */

interface ThemeSettingPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator";
}

function ThemeSettingPage({ state, role }: ThemeSettingPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <div style={{ padding: "2rem" }}>Loading theme settings...</div>;
      case "empty":
        return <div style={{ padding: "2rem" }}>No custom theme configured. Using default theme.</div>;
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1>Theme Settings</h1>
            <div style={{ marginTop: "1rem" }}>
              <h2>Current Theme</h2>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <div style={{ width: "50px", height: "50px", backgroundColor: "#0d9488", borderRadius: "4px", border: "2px solid #ccc" }} />
                <div style={{ width: "50px", height: "50px", backgroundColor: "#06b6d4", borderRadius: "4px", border: "2px solid #ccc" }} />
                <div style={{ width: "50px", height: "50px", backgroundColor: "#f5f7fa", borderRadius: "4px", border: "2px solid #ccc" }} />
              </div>
              <p style={{ marginTop: "1rem" }}>Primary: #0d9488 &bull; Secondary: #06b6d4 &bull; Canvas: #f5f7fa</p>
              {role === "owner" && (
                <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Customize Theme
                </button>
              )}
            </div>
          </div>
        );
      case "error":
        return <div style={{ padding: "2rem", color: "red" }}>Failed to load theme settings</div>;
      case "unauthorized":
        return <div style={{ padding: "2rem" }}>Authentication required</div>;
      case "forbidden":
        return <div style={{ padding: "2rem" }}>Only workspace owners and operators can modify theme settings</div>;
      default:
        return null;
    }
  };

  return <div style={{ fontFamily: "sans-serif" }}>{renderContent()}</div>;
}

const meta: Meta<ThemeSettingPageProps> = {
  title: "Routes/Settings - Theme",
  component: ThemeSettingPage,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const OwnerAccess: Story = {
  args: { state: "success", role: "owner" },
  parameters: { role: "owner" },
};

export const OperatorAccess: Story = {
  args: { state: "success", role: "operator" },
  parameters: { role: "operator" },
};

export const Loading: Story = {
  args: { state: "loading", role: "owner" },
  parameters: { role: "owner" },
};

export const Empty: Story = {
  args: { state: "empty", role: "owner" },
  parameters: { role: "owner" },
};

export const Error: Story = {
  args: { state: "error", role: "owner" },
  parameters: { role: "owner" },
};

export const Unauthorized: Story = {
  args: { state: "unauthorized" },
};

export const ViewerForbidden: Story = {
  args: { state: "forbidden" },
};

// =============================================================================
// Design/TokenDiagnostic stories (T-2, T-3)
// =============================================================================
// These stories are the canonical visual diagnostic for the DESIGN.md v1.1.0
// token contract. They demonstrate the [data-theme] attribute cascade across
// dark and light surfaces and provide a one-canvas primitive sampler.
// =============================================================================

const diagnosticMeta = {
  title: 'Design/TokenDiagnostic',
  parameters: { layout: "fullscreen" },
} satisfies Meta;

const COLOR_TOKENS = [
  "--color-surface",
  "--color-surface-raised",
  "--color-surface-overlay",
  "--color-on-surface",
  "--color-on-surface-muted",
  "--color-on-surface-subtle",
  "--color-primary",
  "--color-primary-text",
  "--color-primary-subtle",
  "--color-success",
  "--color-warning",
  "--color-error",
  "--color-info",
  "--color-border",
  "--color-border-strong",
];

const SPACE_TOKENS = [
  "--space-none",
  "--space-xxs",
  "--space-xs",
  "--space-sm",
  "--space-md",
  "--space-lg",
  "--space-xl",
  "--space-xxl",
];

function ColorPanel({ theme }: { theme: "dark" | "light" }) {
  return (
    <div
      data-theme={theme}
      style={{ padding: "var(--space-md)", background: "var(--color-surface)" }}
    >
      <h3
        style={{
          color: "var(--color-on-surface)",
          fontFamily: "var(--font-mono)",
          margin: "0 0 var(--space-sm) 0",
        }}
      >
        data-theme=&quot;{theme}&quot;
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-xs)",
        }}
      >
        {COLOR_TOKENS.map((token) => (
          <div
            key={token}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              color: "var(--color-on-surface)",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                background: `var(${token})`,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                display: "inline-block",
              }}
              aria-hidden="true"
            />
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-body-sm)",
              }}
            >
              {token}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Color tokens visualized across both [data-theme="dark"] and [data-theme="light"] cascades.
 *
 * Forced-colors mode (Windows High Contrast) renders surface as Canvas, on-surface as CanvasText,
 * primary as LinkText — verified at runtime via @media (forced-colors: active) cascade in
 * app/tokens.css. Per UI-SPEC T-3.
 */
export const ColorTokens: StoryObj<typeof diagnosticMeta> = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--space-md)",
      }}
    >
      <ColorPanel theme="dark" />
      <ColorPanel theme="light" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Color tokens visualized across both [data-theme="dark"] and [data-theme="light"] cascades. Forced-colors mode (Windows High Contrast) renders surface as Canvas, on-surface as CanvasText, primary as LinkText — verified at runtime via @media (forced-colors: active) cascade in app/tokens.css. Per UI-SPEC T-3.',
      },
    },
  },
};

/**
 * 8px grid visualization showing all --space-* token steps.
 *
 * Every value snaps to 0 / 2 / 8 / 16 / 24 / 32 / 48 / 96 px.
 * Off-grid values are bugs per DESIGN.md "Spacing Scale".
 */
export const SpacingTokens: StoryObj<typeof diagnosticMeta> = {
  render: () => (
    <div
      data-theme="dark"
      style={{ padding: "var(--space-lg)", background: "var(--color-surface)" }}
    >
      <h3
        style={{
          color: "var(--color-on-surface)",
          fontFamily: "var(--font-mono)",
          margin: "0 0 var(--space-sm) 0",
        }}
      >
        8px grid (--space-* tokens)
      </h3>
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        {SPACE_TOKENS.map((token) => (
          <div
            key={token}
            style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}
          >
            <code
              style={{
                width: 140,
                fontFamily: "var(--font-mono)",
                color: "var(--color-on-surface-muted)",
                flexShrink: 0,
              }}
            >
              {token}
            </code>
            <div
              style={{
                width: `var(${token})`,
                height: 24,
                background: "var(--color-primary)",
                minWidth: 1,
                border: "1px solid var(--color-border)",
              }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "8px grid visualization. Every value snaps to 0 / 2 / 8 / 16 / 24 / 32 / 48 / 96 px. Off-grid values are bugs (DESIGN.md \"Spacing Scale\").",
      },
    },
  },
};

/**
 * One of each .c-* primitive on a single canvas.
 *
 * The canonical contributor visual diagnostic for styles/components.css.
 * Demonstrates token-system contract via DESIGN.md v1.1.0 primitives.
 */
export const PrimitiveSampler: StoryObj<typeof diagnosticMeta> = {
  render: () => (
    <div
      data-theme="dark"
      style={{
        padding: "var(--space-lg)",
        background: "var(--color-surface)",
        display: "grid",
        gap: "var(--space-md)",
      }}
    >
      <h3
        style={{
          color: "var(--color-on-surface)",
          fontFamily: "var(--font-mono)",
          margin: 0,
        }}
      >
        Primitive sampler — styles/components.css
      </h3>

      <div className="c-card">
        <h4 style={{ margin: "0 0 var(--space-xs) 0" }}>.c-card section</h4>
        <p style={{ margin: 0 }}>Default surface-raised card with 1px hairline border.</p>
      </div>

      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
        <button type="button" className="c-button c-button--primary">Primary</button>
        <button type="button" className="c-button c-button--secondary">Secondary</button>
        <button type="button" className="c-button c-button--tertiary">Tertiary</button>
        <button type="button" className="c-button c-button--destructive">Destructive</button>
        <button type="button" className="c-button c-button--icon" aria-label="Icon action">+</button>
      </div>

      <div className="c-notice c-notice--success">
        <strong>[ok]</strong>{" "}Success notice — operation completed.
      </div>
      <div className="c-notice c-notice--warning">
        <strong>[warn]</strong>{" "}Warning notice — action may have side-effects.
      </div>
      <div className="c-notice c-notice--error">
        <strong>[err]</strong>{" "}Error notice — operation failed.
      </div>
      <div className="c-notice c-notice--info">
        <strong>[info]</strong>{" "}Info notice — contextual information.
      </div>

      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
        <span className="c-badge c-badge--success">[ok] Success</span>
        <span className="c-badge c-badge--warning">[warn] Warning</span>
        <span className="c-badge c-badge--error">[err] Error</span>
        <span className="c-badge c-badge--info">[info] Info</span>
      </div>

      <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
        <span>
          <span className="c-status-dot c-status-dot--live" aria-hidden="true" />{" "}live
        </span>
        <span>
          <span className="c-status-dot" aria-hidden="true" />{" "}default
        </span>
        <span>
          <span className="c-status-dot c-status-dot--error" aria-hidden="true" />{" "}error
        </span>
      </div>

      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
        <span className="c-chip">.c-chip default</span>
        <span className="c-chip c-chip--warning">[warn] chip</span>
        <span className="c-chip c-chip--error">[err] chip</span>
        <span className="c-chip-protocol">[task_xxx]</span>
      </div>

      <div className="c-field">
        <label className="c-field__label" htmlFor="sampler-input">.c-field label</label>
        <input
          id="sampler-input"
          type="text"
          className="c-input"
          placeholder="placeholder text"
        />
        <span className="c-field__help">.c-field__help text</span>
      </div>

      <code className="c-code-inline">c-code-inline</code>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "One of each .c-* primitive on a single canvas. The canonical contributor visual diagnostic for styles/components.css.",
      },
    },
  },
};
