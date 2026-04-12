'use strict';

const REQUIRED_SECTIONS = Object.freeze([
  'semantic_color_roles',
  'typography_hierarchy',
  'spacing_intent',
  'visual_constraints',
  'lineage',
]);

const REQUIRED_SEMANTIC_COLOR_ROLES = Object.freeze([
  'brand.primary',
  'brand.secondary',
  'surface.default',
  'text.primary',
  'text.inverse',
  'state.accent',
]);

const REQUIRED_TYPOGRAPHY_ROLES = Object.freeze([
  'type.display',
  'type.heading',
  'type.body',
  'type.caption',
]);

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function validateTypographyEntry(entry, path, errors) {
  if (!isObject(entry)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (!isNonEmptyString(entry.family)) {
    errors.push(`${path}.family must be a non-empty string`);
  }

  if (!isNonEmptyString(entry.step)) {
    errors.push(`${path}.step must be a non-empty string`);
  }

  if (typeof entry.weight !== 'number' || Number.isNaN(entry.weight)) {
    errors.push(`${path}.weight must be a number`);
  }

  if (typeof entry.line_height !== 'number' || Number.isNaN(entry.line_height)) {
    errors.push(`${path}.line_height must be a number`);
  }
}

function validateIdentityArtifact(artifact) {
  const errors = [];

  if (!isObject(artifact)) {
    return {
      valid: false,
      errors: ['identity_artifact must be an object'],
    };
  }

  REQUIRED_SECTIONS.forEach((section) => {
    if (!(section in artifact)) {
      errors.push(`Missing required section: ${section}`);
    }
  });

  if (isObject(artifact.semantic_color_roles)) {
    REQUIRED_SEMANTIC_COLOR_ROLES.forEach((role) => {
      if (!isNonEmptyString(artifact.semantic_color_roles[role])) {
        errors.push(`semantic_color_roles.${role} must be a non-empty string`);
      }
    });
  } else if ('semantic_color_roles' in artifact) {
    errors.push('semantic_color_roles must be an object');
  }

  if (isObject(artifact.typography_hierarchy)) {
    REQUIRED_TYPOGRAPHY_ROLES.forEach((role) => {
      validateTypographyEntry(artifact.typography_hierarchy[role], `typography_hierarchy.${role}`, errors);
    });
  } else if ('typography_hierarchy' in artifact) {
    errors.push('typography_hierarchy must be an object');
  }

  if (isObject(artifact.spacing_intent)) {
    if (!Array.isArray(artifact.spacing_intent.scale) || artifact.spacing_intent.scale.length === 0) {
      errors.push('spacing_intent.scale must be a non-empty array');
    }
    if (!isNonEmptyString(artifact.spacing_intent.rhythm)) {
      errors.push('spacing_intent.rhythm must be a non-empty string');
    }
  } else if ('spacing_intent' in artifact) {
    errors.push('spacing_intent must be an object');
  }

  if (isObject(artifact.visual_constraints)) {
    if (typeof artifact.visual_constraints.max_palette_size !== 'number' || Number.isNaN(artifact.visual_constraints.max_palette_size)) {
      errors.push('visual_constraints.max_palette_size must be a number');
    }
    if (!isNonEmptyString(artifact.visual_constraints.corner_radius_policy)) {
      errors.push('visual_constraints.corner_radius_policy must be a non-empty string');
    }
  } else if ('visual_constraints' in artifact) {
    errors.push('visual_constraints must be an object');
  }

  if (isObject(artifact.lineage)) {
    if (!isNonEmptyString(artifact.lineage.ruleset_version)) {
      errors.push('lineage.ruleset_version must be a non-empty string');
    }
    if (!isNonEmptyString(artifact.lineage.strategy_fingerprint)) {
      errors.push('lineage.strategy_fingerprint must be a non-empty string');
    }
    if (!Array.isArray(artifact.lineage.decisions) || artifact.lineage.decisions.length === 0) {
      errors.push('lineage.decisions must be a non-empty array');
    } else {
      artifact.lineage.decisions.forEach((decision, index) => {
        if (!isObject(decision)) {
          errors.push(`lineage.decisions[${index}] must be an object`);
          return;
        }
        if (!isNonEmptyString(decision.decision_id)) {
          errors.push(`lineage.decisions[${index}].decision_id must be a non-empty string`);
        }
        if (!isNonEmptyStringArray(decision.strategy_node_ids)) {
          errors.push(`lineage.decisions[${index}].strategy_node_ids must be a non-empty string array`);
        }
      });
    }
  } else if ('lineage' in artifact) {
    errors.push('lineage must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  REQUIRED_SECTIONS,
  REQUIRED_SEMANTIC_COLOR_ROLES,
  REQUIRED_TYPOGRAPHY_ROLES,
  validateIdentityArtifact,
};
