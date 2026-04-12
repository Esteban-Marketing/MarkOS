'use strict';

const REQUIRED_CHECKS = Object.freeze([
  Object.freeze({
    id: 'contrast.text.primary_on_surface.default',
    foreground_role: 'text.primary',
    background_role: 'surface.default',
    required_ratio: 4.5,
    blocking: true,
  }),
  Object.freeze({
    id: 'contrast.text.inverse_on_brand.primary',
    foreground_role: 'text.inverse',
    background_role: 'brand.primary',
    required_ratio: 4.5,
    blocking: true,
  }),
  Object.freeze({
    id: 'contrast.brand.secondary_on_surface.default',
    foreground_role: 'brand.secondary',
    background_role: 'surface.default',
    required_ratio: 3.0,
    blocking: true,
  }),
  Object.freeze({
    id: 'readability.type.body.line_height_minimum',
    typography_role: 'type.body',
    required_ratio: 1.4,
    blocking: true,
  }),
]);

function toChannel(channel) {
  const normalized = channel.length === 1 ? `${channel}${channel}` : channel;
  return Number.parseInt(normalized, 16) / 255;
}

function hexToRgb(hex) {
  const normalized = String(hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: toChannel(normalized.slice(0, 2)),
    g: toChannel(normalized.slice(2, 4)),
    b: toChannel(normalized.slice(4, 6)),
  };
}

function toLinear(value) {
  if (value <= 0.03928) {
    return value / 12.92;
  }
  return ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function roundMetric(value) {
  return Number(value.toFixed(3));
}

function evaluateAccessibilityGates(compiledIdentity) {
  if (!compiledIdentity || typeof compiledIdentity !== 'object' || !compiledIdentity.artifact) {
    throw new Error('evaluateAccessibilityGates: compiled identity artifact is required');
  }

  const artifact = compiledIdentity.artifact;
  const semanticRoles = artifact.semantic_color_roles || {};
  const typography = artifact.typography_hierarchy || {};

  const checks = REQUIRED_CHECKS.map((definition) => {
    if (definition.foreground_role && definition.background_role) {
      const foreground = semanticRoles[definition.foreground_role];
      const background = semanticRoles[definition.background_role];
      const observedRatio = roundMetric(contrastRatio(foreground, background));
      const status = observedRatio >= definition.required_ratio ? 'pass' : 'fail';
      return {
        id: definition.id,
        required_ratio: definition.required_ratio,
        observed_ratio: observedRatio,
        status,
        blocking: definition.blocking,
        reason_code: status === 'fail' ? 'ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD' : null,
      };
    }

    const role = typography[definition.typography_role] || {};
    const observedLineHeight = Number(role.line_height || 0);
    const observedRatio = roundMetric(observedLineHeight);
    const status = observedRatio >= definition.required_ratio ? 'pass' : 'fail';
    return {
      id: definition.id,
      required_ratio: definition.required_ratio,
      observed_ratio: observedRatio,
      status,
      blocking: definition.blocking,
      reason_code: status === 'fail' ? 'ACCESSIBILITY_READABILITY_BELOW_THRESHOLD' : null,
    };
  });

  const diagnostics = checks
    .filter((entry) => entry.status === 'fail')
    .map((entry) => ({
      check_id: entry.id,
      required_ratio: entry.required_ratio,
      observed_ratio: entry.observed_ratio,
      blocking: entry.blocking,
      message: `Check ${entry.id} failed: observed ${entry.observed_ratio} below required ${entry.required_ratio}`,
      reason_code: entry.reason_code,
    }));

  const hasBlockingFailure = checks.some((entry) => entry.status === 'fail' && entry.blocking);

  return {
    gate_status: hasBlockingFailure ? 'blocked' : 'pass',
    checks,
    diagnostics,
  };
}

module.exports = {
  REQUIRED_CHECKS,
  evaluateAccessibilityGates,
};
