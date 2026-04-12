'use strict';

const {
  REQUIRED_TOKEN_CATEGORIES,
  validateTokenContract,
} = require('./token-contract-schema.cjs');
const {
  REASON_CODES,
  isObject,
  buildFingerprint,
  createDiagnostic,
  normalizeDiagnostics,
  stableSort,
} = require('./diagnostics.cjs');

const TOKEN_COMPILER_RULESET_VERSION = '76.02.0';

const CATEGORY_ORDER = Object.freeze([
  'color',
  'typography',
  'spacing',
  'radius',
  'shadow',
  'motion',
]);

function normalizeString(value, fallback) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function normalizeDecisionIds(decisions) {
  return (Array.isArray(decisions) ? decisions : [])
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const decisionId = normalizeString(entry.decision_id, 'unknown-decision');
      const sourceNodeIds = (Array.isArray(entry.source_node_ids) ? entry.source_node_ids : [])
        .map((item) => normalizeString(item, ''))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      return {
        decision_id: decisionId,
        source_node_ids: sourceNodeIds,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.decision_id.localeCompare(b.decision_id));
}

function ensureIdentitySections(identityArtifact, diagnostics) {
  const required = [
    'semantic_color_roles',
    'typography_hierarchy',
    'spacing_intent',
    'visual_constraints',
  ];

  required.forEach((section) => {
    if (!isObject(identityArtifact[section])) {
      diagnostics.push(createDiagnostic(
        REASON_CODES.TOKEN_INPUT_INVALID,
        `identity.artifact.${section}`,
        `Missing required identity section: ${section}`,
        `Ensure identity compiler emits identity.artifact.${section} as a non-empty object.`
      ));
    }
  });
}

function buildColorTokens(identityArtifact) {
  const roles = identityArtifact.semantic_color_roles || {};
  const primaryRole = roles.primary || {};
  const accentRole = roles.accent || {};
  const surfaceRole = roles.surface || {};
  const textRole = roles.text || {};

  return {
    'color.brand.primary': normalizeString(primaryRole.base || primaryRole.value, '#0a6cff'),
    'color.brand.accent': normalizeString(accentRole.base || accentRole.value, '#3155c6'),
    'color.surface.default': normalizeString(surfaceRole.default || surfaceRole.value, '#ffffff'),
    'color.surface.border': normalizeString(surfaceRole.border || '#d7deef', '#d7deef'),
    'color.text.primary': normalizeString(textRole.primary || textRole.value, '#101828'),
    'color.text.inverse': normalizeString(textRole.inverse || '#ffffff', '#ffffff'),
  };
}

function buildTypographyTokens(identityArtifact) {
  const hierarchy = identityArtifact.typography_hierarchy || {};
  const heading = hierarchy.heading || {};
  const body = hierarchy.body || {};

  return {
    'type.heading': {
      family: normalizeString(heading.family, 'IBM Plex Sans'),
      size: normalizeString(heading.size, '1.5rem'),
      weight: normalizeString(heading.weight, '600'),
      line_height: normalizeString(heading.line_height, '1.25'),
    },
    'type.body': {
      family: normalizeString(body.family, 'IBM Plex Sans'),
      size: normalizeString(body.size, '1rem'),
      weight: normalizeString(body.weight, '400'),
      line_height: normalizeString(body.line_height, '1.5'),
    },
  };
}

function buildSpacingTokens(identityArtifact) {
  const spacingIntent = identityArtifact.spacing_intent || {};
  return {
    'space.2': normalizeString(spacingIntent.compact || spacingIntent.tight, '0.5rem'),
    'space.4': normalizeString(spacingIntent.default || spacingIntent.base, '1rem'),
    'space.6': normalizeString(spacingIntent.relaxed || spacingIntent.loose, '1.5rem'),
  };
}

