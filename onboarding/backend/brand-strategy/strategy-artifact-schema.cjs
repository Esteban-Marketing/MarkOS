'use strict';

const REQUIRED_SECTIONS = Object.freeze([
  'positioning',
  'value_promise',
  'differentiators',
  'messaging_pillars',
  'disallowed_claims',
  'confidence_notes',
]);

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim().length > 0);
}

function validateClaim(claim, path, errors) {
  if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (!isNonEmptyStringArray(claim.evidence_node_ids)) {
    errors.push(`${path}.evidence_node_ids must be a non-empty string array`);
  }
}

function validateClaimCollection(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((claim, index) => validateClaim(claim, `${path}[${index}]`, errors));
    return;
  }

  if (value && typeof value === 'object' && Array.isArray(value.claims)) {
    value.claims.forEach((claim, index) => validateClaim(claim, `${path}.claims[${index}]`, errors));
    return;
  }

  validateClaim(value, path, errors);
}

function validateMessagingPillars(pillars, errors) {
  if (!Array.isArray(pillars) || pillars.length === 0) {
    errors.push('messaging_pillars must be a non-empty array');
    return;
  }

  pillars.forEach((pillar, pillarIndex) => {
    if (!pillar || typeof pillar !== 'object' || Array.isArray(pillar)) {
      errors.push(`messaging_pillars[${pillarIndex}] must be an object`);
      return;
    }

    if (typeof pillar.pillar !== 'string' || pillar.pillar.trim().length === 0) {
      errors.push(`messaging_pillars[${pillarIndex}].pillar is required`);
    }

    if (!Array.isArray(pillar.claims) || pillar.claims.length === 0) {
      errors.push(`messaging_pillars[${pillarIndex}].claims must be a non-empty array`);
      return;
    }

    pillar.claims.forEach((claim, claimIndex) => {
      validateClaim(claim, `messaging_pillars[${pillarIndex}].claims[${claimIndex}]`, errors);
    });
  });
}

function validateStrategyArtifact(artifact) {
  const errors = [];

  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return {
      valid: false,
      errors: ['strategy_artifact must be an object'],
    };
  }

  REQUIRED_SECTIONS.forEach((section) => {
    if (!(section in artifact)) {
      errors.push(`Missing required section: ${section}`);
    }
  });

  if ('positioning' in artifact) {
    validateClaimCollection(artifact.positioning, 'positioning', errors);
  }

  if ('value_promise' in artifact) {
    validateClaimCollection(artifact.value_promise, 'value_promise', errors);
  }

  if ('differentiators' in artifact) {
    if (!Array.isArray(artifact.differentiators) || artifact.differentiators.length === 0) {
      errors.push('differentiators must be a non-empty array');
    } else {
      validateClaimCollection(artifact.differentiators, 'differentiators', errors);
    }
  }

  if ('messaging_pillars' in artifact) {
    validateMessagingPillars(artifact.messaging_pillars, errors);
  }

  if ('disallowed_claims' in artifact) {
    if (!Array.isArray(artifact.disallowed_claims) || artifact.disallowed_claims.length === 0) {
      errors.push('disallowed_claims must be a non-empty array');
    } else {
      validateClaimCollection(artifact.disallowed_claims, 'disallowed_claims', errors);
    }
  }

  if ('confidence_notes' in artifact) {
    if (!Array.isArray(artifact.confidence_notes) || artifact.confidence_notes.length === 0) {
      errors.push('confidence_notes must be a non-empty array');
    } else {
      validateClaimCollection(artifact.confidence_notes, 'confidence_notes', errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  REQUIRED_SECTIONS,
  validateStrategyArtifact,
};
