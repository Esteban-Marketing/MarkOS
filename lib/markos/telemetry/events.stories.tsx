import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * UI Telemetry Events
 * 
 * Event examples for UI instrumentation and redaction-safe payload validation.
 * 
 * **Coverage:** Event type examples, payload structure, redaction scenarios
 */

interface TelemetryPayloadProps {
  eventName: string;
  payload: Record<string, unknown>;
  redactionStatus: "safe" | "warning" | "critical";
}

function TelemetryPayloadViewer({ eventName, payload, redactionStatus }: TelemetryPayloadProps) {
  const getStatusColor = () => {
    switch (redactionStatus) {
      case "safe":
        return "#d1fae5";
      case "warning":
        return "#fef3c7";
      case "critical":
        return "#fee2e2";
      default:
        return "#f0f0f0";
    }
  };

  return (
    <div style={{ marginBottom: "2rem", padding: "1rem", border: `2px solid ${getStatusColor()}`, borderRadius: "4px", backgroundColor: `${getStatusColor()}33` }}>
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: "bold",
          marginBottom: "0.5rem",
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        {eventName}
        <span
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "3px",
            fontSize: "0.75rem",
            backgroundColor: getStatusColor(),
            color: redactionStatus === "critical" ? "#991b1b" : redactionStatus === "warning" ? "#92400e" : "#065f46",
          }}
        >
          {redactionStatus.toUpperCase()}
        </span>
      </div>
      <pre
        style={{
          backgroundColor: "white",
          padding: "0.75rem",
          borderRadius: "3px",
          overflow: "auto",
          fontSize: "0.75rem",
          border: "1px solid #d1d5db",
          margin: 0,
          fontFamily: "monospace",
        }}
      >
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

interface TelemetryPageProps {
  variant?: "safe" | "with-warnings" | "with-violations";
}

function TelemetryPage({ variant = "safe" }: TelemetryPageProps) {
  const safePayloads = [
    {
      eventName: "ui_route_viewed",
      payload: {
        route: "company",
        module: "company-profile",
        role: "owner",
        viewport: "desktop",
        theme: "default",
        timestamp: "2026-04-01T12:00:00Z",
      },
      redactionStatus: "safe" as const,
    },
    {
      eventName: "ui_action_triggered",
      payload: {
        action: "edit",
        route: "company",
        module: "company-form",
        role: "operator",
        viewport: "tablet",
        timestamp: "2026-04-01T12:01:00Z",
      },
      redactionStatus: "safe" as const,
    },
  ];

  const warningPayloads = [
    {
      eventName: "ui_form_submitted",
      payload: {
        form: "company-profile",
        fields_submitted: 5,
        route: "company",
        role: "owner",
        timestamp: "2026-04-01T12:02:00Z",
        // Field count is OK but full form data should not be in telemetry
      },
      redactionStatus: "warning" as const,
    },
  ];

  const violationPayloads = [
    {
      eventName: "ui_error_occurred",
      payload: {
        error_message: "Invalid API token: sk_live_abc123xyz", // VIOLATION: token in event
        route: "campaigns",
        role: "strategist",
        timestamp: "2026-04-01T12:03:00Z",
      },
      redactionStatus: "critical" as const,
    },
  ];

  const payloads =
    variant === "safe"
      ? safePayloads
      : variant === "with-warnings"
        ? [...safePayloads, ...warningPayloads]
        : [...safePayloads, ...warningPayloads, ...violationPayloads];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>UI Telemetry Events</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        {variant === "safe" && "All payloads are properly redacted and safe for transmission"}
        {variant === "with-warnings" && "Some payloads contain marginal redaction issues"}
        {variant === "with-violations" && "Critical redaction violations detected - payload unsafe for transmission"}
      </p>

      <div>
        {payloads.map((item, idx) => (
          <TelemetryPayloadViewer
            key={idx}
            eventName={item.eventName}
            payload={item.payload}
            redactionStatus={item.redactionStatus}
          />
        ))}
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "4px" }}>
        <h3 style={{ marginTop: 0 }}>Redaction Rules</h3>
        <ul style={{ fontSize: "0.875rem", margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
          <li>✓ Route, module, role, viewport, theme are safe dimensions</li>
          <li>✓ Action names (create, edit, delete) are safe</li>
          <li>✗ API keys, tokens, or auth credentials must never appear</li>
          <li>✗ User-submitted form data (names, emails, content) must be redacted</li>
          <li>✗ Full error messages that may contain sensitive context must be truncated</li>
        </ul>
      </div>
    </div>
  );
}

const meta: Meta<TelemetryPageProps> = {
  title: "Foundation/Telemetry Events",
  component: TelemetryPage,
  parameters: { layout: "fullscreen" },
  argTypes: {
    variant: {
      control: "select",
      options: ["safe", "with-warnings", "with-violations"],
      description: "Telemetry payload redaction status variant",
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const SafePayloads: Story = {
  args: { variant: "safe" },
};

export const WithWarnings: Story = {
  args: { variant: "with-warnings" },
};

export const WithViolations: Story = {
  args: { variant: "with-violations" },
};