function buildRadiusTokens(identityArtifact) {
  const constraints = identityArtifact.visual_constraints || {};
  return {
    'radius.sm': normalizeString(constraints.radius_sm, '0.375rem'),
    'radius.md': normalizeString(constraints.radius_md, '0.5rem'),
    'radius.lg': normalizeString(constraints.radius_lg, '0.75rem'),
  };
}

function buildShadowTokens(identityArtifact) {
  const constraints = identityArtifact.visual_constraints || {};
  return {
    'shadow.sm': normalizeString(constraints.shadow_sm, '0 1px 2px rgba(16,24,40,0.08)'),
    'shadow.md': normalizeString(constraints.shadow_md, '0 8px 24px rgba(16,24,40,0.18)'),
    'shadow.lg': normalizeString(constraints.shadow_lg, '0 16px 40px rgba(16,24,40,0.22)'),
  };
}

function buildMotionTokens(strategyArtifact) {
  const profile = strategyArtifact && strategyArtifact.voice_profile ? strategyArtifact.voice_profile : {};
  const energy = normalizeString(profile.energy, 'balanced');

  if (energy === 'high') {
    return {
      'duration.fast': '90ms',
      'duration.base': '140ms',
      'easing.standard': 'cubic-bezier(0.2, 0, 0, 1)',
    };
  }

  return {
    'duration.fast': '120ms',
    'duration.base': '180ms',
    'easing.standard': 'cubic-bezier(0.2, 0, 0, 1)',
  };
}

function toCssVariable(tokenKey) {
  return `--${tokenKey.replace(/\./g, '-')}`;
}

function buildTailwindV4Mapping(categories) {
  const cssVariables = {
    [toCssVariable('color.brand.primary')]: categories.color['color.brand.primary'],
    [toCssVariable('color.brand.accent')]: categories.color['color.brand.accent'],
    [toCssVariable('color.surface.default')]: categories.color['color.surface.default'],
    [toCssVariable('color.surface.border')]: categories.color['color.surface.border'],
    [toCssVariable('color.text.primary')]: categories.color['color.text.primary'],
    [toCssVariable('color.text.inverse')]: categories.color['color.text.inverse'],
    [toCssVariable('space.2')]: categories.spacing['space.2'],
    [toCssVariable('space.4')]: categories.spacing['space.4'],
    [toCssVariable('space.6')]: categories.spacing['space.6'],
    [toCssVariable('radius.md')]: categories.radius['radius.md'],
  };

  const themeExtensions = {
    colors: {
      brand: {
        primary: 'var(--color-brand-primary)',
        accent: 'var(--color-brand-accent)',
      },
      surface: {
        DEFAULT: 'var(--color-surface-default)',
        border: 'var(--color-surface-border)',
      },
      text: {
        primary: 'var(--color-text-primary)',
        inverse: 'var(--color-text-inverse)',
      },
    },
    spacing: {
      2: 'var(--space-2)',
      4: 'var(--space-4)',
      6: 'var(--space-6)',
    },
    borderRadius: {
      md: 'var(--radius-md)',
    },
  };

  return {
    css_variables: cssVariables,
    theme_extensions: themeExtensions,
  };
}

function buildLineage(strategyFingerprint, identityFingerprint, rulesetVersion, strategyArtifact, identityArtifact) {
  const strategyDecisions = normalizeDecisionIds((strategyArtifact && strategyArtifact.lineage && strategyArtifact.lineage.decisions) || []);
  const identityDecisions = normalizeDecisionIds((identityArtifact && identityArtifact.lineage && identityArtifact.lineage.decisions) || []);

  const merged = strategyDecisions.concat(identityDecisions)
    .sort((a, b) => a.decision_id.localeCompare(b.decision_id));

  return {
    ruleset_version: rulesetVersion,
    strategy_fingerprint: strategyFingerprint,
    identity_fingerprint: identityFingerprint,
    decisions: merged,
  };
}

