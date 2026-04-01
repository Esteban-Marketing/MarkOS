export type SemanticToken = {
  name: string;
  value: string;
  description: string;
};

export const baseSemanticTokens: SemanticToken[] = [
  { name: "color.bg.canvas", value: "#f5f7fa", description: "Primary app canvas" },
  { name: "color.bg.panel", value: "#ffffff", description: "Panel background" },
  { name: "color.text.primary", value: "#0f172a", description: "Primary text" },
  { name: "color.text.muted", value: "#475569", description: "Secondary text" },
  { name: "color.action.primary", value: "#0d9488", description: "Primary action background" },
  { name: "color.action.primaryText", value: "#ffffff", description: "Primary action text" },
  { name: "radius.md", value: "10px", description: "Standard card radius" },
  { name: "space.md", value: "16px", description: "Standard spacing unit" },
  { name: "font.body", value: "'Space Grotesk', sans-serif", description: "Body font" },
  { name: "font.display", value: "'Sora', sans-serif", description: "Display font" },
];

export function tokenMap(tokens = baseSemanticTokens): Record<string, string> {
  return tokens.reduce<Record<string, string>>((acc, token) => {
    acc[token.name] = token.value;
    return acc;
  }, {});
}
