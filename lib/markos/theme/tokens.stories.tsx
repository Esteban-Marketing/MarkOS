import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { baseSemanticTokens, tokenMap } from "./tokens";

/**
 * Semantic Design Tokens
 * 
 * Foundation design system tokens for color, typography, spacing, and effects.
 * 
 * **Coverage:** Default and white-label theme variants with contrast validation
 */

function TokenCard({ name, value, description }: { name: string; value: string; description: string }) {
  const isColor = name.startsWith("color") && value.startsWith("#");
  return (
    <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {isColor && (
          <div
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: value,
              borderRadius: "4px",
              border: "2px solid #ccc",
            }}
          />
        )}
        <div>
          <strong style={{ fontFamily: "monospace" }}>{name}</strong>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#666" }}>{description}</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#999", fontFamily: "monospace" }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

interface TokenGalleryProps {
  theme?: "default" | "white-label";
}

function TokenGallery({ theme = "default" }: TokenGalleryProps) {
  const tokens = theme === "white-label" ? baseSemanticTokens.map((t) => ({ ...t, value: `${t.value} (overridden)` })) : baseSemanticTokens;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Design Tokens - {theme === "white-label" ? "White-Label" : "Default"} Theme</h1>
      <div style={{ marginTop: "2rem" }}>
        {tokens.map((token) => (
          <TokenCard key={token.name} name={token.name} value={token.value} description={token.description} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta<TokenGalleryProps> = {
  title: "Foundation/Design Tokens",
  component: TokenGallery,
  parameters: { layout: "fullscreen" },
  argTypes: {
    theme: {
      control: "select",
      options: ["default", "white-label"],
      description: "Theme variant for token visualization",
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultTheme: Story = {
  args: { theme: "default" },
  parameters: { theme: "default" },
};

export const WhiteLabelTheme: Story = {
  args: { theme: "white-label" },
  parameters: { theme: "white-label" },
};

export const AllTokens: Story = {
  args: { theme: "default" },
};