function compileTokenContract(strategyResult, identityResult, opts = {}) {
  const diagnostics = [];

  if (!isObject(strategyResult) || !isObject(strategyResult.artifact)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.TOKEN_INPUT_INVALID,
      'strategy',
      'strategy result must include an artifact object',
      'Pass compileTokenContract a strategy compiler result with artifact and metadata.'
    ));
  }

  if (!isObject(identityResult) || !isObject(identityResult.artifact)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.TOKEN_INPUT_INVALID,
      'identity',
      'identity result must include an artifact object',
      'Pass compileTokenContract an identity compiler result with artifact and metadata.'
    ));
  }

  if (diagnostics.length > 0) {
    return {
      token_contract: null,
      metadata: {
        ruleset_version: normalizeString(opts.ruleset_version, TOKEN_COMPILER_RULESET_VERSION),
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  const identityArtifact = identityResult.artifact;
  ensureIdentitySections(identityArtifact, diagnostics);

  const strategyFingerprint = normalizeString(
    strategyResult.metadata && strategyResult.metadata.deterministic_fingerprint,
    'unknown'
  );
  const identityFingerprint = normalizeString(
    identityResult.metadata && identityResult.metadata.deterministic_fingerprint,
    'unknown'
  );
  const rulesetVersion = normalizeString(opts.ruleset_version, TOKEN_COMPILER_RULESET_VERSION);

  const categories = {
    color: buildColorTokens(identityArtifact),
    typography: buildTypographyTokens(identityArtifact),
    spacing: buildSpacingTokens(identityArtifact),
    radius: buildRadiusTokens(identityArtifact),
    shadow: buildShadowTokens(identityArtifact),
    motion: buildMotionTokens(strategyResult.artifact),
  };

  REQUIRED_TOKEN_CATEGORIES.forEach((name) => {
    if (!isObject(categories[name]) || Object.keys(categories[name]).length === 0) {
      diagnostics.push(createDiagnostic(
        REASON_CODES.TOKEN_CATEGORY_MISSING,
        `categories.${name}`,
        `Missing token category: ${name}`,
        `Ensure compiler input can derive at least one token for ${name}.`
      ));
    }
  });

  const orderedCategories = {};
  CATEGORY_ORDER.forEach((name) => {
    orderedCategories[name] = categories[name];
  });

  const lineage = buildLineage(
    strategyFingerprint,
    identityFingerprint,
    rulesetVersion,
    strategyResult.artifact,
    identityArtifact
  );

  if (!Array.isArray(lineage.decisions) || lineage.decisions.length === 0) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.LINEAGE_POINTER_MISSING,
      'lineage.decisions',
      'No lineage decisions were available from strategy or identity artifacts',
      'Provide source decisions in strategy.artifact.lineage.decisions or identity.artifact.lineage.decisions.'
    ));
  }

  const tokenContract = {
    categories: orderedCategories,
    tailwind_v4: buildTailwindV4Mapping(orderedCategories),
    lineage,
  };

  const schemaValidation = validateTokenContract(tokenContract);
  if (!schemaValidation.valid) {
    diagnostics.push(...schemaValidation.diagnostics);
  }

  const normalizedDiagnostics = normalizeDiagnostics(diagnostics);
  if (normalizedDiagnostics.length > 0) {
    return {
      token_contract: null,
      metadata: {
        ruleset_version: rulesetVersion,
        strategy_fingerprint: strategyFingerprint,
        identity_fingerprint: identityFingerprint,
        deterministic_fingerprint: null,
      },
      diagnostics: normalizedDiagnostics,
    };
  }

  const canonical = stableSort(tokenContract);
  const deterministicFingerprint = buildFingerprint({
    ruleset_version: rulesetVersion,
    token_contract: canonical,
  });

  return {
    token_contract: canonical,
    metadata: {
      ruleset_version: rulesetVersion,
      strategy_fingerprint: strategyFingerprint,
      identity_fingerprint: identityFingerprint,
      deterministic_fingerprint: deterministicFingerprint,
    },
    diagnostics: [],
  };
}

module.exports = {
  TOKEN_COMPILER_RULESET_VERSION,
  compileTokenContract,
};
