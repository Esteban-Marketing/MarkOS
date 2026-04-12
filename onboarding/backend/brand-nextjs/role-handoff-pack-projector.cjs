'use strict';

const { validateStarterDescriptor } = require('./starter-descriptor-schema.cjs');
const { validateRoleHandoffPack } = require('./role-handoff-pack-schema.cjs');
const {
  REASON_CODES,
  isObject,
  stableSort,
  buildFingerprint,
  createDiagnostic,
  normalizeDiagnostics,
  normalizeString,
} = require('./handoff-diagnostics.cjs');

const ROLE_PACK_PROJECTOR_RULESET_VERSION = '77.02.0';

const REQUIRED_ROLES = Object.freeze([
  'strategist',
  'designer',
  'founder_operator',
  'frontend_engineer',
  'content_marketing',
]);

function buildLineagePointer(descriptorFingerprint, sourceArtifacts) {
  return {
    descriptor_fingerprint: descriptorFingerprint,
    source_artifacts: sourceArtifacts.slice().sort((a, b) => a.localeCompare(b)),
  };
}

function buildRoleTemplates(descriptor, descriptorFingerprint) {
  const primitives = Array.isArray(descriptor.component_bindings.required_primitives)
    ? descriptor.component_bindings.required_primitives
    : [];

  const routeList = Array.isArray(descriptor.app_shell.supported_routes)
    ? descriptor.app_shell.supported_routes
    : [];

  return {
    strategist: {
      immediate_next_actions: [
        {
          id: 'strategy-align-routes',
          action: 'Confirm route narratives align to strategy positioning claims.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'identity']),
        },
      ],
      immutable_constraints: [
        {
          id: 'strategy-no-repositioning',
          constraint: 'Do not rewrite canonical positioning language outside descriptor lineage.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy']),
        },
      ],
      acceptance_checks: [
        {
          id: 'strategy-route-coverage',
          check: `All starter routes (${routeList.join(', ')}) map to canonical strategy claims.`,
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'identity']),
        },
      ],
      lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'identity']),
    },
    designer: {
      immediate_next_actions: [
        {
          id: 'designer-token-map',
          action: 'Map theme css variables and component intents to approved visual surfaces.',
          lineage: buildLineagePointer(descriptorFingerprint, ['token_contract', 'component_manifest']),
        },
      ],
      immutable_constraints: [
        {
          id: 'designer-preserve-token-contract',
          constraint: 'Do not change semantic token names or required primitive states.',
          lineage: buildLineagePointer(descriptorFingerprint, ['token_contract', 'component_manifest']),
        },
      ],
      acceptance_checks: [
        {
          id: 'designer-primitive-coverage',
          check: `Required primitives (${primitives.join(', ')}) have mapped visual treatments for required states.`,
          lineage: buildLineagePointer(descriptorFingerprint, ['token_contract', 'component_manifest']),
        },
      ],
      lineage: buildLineagePointer(descriptorFingerprint, ['token_contract', 'component_manifest']),
    },
    founder_operator: {
      immediate_next_actions: [
        {
          id: 'founder-sequence-lock',
          action: 'Sequence delivery so route scaffold, theming, and component bindings are reviewed in one gate.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'component_manifest']),
        },
      ],
      immutable_constraints: [
        {
          id: 'founder-no-ungated-launch',
          constraint: 'Do not approve launch until acceptance checks for all roles are complete.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'identity']),
        },
      ],
      acceptance_checks: [
        {
          id: 'founder-readiness-proof',
          check: 'Readiness gate includes deterministic descriptor fingerprint and role-pack fingerprint evidence.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'token_contract', 'component_manifest']),
        },
      ],
      lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'component_manifest']),
    },
    frontend_engineer: {
      immediate_next_actions: [
        {
          id: 'frontend-wire-app-shell',
          action: 'Implement app router scaffold and apply theme variables in globals.css.',
          lineage: buildLineagePointer(descriptorFingerprint, ['token_contract', 'component_manifest']),
        },
      ],
      immutable_constraints: [
        {
          id: 'frontend-no-binding-renames',
          constraint: 'Do not rename required component primitive keys or required states.',
          lineage: buildLineagePointer(descriptorFingerprint, ['component_manifest']),
        },
      ],
      acceptance_checks: [
        {
          id: 'frontend-route-and-primitive-proof',
          check: `App routes (${routeList.join(', ')}) and required primitives (${primitives.join(', ')}) match descriptor exactly.`,
          lineage: buildLineagePointer(descriptorFingerprint, ['token_contract', 'component_manifest', 'strategy']),
        },
      ],
      lineage: buildLineagePointer(descriptorFingerprint, ['token_contract', 'component_manifest', 'strategy']),
    },
    content_marketing: {
      immediate_next_actions: [
        {
          id: 'content-draft-message-map',
          action: 'Draft page and CTA copy that follows canonical strategy language and route intent.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'identity']),
        },
      ],
      immutable_constraints: [
        {
          id: 'content-no-claim-drift',
          constraint: 'Do not introduce claims outside canonical strategy lineage.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy']),
        },
      ],
      acceptance_checks: [
        {
          id: 'content-cta-proof',
          check: 'CTA language is aligned to role-pack constraints and descriptor component intents.',
          lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'identity', 'component_manifest']),
        },
      ],
      lineage: buildLineagePointer(descriptorFingerprint, ['strategy', 'identity']),
    },
  };
}

