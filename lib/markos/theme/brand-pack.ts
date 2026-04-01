import { tokenMap, baseSemanticTokens } from "./tokens";

export type BrandPack = {
  tenantId: string;
  label: string;
  overrides: Record<string, string>;
};

export const defaultBrandPack: BrandPack = {
  tenantId: "default",
  label: "MarkOS Default",
  overrides: {
    "color.action.primary": "#0d9488",
    "color.action.primaryText": "#ffffff",
  },
};

export function validateBrandPack(brandPack: BrandPack): { valid: boolean; errors: string[] } {
  const knownTokens = tokenMap(baseSemanticTokens);
  const errors: string[] = [];

  for (const [tokenName, tokenValue] of Object.entries(brandPack.overrides)) {
    if (!knownTokens[tokenName]) {
      errors.push(`Unknown token override: ${tokenName}`);
      continue;
    }

    if (tokenName.startsWith("color") && !/^#[0-9a-fA-F]{6}$/.test(tokenValue)) {
      errors.push(`Invalid color format for ${tokenName}. Expected #RRGGBB.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function mergeBrandPack(brandPack: BrandPack): Record<string, string> {
  const base = tokenMap(baseSemanticTokens);
  return { ...base, ...brandPack.overrides };
}
