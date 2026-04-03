import { tokenMap, baseSemanticTokens } from "./tokens";

export type BrandPack = {
  tenantId: string;
  label: string;
  logoUrl?: string;
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

// ---------------------------------------------------------------------------
// Plugin brand context (Phase 52 — Plan 03)
// ---------------------------------------------------------------------------

export type PluginBrandContext = {
  tenantId: string;
  pluginNamespace: string;
  label: string;
  logoUrl: string | null;
  primaryColor: string;
  primaryTextColor: string;
};

const DEFAULT_PRIMARY = '#0d9488';
const DEFAULT_PRIMARY_TEXT = '#ffffff';
const PLUGIN_NAMESPACE = 'digital-agency-plugin';

/**
 * Derive brand context for plugin surfaces from a tenant's BrandPack.
 * Does not expose raw overrides — only resolved token values.
 */
export function getPluginBrandContext(tenantId: string, brandPack: BrandPack): PluginBrandContext {
  const { overrides = {}, logoUrl = null, label = 'MarkOS' } = brandPack;
  return {
    tenantId,
    pluginNamespace: PLUGIN_NAMESPACE,
    label,
    logoUrl: logoUrl ?? null,
    primaryColor: overrides['color.action.primary'] ?? DEFAULT_PRIMARY,
    primaryTextColor: overrides['color.action.primaryText'] ?? DEFAULT_PRIMARY_TEXT,
  };
}