function validateRoleTemplates(roleTemplates, diagnostics) {
  REQUIRED_ROLES.forEach((roleKey) => {
    const role = roleTemplates[roleKey];
    if (!isObject(role)) {
      diagnostics.push(createDiagnostic(
        REASON_CODES.ROLE_REQUIRED_FIELD_MISSING,
        `role_packs.${roleKey}`,
        `Missing required role pack template for ${roleKey}.`,
        `Define deterministic ${roleKey} role pack output with required sections.`
      ));
      return;
    }

    ['immediate_next_actions', 'immutable_constraints', 'acceptance_checks'].forEach((section) => {
      if (!Array.isArray(role[section]) || role[section].length === 0) {
        diagnostics.push(createDiagnostic(
          REASON_CODES.ROLE_REQUIRED_FIELD_MISSING,
          `role_packs.${roleKey}.${section}`,
          `Missing required section ${section} for ${roleKey}.`,
          `Provide non-empty deterministic ${section} array for role ${roleKey}.`
        ));
      }
    });

    if (!isObject(role.lineage) || !Array.isArray(role.lineage.source_artifacts) || role.lineage.source_artifacts.length === 0) {
      diagnostics.push(createDiagnostic(
        REASON_CODES.ROLE_REQUIRED_FIELD_MISSING,
        `role_packs.${roleKey}.lineage`,
        `Missing required lineage pointer metadata for ${roleKey}.`,
        `Provide descriptor_fingerprint and source_artifacts for ${roleKey}.`
      ));
    }
  });
}

function projectRoleHandoffPacks(starterDescriptor, opts = {}) {
  const diagnostics = [];

  if (!isObject(starterDescriptor)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.ROLE_PROJECTOR_INPUT_INVALID,
      'starter_descriptor',
      'starterDescriptor must be a canonical starter descriptor object.',
      'Pass the compileStarterDescriptor().starter_descriptor output into projectRoleHandoffPacks().'
    ));

    return {
      role_pack_contract: null,
      metadata: {
        ruleset_version: normalizeString(opts.ruleset_version, ROLE_PACK_PROJECTOR_RULESET_VERSION),
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  const descriptorValidation = validateStarterDescriptor(starterDescriptor);
  if (!descriptorValidation.valid) {
    diagnostics.push(...descriptorValidation.diagnostics.map((item) => ({
      ...item,
      code: REASON_CODES.ROLE_PROJECTOR_INPUT_INVALID,
    })));

    return {
      role_pack_contract: null,
      metadata: {
        ruleset_version: normalizeString(opts.ruleset_version, ROLE_PACK_PROJECTOR_RULESET_VERSION),
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  const rulesetVersion = normalizeString(opts.ruleset_version, ROLE_PACK_PROJECTOR_RULESET_VERSION);
  const canonicalDescriptor = stableSort(starterDescriptor);
  const descriptorFingerprint = buildFingerprint({
    ruleset_version: rulesetVersion,
    starter_descriptor: canonicalDescriptor,
  });

  const roleTemplates = buildRoleTemplates(canonicalDescriptor, descriptorFingerprint);
  validateRoleTemplates(roleTemplates, diagnostics);

  const contract = {
    descriptor_reference: `starter:${descriptorFingerprint}`,
    role_packs: stableSort(roleTemplates),
  };

  const schemaValidation = validateRoleHandoffPack(contract);
  if (!schemaValidation.valid) {
    diagnostics.push(...schemaValidation.diagnostics.map((item) => ({
      ...item,
      code: REASON_CODES.ROLE_SCHEMA_INVALID,
    })));
  }

  if (diagnostics.length > 0) {
    return {
      role_pack_contract: null,
      metadata: {
        ruleset_version: rulesetVersion,
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  const canonicalContract = stableSort(contract);
  const deterministicFingerprint = buildFingerprint({
    ruleset_version: rulesetVersion,
    role_pack_contract: canonicalContract,
  });

  return {
    role_pack_contract: canonicalContract,
    metadata: {
      ruleset_version: rulesetVersion,
      descriptor_fingerprint: descriptorFingerprint,
      deterministic_fingerprint: deterministicFingerprint,
    },
    diagnostics: [],
  };
}

module.exports = {
  ROLE_PACK_PROJECTOR_RULESET_VERSION,
  projectRoleHandoffPacks,
};
