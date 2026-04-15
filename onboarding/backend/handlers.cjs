'use strict';

const {
  PROJECT_ROOT,
  ONBOARDING_DIR,
  CONFIG_PATH,
  TEMPLATES_DIR,
  LEGACY_LOCAL_DIR,
  COMPATIBILITY_LOCAL_DIRS,
  SEED_PATH,
} = require('./path-constants.cjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  assertRolloutPromotionAllowed,
  createRuntimeContext,
  getRolloutMode,
  getMarkosdbAccessMatrix,
  loadMigrationCheckpoints,
  redactSensitive,
  RETENTION_POLICY,
  resolveMirOutputPath,
  resolveProjectSlug,
  resolveRequestedProjectSlug,
  resolveSeedOutputPath,
  buildDenyEvent,
  buildLLMCallOptions,
  emitDenyTelemetry,
  assertEntitledAction,
  evaluateQuotaDimensionAccess,
  validateRequiredSecrets,
} = require('./runtime-context.cjs');
const { writeApprovedDrafts } = require('./vault/vault-writer.cjs');
const { writeRunReport } = require('./vault/run-report.cjs');
const { planImport, applyImportPlan } = require('./vault/import-engine.cjs');
const telemetry = require('./agents/telemetry.cjs');
const { generateSkeletons } = require('./agents/skeleton-generator.cjs');
const { resolvePackSelection } = require('../../lib/markos/packs/pack-loader.cjs'); // Phase 109
const {
  assertAwaitingApproval,
  recordApprovalDecision,
} = require('./agents/approval-gate.cjs');
const {
  MARKOSDB_SCHEMA_VERSION,
  SUPABASE_RELATIONAL_CONTRACT,
  UPSTASH_VECTOR_METADATA_FIELDS,
  classifyArtifact,
  buildNamespaceReadOrder,
  buildVectorMetadata,
  buildRelationalRecord,
  normalizeRelativeArtifactPath,
} = require('./markosdb-contracts.cjs');

// Phase 73: Brand input normalization and graph writing (D-04, D-06)
const { normalizeBrandInput, verifyDeterminism } = require('./brand-inputs/normalize-brand-input.cjs');
const { upsertNormalizedSegments, queryEvidenceByTenant } = require('./brand-inputs/evidence-graph-writer.cjs');
// Phase 74: Strategy artifact and messaging rules schema validation
const { validateStrategyArtifact } = require('./brand-strategy/strategy-artifact-schema.cjs');
const { validateMessagingRules } = require('./brand-strategy/messaging-rules-schema.cjs');
const { synthesizeStrategyArtifact } = require('./brand-strategy/strategy-synthesizer.cjs');
const { detectContradictions } = require('./brand-strategy/contradiction-detector.cjs');
const { persistStrategyArtifact } = require('./brand-strategy/strategy-artifact-writer.cjs');
const { compileMessagingRules } = require('./brand-strategy/messaging-rules-compiler.cjs');
const { projectRoleViews } = require('./brand-strategy/role-view-projector.cjs');
const { compileIdentityArtifact } = require('./brand-identity/identity-compiler.cjs');
const { evaluateAccessibilityGates } = require('./brand-identity/accessibility-gates.cjs');
const { persistIdentityArtifact } = require('./brand-identity/identity-artifact-writer.cjs');
const { compileTokenContract } = require('./brand-design-system/token-compiler.cjs');
const { compileComponentContractManifest } = require('./brand-design-system/component-contract-compiler.cjs');
const { persistDesignSystemArtifacts } = require('./brand-design-system/design-system-artifact-writer.cjs');
const { compileStarterDescriptor } = require('./brand-nextjs/starter-descriptor-compiler.cjs');
const { projectRoleHandoffPacks } = require('./brand-nextjs/role-handoff-pack-projector.cjs');
const { persistStarterArtifacts } = require('./brand-nextjs/starter-artifact-writer.cjs');

// Phase 78: Branding governance, publish/rollback, and closure gates (D-01 through D-10)
const { createBundle, getBundle, setVerificationEvidence } = require('./brand-governance/bundle-registry.cjs');
const { runClosureGates } = require('./brand-governance/closure-gates.cjs');
const { auditDrift } = require('./brand-governance/drift-auditor.cjs');
const {
  writeGovernanceEvidence,
  persistMilestoneClosureBundle,
} = require('./brand-governance/governance-artifact-writer.cjs');
const { buildCanonicalArtifactsFromWrites } = require('./brand-governance/lineage-handoff.cjs');
const { createVaultRetriever } = require('./vault/vault-retriever.cjs');
const auditStore = require('./vault/audit-store.cjs');
const { createLineageLogger } = require('./vault/lineage-log.cjs');
const { checkOperatorViewScope, checkAgentViewScope } = require('./vault/role-views.cjs');
const { verifyHighRiskExecution } = require('./vault/hardened-verification.cjs');

const { readBody, json } = require('./utils.cjs');

// Phase 51-03: IAM v3.2 authorization integration
let iamModule = null;
const approvalDecisionStore = new Map();

function loadIamModule() {
  if (!iamModule) {
    try {
      iamModule = require('../../lib/markos/rbac/iam-v32.js');
    } catch (err) {
      console.warn('IAM v3.2 module not available, authorization checks fail-closed:', err.message);
      iamModule = { canPerformAction: () => false };
    }
  }

  return iamModule;
}

/**
 * checkActionAuthorization(action: string, req: object): {authorized: boolean, reason?: string}
 * 
 * Checks if the request actor is authorized for the given action.
 * Uses tenant role from req.markosAuth.iamRole (set by hosted auth wrapper).
 * Returns deterministic denial reason if unauthorized (fail-closed).
 * 
 * @param {string} action - The IAM action to authorize
 * @param {object} req - Express request object with req.markosAuth.iamRole
 * @returns {object} {authorized: boolean, reason: string|null, statusCode: number}
 */
function checkActionAuthorization(action, req) {
  const iamMod = loadIamModule();
  const principal = req && req.markosAuth ? req.markosAuth : null;
  const runtime = createRuntimeContext(process.env);

  if (!principal && runtime.mode !== 'hosted') {
    return { authorized: true, reason: null, statusCode: 200 };
  }

  const fallbackContext = buildExecutionContext(req, 'authorization');
  const iamRole = (principal && principal.iamRole) || (principal && principal.role) || 'unknown';

  const authorized = Boolean(iamMod.canPerformAction && iamMod.canPerformAction(iamRole, action));
  if (!authorized) {
    const reason = `Action '${action}' not permitted for role '${iamRole}'`;
    const denyEvent = buildDenyEvent({
      actor_id: fallbackContext.actor_id,
      tenant_id: fallbackContext.tenant_id,
      action,
      reason,
      request_id: fallbackContext.correlation_id || fallbackContext.request_id,
    });

    emitDenyTelemetry(denyEvent);

    return {
      authorized: false,
      reason,
      statusCode: 403,
      denyEvent,
    };
  }

  return { authorized: true, reason: null, statusCode: 200 };
}

// Phase 52: Digital Agency plugin lazy-loader
let _daPlugin = null;
function _loadDAPlugin() {
  if (!_daPlugin) {
    try {
      _daPlugin = require('../markos/plugins/digital-agency/index.js');
    } catch (err) {
      console.warn('Digital Agency plugin not available:', err.message);
      _daPlugin = { digitalAgencyPlugin: null };
    }
  }
  return _daPlugin;
}
async function handlePluginRoute(req, res) {
  const { digitalAgencyPlugin } = _loadDAPlugin();
  if (!digitalAgencyPlugin) {
    return json(res, 503, { success: false, error: 'PLUGIN_RUNTIME_UNAVAILABLE' });
  }
  const requestPath = String(req.url || '').split('?')[0].replace(/\/+$/, '');
  const requestMethod = String(req.method || 'GET').toUpperCase();
  for (const route of digitalAgencyPlugin.routes) {
    const routeRegex = new RegExp(`^${route.path.replace(/:([^/]+)/g, '[^/]+')}$`);
    if (routeRegex.test(requestPath) && route.method === requestMethod) {
      return route.handler(req, res);
    }
  }
  return json(res, 404, { success: false, error: 'PLUGIN_ROUTE_NOT_FOUND' });
}

const INTERVIEW_MAX_QUESTIONS = 5;

const DISCIPLINE_ALIASES = Object.freeze({
  paid_media: 'Paid_Media',
  lifecycle_email: 'Lifecycle_Email',
  content_seo: 'Content_SEO',
  social: 'Social',
  landing_pages: 'Landing_Pages',
  campaigns: 'Campaigns',
  community_events: 'Community_Events',
  inbound: 'Inbound',
  outbound: 'Outbound',
  strategy: 'Strategy',
});

// (utils.cjs handles readBody and json)

/**
 * Phase 34: Client Intake SOP Automation
 * 8 validation rules for autopilot intake flow (form → validation → Linear → MIR seed)
 */
const INTAKE_VALIDATION_RULES = Object.freeze({
  R001: {
    rule: 'company.name must be non-empty string (max 100 chars)',
    check: (seed) => {
      const name = seed?.company?.name;
      return typeof name === 'string' && name.length > 0 && name.length <= 100;
    }
  },
  R002: {
    rule: 'company.stage must be one of: pre-launch, 0-1M MRR, 1-10M MRR, +10M MRR',
    check: (seed) => {
      const stage = seed?.company?.stage;
      const valid = ['pre-launch', '0-1M MRR', '1-10M MRR', '+10M MRR'];
      return valid.includes(stage);
    }
  },
  R003: {
    rule: 'product.name must be non-empty string (max 100 chars)',
    check: (seed) => {
      const name = seed?.product?.name;
      return typeof name === 'string' && name.length > 0 && name.length <= 100;
    }
  },
  R004: {
    rule: 'audience.pain_points must be array of min 2 items',
    check: (seed) => {
      const pains = seed?.audience?.pain_points;
      return Array.isArray(pains) && pains.length >= 2;
    }
  },
  R005: {
    rule: 'market.competitors must be array of min 2 objects with name + positioning',
    check: (seed) => {
      const comps = seed?.market?.competitors;
      if (!Array.isArray(comps) || comps.length < 2) return false;
      return comps.every(c => c?.name && c?.positioning);
    }
  },
  R006: {
    rule: 'market.market_trends must be array of min 1 item',
    check: (seed) => {
      const trends = seed?.market?.market_trends;
      return Array.isArray(trends) && trends.length >= 1;
    }
  },
  R007: {
    rule: 'content.content_maturity must be one of: none, basic, moderate, mature',
    check: (seed) => {
      const maturity = seed?.content?.content_maturity;
      const valid = ['none', 'basic', 'moderate', 'mature'];
      return valid.includes(maturity);
    }
  },
  R008: {
    rule: 'slug (if provided) must be alphanumeric + hyphens only',
    check: (seed) => {
      const slug = seed?.project_slug;
      if (!slug) return true; // optional
      return /^[a-z0-9-]+$/.test(slug);
    }
  },
  // Phase 73 (D-01, D-02, D-03): Brand input validation rules (optional, additive)
  R_BRAND_01: {
    rule: 'brand_input.audience_segments must be array with 2-5 segments (D-01)',
    check: (seed) => {
      const segments = seed?.brand_input?.audience_segments;
      if (!segments) return true; // optional
      return Array.isArray(segments) && segments.length >= 2 && segments.length <= 5;
    }
  },
  R_BRAND_02: {
    rule: 'brand_input: each segment must have segment_name and segment_id (D-03)',
    check: (seed) => {
      const segments = seed?.brand_input?.audience_segments;
      if (!segments) return true; // optional
      return Array.isArray(segments) && segments.every(s => s?.segment_name && s?.segment_id);
    }
  },
  R_BRAND_03: {
    rule: 'brand_input: all pain/need/expectation items must have required rationale fields (D-02)',
    check: (seed) => {
      const segments = seed?.brand_input?.audience_segments;
      if (!segments) return true; // optional
      
      return Array.isArray(segments) && segments.every(segment => {
        // Check pains have rationale (D-02)
        if (Array.isArray(segment.pains)) {
          if (!segment.pains.every(p => p?.pain && p?.rationale)) {
            return false;
          }
        }
        
        // Check needs have rationale (D-02)
        if (Array.isArray(segment.needs)) {
          if (!segment.needs.every(n => n?.need && n?.rationale)) {
            return false;
          }
        }
        
        // Check expectations have rationale (D-02)
        if (Array.isArray(segment.expectations)) {
          if (!segment.expectations.every(e => e?.expectation && e?.rationale)) {
            return false;
          }
        }
        
        return true;
      });
    }
  }
});

/**
 * Validate intake seed against all 8 rules
 * Returns: { valid: bool, failedRules: [rule_ids], errors: {rule_id: rule_description}}
 */
function validateIntake(seed) {
  const failedRules = [];
  const errors = {};
  
  Object.entries(INTAKE_VALIDATION_RULES).forEach(([ruleId, ruleObj]) => {
    if (!ruleObj.check(seed)) {
      failedRules.push(ruleId);
      errors[ruleId] = ruleObj.rule;
    }
  });
  
  return {
    valid: failedRules.length === 0,
    failedRules,
    errors
  };
}

const EXECUTION_READINESS_CONTRACT = Object.freeze({
  requiredDraftSections: [
    'company_profile',
    'mission_values',
    'audience',
    'competitive',
    'brand_voice',
    'channel_strategy',
  ],
  requiredWinnersCatalogs: [
    '.markos-local/MSP/Paid_Media/WINNERS/_CATALOG.md',
    '.markos-local/MSP/Lifecycle_Email/WINNERS/_CATALOG.md',
    '.markos-local/MSP/Content_SEO/WINNERS/_CATALOG.md',
    '.markos-local/MSP/Social/WINNERS/_CATALOG.md',
    '.markos-local/MSP/Landing_Pages/WINNERS/_CATALOG.md',
  ],
});

const MIGRATION_CHECKPOINTS_PATH = path.join(
  PROJECT_ROOT,
  '.planning',
  'phases',
  '31-rollout-hardening',
  '31-MIGRATION-CHECKPOINTS.json'
);

function emitRolloutEndpointTelemetry({ endpoint, startedAt, outcomeState, statusCode, runtimeMode, projectSlug }) {
  if (!telemetry || typeof telemetry.captureRolloutEndpointEvent !== 'function') {
    return;
  }
  telemetry.captureRolloutEndpointEvent(endpoint, {
    outcome_state: outcomeState,
    status_code: statusCode,
    duration_ms: Math.max(0, Date.now() - startedAt),
    runtime_mode: runtimeMode,
    project_slug: projectSlug || null,
  });
}

function buildExecutionReadiness(approvedDrafts = {}) {
  const draftChecks = EXECUTION_READINESS_CONTRACT.requiredDraftSections.map((section) => {
    const approved = typeof approvedDrafts[section] === 'string' && approvedDrafts[section].trim().length > 0;
    return {
      type: 'approved_draft',
      key: section,
      ready: approved,
      blocking: !approved,
      detail: approved ? 'approved' : 'missing',
    };
  });

  const winnerChecks = EXECUTION_READINESS_CONTRACT.requiredWinnersCatalogs.map((relativePath) => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, relativePath));
    return {
      type: 'winners_catalog',
      key: relativePath,
      ready: exists,
      blocking: !exists,
      detail: exists ? 'present' : 'missing',
    };
  });

  const checks = [...draftChecks, ...winnerChecks];
  const blockingChecks = checks.filter((check) => check.blocking);

  return {
    status: blockingChecks.length === 0 ? 'ready' : 'blocked',
    checks,
    blocking_checks: blockingChecks,
  };
}

function createOutcome(state, code, message, details = {}) {
  return {
    state,
    code,
    message,
    warnings: details.warnings || [],
    errors: details.errors || [],
    fallback: Boolean(details.fallback),
  };
}

function summarizeImporterItems(items = []) {
  const totals = {
    imported: 0,
    imported_with_warnings: 0,
    blocked: 0,
    skipped: 0,
  };

  for (const item of items) {
    const key = item?.outcome || item?.proposed_outcome;
    if (Object.prototype.hasOwnProperty.call(totals, key)) {
      totals[key] += 1;
    }
  }

  return {
    ...totals,
    total: items.length,
    eligible: totals.imported + totals.imported_with_warnings,
  };
}

function normalizeImportItems(items = []) {
  return items.map((item) => ({
    ...item,
    outcome: item.outcome || item.proposed_outcome || 'skipped',
  }));
}

function createImporterUnavailableResponse(res, message, code = 'LOCAL_PERSISTENCE_UNAVAILABLE') {
  return json(res, 501, {
    success: false,
    error: code,
    message,
    outcome: createOutcome('failure', code, message, {
      errors: [message],
    }),
  });
}

function walkFiles(rootDir, files = []) {
  if (!fs.existsSync(rootDir)) return files;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, files);
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function listLocalCompatibilityArtifacts(sourceRoot) {
  const sourceCandidates = sourceRoot
    ? [sourceRoot]
    : COMPATIBILITY_LOCAL_DIRS.filter((candidate) => fs.existsSync(candidate));

  const discovered = [];
  for (const root of sourceCandidates) {
    if (!fs.existsSync(root)) continue;
    const allFiles = walkFiles(root, []);
    const markdownFiles = allFiles
      .filter((filePath) => filePath.toLowerCase().endsWith('.md'))
      .sort((a, b) => a.localeCompare(b));

    for (const absolutePath of markdownFiles) {
      const relativePath = normalizeRelativeArtifactPath(root, absolutePath);
      if (!relativePath.startsWith('MIR/') && !relativePath.startsWith('MSP/')) {
        continue;
      }
      discovered.push({ root, absolutePath, relativePath });
    }
  }

  return discovered;
}

function createChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function buildExecutionContext(req, slug) {
  const principal = req && req.markosAuth ? req.markosAuth : null;
  const headers = (req && req.headers) || {};

  return {
    tenant_id: principal && principal.tenant_id ? principal.tenant_id : `local-${slug}`,
    actor_id: (principal && principal.principal && principal.principal.id)
      || (principal && principal.id)
      || 'local-operator',
    role: (principal && principal.iamRole) || (principal && principal.role) || 'local_runtime',
    request_id: (principal && principal.request_id)
      || headers['x-request-id']
      || crypto.randomUUID(),
    correlation_id: (principal && principal.correlation_id)
      || headers['x-correlation-id']
      || null,
    entitlement_snapshot: (req && (req.entitlementSnapshot || req.entitlement_snapshot))
      || (principal && principal.entitlement_snapshot)
      || null,
  };
}

function buildRuntimeLLMOptions(req, slug, agentName) {
  const executionContext = buildExecutionContext(req, slug);
  return buildLLMCallOptions(executionContext, {
    metadata: {
      projectSlug: slug,
      agentName,
    },
  });
}

function buildMigrationArtifactRecord(projectSlug, artifactFile, ingestedAt) {
  const content = fs.readFileSync(artifactFile.absolutePath, 'utf8');
  const checksumSha256 = createChecksum(content);
  const artifactType = classifyArtifact(artifactFile.relativePath);
  const artifactId = `${projectSlug}:${artifactFile.relativePath}`;

  return {
    artifact_id: artifactId,
    artifact_type: artifactType,
    source_path: artifactFile.relativePath,
    checksum_sha256: checksumSha256,
    content,
    relational_record: buildRelationalRecord({
      projectSlug,
      relativePath: artifactFile.relativePath,
      artifactType,
      checksumSha256,
      content,
      ingestedAt,
    }),
    vector_metadata: buildVectorMetadata({
      projectSlug,
      relativePath: artifactFile.relativePath,
      artifactType,
      checksumSha256,
      content,
      ingestedAt,
    }),
  };
}

function buildCompatibilityNamespaceReadOrder(projectSlug) {
  const canonical = (process.env.MARKOS_VECTOR_PREFIX || 'markos').trim().toLowerCase() || 'markos';
  const prefixes = Array.from(new Set([canonical, 'markos', 'markos']));
  return buildNamespaceReadOrder(projectSlug, canonical, prefixes);
}

function normalizeDisciplineKey(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-\/]+/g, '_');
}

function resolveDisciplineFolder(input) {
  const normalized = normalizeDisciplineKey(input);
  return DISCIPLINE_ALIASES[normalized] || null;
}

function resolveWinnersCatalogPath(disciplineInput) {
  const disciplineFolder = resolveDisciplineFolder(disciplineInput);
  if (!disciplineFolder) {
    return null;
  }
  return path.join(LEGACY_LOCAL_DIR, 'MSP', disciplineFolder, 'WINNERS', '_CATALOG.md');
}

function appendCatalogRow(catalogPath, row) {
  const existing = fs.existsSync(catalogPath)
    ? fs.readFileSync(catalogPath, 'utf8')
    : [
        '---',
        'discipline: unknown',
        'type: winners_catalog',
        'status: active',
        '---',
        '',
        '# WINNERS CATALOG',
        '',
        '## CATALOG REGISTRY',
        '| Asset ID | Performance Metric | Why it Won | Path |',
        '|----------|--------------------|------------|------|',
        '| (none)   | —                  | —          | —    |',
        '',
      ].join('\n');

  const nonePlaceholder = '| (none)   | —                  | —          | —    |';
  let next = existing;

  if (next.includes(nonePlaceholder)) {
    next = next.replace(nonePlaceholder, row);
  } else if (next.includes('\n> [!NOTE]')) {
    next = next.replace('\n> [!NOTE]', `\n${row}\n\n> [!NOTE]`);
  } else {
    next = `${next.trimEnd()}\n${row}\n`;
  }

  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
  fs.writeFileSync(catalogPath, next, 'utf8');
}

function readLinearTemplateRegistry() {
  const catalogPath = path.join(TEMPLATES_DIR, 'LINEAR-TASKS', '_CATALOG.md');
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Linear ITM catalog not found at ${catalogPath}`);
  }

  const content = fs.readFileSync(catalogPath, 'utf8');
  const registry = new Map();
  const re = /\|\s*(MARKOS-ITM-[A-Z]+-\d+)\s*\|\s*`LINEAR-TASKS\/([^`]+)`\s*\|/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    registry.set(match[1], path.join(TEMPLATES_DIR, 'LINEAR-TASKS', match[2]));
  }
  return registry;
}

function deriveTokenDomain(token) {
  const match = String(token || '').match(/^MARKOS-ITM-([A-Z]+)-\d+$/i);
  return match ? match[1].toUpperCase() : 'OPS';
}

function buildLinearTitle(token, templateContent, variables = {}, fallback = {}) {
  const formatMatch = templateContent.match(/\*\*Linear Title format:\*\*\s*`([^`]+)`/);
  const format = formatMatch ? formatMatch[1] : `[MARKOS] ${token}`;
  return format.replace(/\{([^}]+)\}/g, (_, key) => {
    if (variables[key] !== undefined && variables[key] !== null && String(variables[key]).trim()) {
      return String(variables[key]).trim();
    }
    if (fallback[key] !== undefined && fallback[key] !== null && String(fallback[key]).trim()) {
      return String(fallback[key]).trim();
    }
    return `unknown_${key}`;
  });
}

function parseAssigneeMap(rawMap) {
  if (!rawMap) return {};
  if (typeof rawMap === 'object') return rawMap;
  try {
    const parsed = JSON.parse(rawMap);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function shouldApplyIntakeValidation(seed = {}) {
  return Boolean(
    seed?.company?.stage ||
    seed?.audience?.pain_points ||
    seed?.market?.competitors ||
    seed?.market?.market_trends ||
    seed?.content?.content_maturity ||
    seed?.project_slug
  );
}

function resolveDesignSystemSemanticIntent(seed) {
  if (!seed || typeof seed !== 'object' || !seed.design_system_semantic_intent || typeof seed.design_system_semantic_intent !== 'object') {
    return {};
  }

  const intent = seed.design_system_semantic_intent;
  return {
    tone: typeof intent.tone === 'string' ? intent.tone : undefined,
    emphasis: typeof intent.emphasis === 'string' ? intent.emphasis : undefined,
    density: typeof intent.density === 'string' ? intent.density : undefined,
    feedback_state: typeof intent.feedback_state === 'string' ? intent.feedback_state : undefined,
    required_primitives: Array.isArray(intent.required_primitives) ? intent.required_primitives.slice() : undefined,
    required_states: Array.isArray(intent.required_states) ? intent.required_states.slice() : undefined,
  };
}


async function autoCreateLinearIntakeTickets({ slug, phase = '34', seed = {} }) {
  const intakeTokens = ['MARKOS-ITM-OPS-03', 'MARKOS-ITM-INT-01'];

  try {
    const secretCheck = validateRequiredSecrets({
      runtimeMode: createRuntimeContext().mode,
      operation: 'linear_sync_write',
      env: process.env,
    });

    if (!secretCheck.ok) {
      return {
        created: [],
        skipped: intakeTokens.map((token) => ({ token, reason: 'missing_linear_secret' })),
      };
    }

    const { getTeamId, getUserId, createIssue } = require('./linear-client.cjs');
    const registry = readLinearTemplateRegistry();
    const teamKeyOrId = process.env.LINEAR_TEAM_KEY || process.env.LINEAR_TEAM_ID;
    const teamId = await getTeamId(teamKeyOrId);
    const assigneeMap = parseAssigneeMap(process.env.LINEAR_ASSIGNEE_MAP);
    const created = [];
    const skipped = [];

    for (const token of intakeTokens) {
      const templatePath = registry.get(token);
      if (!templatePath || !fs.existsSync(templatePath)) {
        skipped.push({ token, reason: 'unknown_token' });
        continue;
      }

      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const domain = deriveTokenDomain(token);
      const assigneeHint = assigneeMap[domain] || process.env.LINEAR_ASSIGNEE_DEFAULT;
      const assigneeId = await getUserId(assigneeHint);
      const variables = {
        client_name: seed?.company?.name || slug,
        company_stage: seed?.company?.stage || 'unknown-stage',
        project_slug: slug,
      };
      const title = buildLinearTitle(token, templateContent, variables, {
        campaign_name: slug,
        phase,
      });

      const description = [
        `Token: ${token}`,
        `Project Slug: ${slug}`,
        `Phase: ${phase}`,
        '',
        templateContent,
      ].join('\n');

      const issue = await createIssue({
        teamId,
        title,
        description,
        assigneeId: assigneeId || undefined,
      });

      created.push({
        token,
        identifier: issue.identifier,
        id: issue.id,
        title: issue.title,
        url: issue.url,
      });
    }

    return { created, skipped };
  } catch (error) {
    return {
      created: [],
      skipped: intakeTokens.map((token) => ({ token, reason: 'linear_sync_error' })),
      error: error.message,
    };
  }
}

async function handleLinearSync(req, res) {
  const startedAt = Date.now();
  const runtime = createRuntimeContext();
  const endpoint = '/linear/sync';
  let projectSlug = null;
  try {
    const secretCheck = validateRequiredSecrets({
      runtimeMode: runtime.mode,
      operation: 'linear_sync_write',
      env: process.env,
    });
    if (!secretCheck.ok) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 503,
        runtimeMode: runtime.mode,
        projectSlug,
      });
      return json(res, 503, {
        success: false,
        error: 'LINEAR_API_KEY_MISSING',
        message: 'Missing LINEAR_API_KEY. Configure it in .env before calling /linear/sync.',
      });
    }

    const { LinearSetupError, getTeamId, getUserId, createIssue } = require('./linear-client.cjs');
    const body = await readBody(req);
    const slug = body.slug || 'markos-project';
    projectSlug = slug;
    const phase = body.phase || 'unspecified';
    const tasks = Array.isArray(body.tasks) ? body.tasks : (Array.isArray(body.tokens) ? body.tokens : []);

    if (tasks.length === 0) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 400,
        runtimeMode: runtime.mode,
        projectSlug,
      });
      return json(res, 400, {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'tasks (or tokens) must be a non-empty array.',
      });
    }

    const registry = readLinearTemplateRegistry();
    const assigneeMap = {
      ...parseAssigneeMap(process.env.LINEAR_ASSIGNEE_MAP),
      ...parseAssigneeMap(body.assignee_map),
    };

    const teamKeyOrId = body.team || body.team_key || process.env.LINEAR_TEAM_KEY || process.env.LINEAR_TEAM_ID;
    const teamId = await getTeamId(teamKeyOrId);

    const created = [];
    const skipped = [];

    for (const item of tasks) {
      const task = typeof item === 'string' ? { token: item } : item;
      const token = String(task.token || '').trim();
      if (!token) {
        skipped.push({ reason: 'missing_token' });
        continue;
      }

      const templatePath = registry.get(token);
      if (!templatePath || !fs.existsSync(templatePath)) {
        skipped.push({ token, reason: 'unknown_token' });
        continue;
      }

      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const domain = deriveTokenDomain(token);
      const assigneeHint = task.assignee || assigneeMap[domain] || body.default_assignee || process.env.LINEAR_ASSIGNEE_DEFAULT;
      const assigneeId = await getUserId(assigneeHint);
      const variables = task.variables || {};
      const title = buildLinearTitle(token, templateContent, variables, {
        campaign_name: slug,
        phase,
      });

      const description = [
        `Token: ${token}`,
        `Project Slug: ${slug}`,
        `Phase: ${phase}`,
        '',
        templateContent,
      ].join('\n');

      const issue = await createIssue({
        teamId,
        title,
        description,
        assigneeId: assigneeId || undefined,
      });

      created.push({
        token,
        identifier: issue.identifier,
        id: issue.id,
        title: issue.title,
        url: issue.url,
        assignee: assigneeHint || null,
      });
    }

    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'success',
      statusCode: 200,
      runtimeMode: runtime.mode,
      projectSlug,
    });
    return json(res, 200, {
      success: true,
      slug,
      phase,
      team_id: teamId,
      created,
      skipped,
    });
  } catch (err) {
    const isSetupError = err && err.name === 'LinearSetupError';
    if (isSetupError) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 503,
        runtimeMode: runtime.mode,
        projectSlug,
      });
      return json(res, 503, {
        success: false,
        error: err.code || 'LINEAR_SETUP_ERROR',
        message: err.message,
      });
    }

    console.error('[POST /linear/sync] Error:', redactSensitive(err.message));
    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'failure',
      statusCode: 500,
      runtimeMode: runtime.mode,
      projectSlug,
    });
    return json(res, 500, { success: false, error: err.message });
  }
}

async function handleCampaignResult(req, res) {
  const startedAt = Date.now();
  const runtime = createRuntimeContext();
  const endpoint = '/campaign/result';
  let projectSlug = null;
  try {
    const secretCheck = validateRequiredSecrets({
      runtimeMode: runtime.mode,
      operation: 'campaign_result_write',
      env: process.env,
    });
    if (!secretCheck.ok) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 503,
        runtimeMode: runtime.mode,
        projectSlug,
      });
      return json(res, 503, {
        success: false,
        error: 'REQUIRED_SECRET_MISSING',
        message: `Missing required runtime secret(s): ${secretCheck.missing.join(', ')}`,
      });
    }

    const vectorStore = require('./vector-store-client.cjs');
    vectorStore.configure(runtime.config);

    const body = await readBody(req);
    const slug = body.slug || body.project_slug;
    projectSlug = slug;
    const discipline = body.discipline;
    const asset = body.asset || body.asset_id || body.asset_name;
    const metric = body.metric;
    const value = body.value;
    const outcome = body.outcome;
    const notes = body.notes || '';

    if (!slug || !discipline || !asset || !metric || value === undefined || value === null || !outcome) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 400,
        runtimeMode: runtime.mode,
        projectSlug,
      });
      return json(res, 400, {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Required fields: slug, discipline, asset, metric, value, outcome.',
      });
    }

    const catalogPath = resolveWinnersCatalogPath(discipline);
    if (!catalogPath) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 400,
        runtimeMode: runtime.mode,
        projectSlug,
      });
      return json(res, 400, {
        success: false,
        error: 'UNKNOWN_DISCIPLINE',
        message: `Unsupported discipline: ${discipline}`,
      });
    }

    const isoDate = new Date().toISOString();
    const outcomeClassification = String(outcome).trim().toUpperCase();
    const metricCell = `${metric}: ${value}`;
    const whyWon = notes || `Outcome ${outcomeClassification} on ${isoDate.slice(0, 10)}`;
    const pathCell = body.path || body.asset_path || `campaign-results/${slug}`;
    const row = `| ${asset} | ${metricCell} | ${whyWon} | ${pathCell} |`;

    appendCatalogRow(catalogPath, row);

    const metadata = {
      type: 'campaign_result',
      discipline: resolveDisciplineFolder(discipline),
      outcome_classification: outcomeClassification,
      metric,
      metric_value: value,
      asset,
      notes,
      recorded_at: isoDate,
    };

    let persistence = { ok: true };
    if (typeof vectorStore.storeCampaignOutcome === 'function') {
      persistence = await vectorStore.storeCampaignOutcome(slug, body, metadata);
    } else {
      persistence = await vectorStore.storeDraft(slug, `campaign-result-${Date.now()}`, JSON.stringify(body, null, 2), metadata);
    }

    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'success',
      statusCode: 200,
      runtimeMode: runtime.mode,
      projectSlug,
    });
    return json(res, 200, {
      success: true,
      catalog_path: catalogPath,
      row,
      metadata,
      persistence,
    });
  } catch (err) {
    console.error('[POST /campaign/result] Error:', redactSensitive(err.message));
    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'failure',
      statusCode: 500,
      runtimeMode: runtime.mode,
      projectSlug,
    });
    return json(res, 500, { success: false, error: err.message });
  }
}

async function handleConfig(req, res) {
  const runtime = createRuntimeContext();
  const configSecretCheck = validateRequiredSecrets({
    runtimeMode: runtime.mode,
    operation: 'config_read',
    env: process.env,
  });
  if (!configSecretCheck.ok) {
    return json(res, 503, {
      success: false,
      error: 'REQUIRED_SECRET_MISSING',
      message: `Missing required runtime secret(s): ${configSecretCheck.missing.join(', ')}`,
      operation: 'config_read',
    });
  }

  const migrationCheckpoints = loadMigrationCheckpoints(MIGRATION_CHECKPOINTS_PATH);
  const activeRolloutMode = getRolloutMode(process.env);
  const namespaceReadOrder = buildCompatibilityNamespaceReadOrder(runtime.config.project_slug || 'markos-client');

  json(res, 200, {
    ...runtime.config,
    runtime_mode: runtime.mode,
    local_persistence: runtime.canWriteLocalFiles,
    markosdb: {
      schema_version: MARKOSDB_SCHEMA_VERSION,
      access_matrix: getMarkosdbAccessMatrix(),
      supabase_contract: SUPABASE_RELATIONAL_CONTRACT,
      upstash_metadata_fields: UPSTASH_VECTOR_METADATA_FIELDS,
      namespace_read_order: namespaceReadOrder,
      auth: req && req.markosAuth ? req.markosAuth.principal : { type: 'local_runtime', id: 'local-operator', scopes: [] },
    },
    rollout_mode: activeRolloutMode,
    promotion_checkpoint: {
      current_mode: migrationCheckpoints.current_mode,
      transitions: migrationCheckpoints.transitions,
      source: path.relative(PROJECT_ROOT, MIGRATION_CHECKPOINTS_PATH),
    },
    retention_policy: RETENTION_POLICY,
  });
}

async function handleStatus(req, res) {
  const runtime = createRuntimeContext();
  const statusSecretCheck = validateRequiredSecrets({
    runtimeMode: runtime.mode,
    operation: 'status_read',
    env: process.env,
  });
  if (!statusSecretCheck.ok) {
    return json(res, 503, {
      success: false,
      error: 'REQUIRED_SECRET_MISSING',
      message: `Missing required runtime secret(s): ${statusSecretCheck.missing.join(', ')}`,
      operation: 'status_read',
    });
  }

  const vectorStore = require('./vector-store-client.cjs');
  vectorStore.configure(runtime.config);
  const vectorHealth = await vectorStore.healthCheck();
  const migrationCheckpoints = loadMigrationCheckpoints(MIGRATION_CHECKPOINTS_PATH);

    // Phase 43 LIT-14: add literacy readiness to status response.
    const { evaluateLiteracyReadiness } = require('./literacy/activation-readiness.cjs');
    const literacyStatus = await evaluateLiteracyReadiness(null, runtime.config);

  const activeRolloutMode = getRolloutMode(process.env);
  const installProfile = runtime.config.install_profile || 'full';
  const profileComponents = runtime.config.components || {
    onboarding_enabled: installProfile === 'full',
    ui_enabled: installProfile === 'full',
  };
  const statusGuidance = profileComponents.onboarding_enabled
    ? 'Onboarding helper is enabled for this profile and remains transitional during migration.'
    : 'Onboarding helper is disabled for this profile. Use CLI-only workflows or switch to full profile if onboarding UI is needed.';

  let mirGateStatus = { total: 0, complete: 0, gate1Ready: false };
  const mirOutputPath = resolveMirOutputPath(runtime.config);
  try {
    const stateContent = fs.readFileSync(path.join(mirOutputPath, 'STATE.md'), 'utf8');
    const rows = stateContent.match(/\|\s*`[^`]+`\s*\|\s*`(empty|complete)`/g) || [];
    mirGateStatus.total = rows.length;
    mirGateStatus.complete = rows.filter(r => r.includes('complete')).length;
    mirGateStatus.gate1Ready = mirGateStatus.complete >= 5;
  } catch (e) {}

  json(res, 200, {
    vector_memory: vectorHealth,
    memory: {
      ...vectorHealth,
      runtime_mode: runtime.mode,
      local_persistence: runtime.canWriteLocalFiles,
      requires_operator_action: !vectorHealth.ok,
    },
    mir: mirGateStatus,
    runtime_mode: runtime.mode,
    install_profile: installProfile,
    profile_schema_version: Number(runtime.config.profile_schema_version || 1),
    components: profileComponents,
    onboarding_enabled: profileComponents.onboarding_enabled,
    ui_enabled: profileComponents.ui_enabled,
    profile_guidance: statusGuidance,
    local_persistence: runtime.canWriteLocalFiles,
    markosdb: {
      schema_version: MARKOSDB_SCHEMA_VERSION,
      access_matrix: getMarkosdbAccessMatrix(),
      auth: req && req.markosAuth ? req.markosAuth.principal : { type: 'local_runtime', id: 'local-operator', scopes: [] },
    },
    rollout_mode: activeRolloutMode,
    promotion_checkpoint: {
      current_mode: migrationCheckpoints.current_mode,
      transitions: migrationCheckpoints.transitions,
      source: path.relative(PROJECT_ROOT, MIGRATION_CHECKPOINTS_PATH),
    },
    retention_policy: RETENTION_POLICY,
      literacy: {
        readiness: literacyStatus.readiness,
        disciplines_available: literacyStatus.disciplines_available,
        gaps: literacyStatus.gaps,
        last_ingestion_at: null,
      },
  });
}

async function handleLiteracyCoverage(req, res) {
  const runtime = createRuntimeContext();
  const coverageSecretCheck = validateRequiredSecrets({
    runtimeMode: runtime.mode,
    operation: 'status_read',
    env: process.env,
  });

  if (!coverageSecretCheck.ok) {
    return json(res, 503, {
      success: false,
      error: 'REQUIRED_SECRET_MISSING',
      message: `Missing required runtime secret(s): ${coverageSecretCheck.missing.join(', ')}`,
      operation: 'status_read',
    });
  }

  const vectorStore = require('./vector-store-client.cjs');
  vectorStore.configure(runtime.config);

  const coverage = await vectorStore.getLiteracyCoverageSummary();
  return json(res, 200, {
    success: true,
    status: coverage.status,
    runtime_mode: runtime.mode,
    disciplines: coverage.disciplines,
    providers: coverage.providers || {},
  });
}

async function handleMarkosdbMigration(req, res) {
  try {
    // Task 51-04-01: Background migration execution with tenant principal
    // req.markosAuth is populated by api/migrate.js with tenant context
    const tenantPrincipal = req.markosAuth;
    
    const runtime = createRuntimeContext();
    const migrationSecretCheck = validateRequiredSecrets({
      runtimeMode: runtime.mode,
      operation: 'migration_write',
      env: process.env,
    });
    if (!migrationSecretCheck.ok) {
      return json(res, 503, {
        success: false,
        error: 'REQUIRED_SECRET_MISSING',
        message: `Missing required runtime secret(s): ${migrationSecretCheck.missing.join(', ')}`,
        operation: 'migration_write',
        tenant_id: tenantPrincipal?.tenant_id,
      });
    }

    const body = await readBody(req);
    const requestedSlug = resolveRequestedProjectSlug({
      explicitSlug: body.project_slug,
      requestUrl: req.url,
      config: runtime.config,
      companyName: body.company_name || '',
    });
    const projectSlug = resolveProjectSlug(runtime, requestedSlug);
    const dryRun = Boolean(body.dry_run);
    const rolloutMode = getRolloutMode(process.env);
    const checkpoints = loadMigrationCheckpoints(MIGRATION_CHECKPOINTS_PATH);
    const currentMode = checkpoints.current_mode || rolloutMode;

    let promotionCheckpoint = {
      current_mode: currentMode,
      target_mode: rolloutMode,
      required: false,
      valid: true,
      checkpoint: null,
    };

    if (!dryRun) {
      try {
        const promotionResult = assertRolloutPromotionAllowed({
          currentMode,
          targetMode: rolloutMode,
          projectSlug,
          checkpoints,
        });
        promotionCheckpoint = {
          ...promotionCheckpoint,
          required: Boolean(promotionResult.transition_required),
          valid: true,
          checkpoint: promotionResult.checkpoint || null,
        };
      } catch (promotionError) {
        return json(res, 409, {
          success: false,
          error: promotionError.message,
          project_slug: projectSlug,
          rollout_mode: rolloutMode,
          promotion_checkpoint: {
            ...promotionCheckpoint,
            valid: false,
          },
        });
      }
    }

    const sourceRoot = body.source_root
      ? path.resolve(PROJECT_ROOT, body.source_root)
      : null;

    const discoveredArtifacts = listLocalCompatibilityArtifacts(sourceRoot);
    const ingestedAt = new Date().toISOString();
    const normalizedArtifacts = discoveredArtifacts.map((artifactFile) => buildMigrationArtifactRecord(projectSlug, artifactFile, ingestedAt));

    if (dryRun) {
      return json(res, 200, {
        success: true,
        dry_run: true,
        project_slug: projectSlug,
        rollout_mode: rolloutMode,
        promotion_checkpoint: promotionCheckpoint,
        discovered_count: normalizedArtifacts.length,
        source_roots: sourceRoot ? [sourceRoot] : COMPATIBILITY_LOCAL_DIRS,
        records: normalizedArtifacts.map((artifact) => ({
          artifact_id: artifact.artifact_id,
          artifact_type: artifact.artifact_type,
          source_path: artifact.source_path,
          checksum_sha256: artifact.checksum_sha256,
          relational_record: artifact.relational_record,
          vector_metadata: artifact.vector_metadata,
        })),
      });
    }

    const vectorStore = require('./vector-store-client.cjs');
    vectorStore.configure(runtime.config);

    const persisted = [];
    const errors = [];
    for (const artifact of normalizedArtifacts) {
      try {
        const result = await vectorStore.upsertMarkosdbArtifact(projectSlug, artifact);
        persisted.push({
          artifact_id: artifact.artifact_id,
          source_path: artifact.source_path,
          collection: result.collection,
        });
      } catch (error) {
        errors.push({
          artifact_id: artifact.artifact_id,
          source_path: artifact.source_path,
          error: error.message,
        });
      }
    }

    return json(res, 200, {
      success: errors.length === 0,
      dry_run: false,
      project_slug: projectSlug,
      rollout_mode: rolloutMode,
      promotion_checkpoint: promotionCheckpoint,
      schema_version: MARKOSDB_SCHEMA_VERSION,
      discovered_count: normalizedArtifacts.length,
      persisted_count: persisted.length,
      failed_count: errors.length,
      persisted,
      errors,
    });
  } catch (err) {
    console.error('[POST /migrate/local-to-cloud] Error:', err.message);
    return json(res, 500, { success: false, error: err.message });
  }
}

async function handleSubmit(req, res) {
  const startedAt = Date.now();
  const runtime = createRuntimeContext();
  const endpoint = '/submit';
  let slug = null;
  try {
    // Phase 51-03: Action-level IAM authorization check
    const authCheck = checkActionAuthorization('execute_task', req);
    if (!authCheck.authorized) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: authCheck.statusCode,
        runtimeMode: runtime.mode,
        projectSlug: slug,
      });
      return json(res, authCheck.statusCode, {
        success: false,
        error: 'AUTHORIZATION_DENIED',
        message: authCheck.reason,
        outcome: {
          state: 'failure',
          code: 'AUTHORIZATION_DENIED',
          message: authCheck.reason,
        },
      });
    }

    const entitlementCheck = assertEntitledAction(buildExecutionContext(req, slug || 'submit'), 'execute_task');
    if (!entitlementCheck.allowed) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 403,
        runtimeMode: runtime.mode,
        projectSlug: slug,
      });
      return json(res, 403, {
        success: false,
        error: entitlementCheck.reason_code || 'BILLING_POLICY_BLOCKED',
        message: 'Action blocked by billing policy',
        outcome: {
          state: 'blocked',
          code: entitlementCheck.reason_code || 'BILLING_POLICY_BLOCKED',
          message: 'Action blocked by billing policy',
        },
      });
    }

    const secretCheck = validateRequiredSecrets({
      runtimeMode: runtime.mode,
      operation: 'submit_write',
      env: process.env,
    });
    if (!secretCheck.ok) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 503,
        runtimeMode: runtime.mode,
        projectSlug: slug,
      });
      return json(res, 503, {
        success: false,
        error: 'REQUIRED_SECRET_MISSING',
        message: `Missing required runtime secret(s): ${secretCheck.missing.join(', ')}`,
      });
    }

    const vectorStore = require('./vector-store-client.cjs');
    vectorStore.configure(runtime.config);
    const body = await readBody(req);
    const seed = body.seed || body; // Support payload {"seed": {...}, "project_slug": "..."}

    // Phase 34: strict validation is applied for enriched intake payloads.
    const applyStrictValidation = shouldApplyIntakeValidation(seed);
    const validation = applyStrictValidation
      ? validateIntake(seed)
      : { valid: true, failedRules: [], errors: {} };

    if (applyStrictValidation && !validation.valid) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 400,
        runtimeMode: runtime.mode,
        projectSlug: slug,
      });
      return json(res, 400, {
        success: false,
        error: 'INTAKE_VALIDATION_FAILED',
        message: 'Form submission failed validation',
        failed_rules: validation.failedRules,
        validation_errors: validation.errors,
      });
    }

    // Phase 74: Additive canonical strategy and messaging schema guards (D-01, D-02, D-05, D-06, D-09)
    if (seed.strategy_artifact && typeof seed.strategy_artifact === 'object') {
      const strategyValidation = validateStrategyArtifact(seed.strategy_artifact);
      if (!strategyValidation.valid) {
        emitRolloutEndpointTelemetry({
          endpoint,
          startedAt,
          outcomeState: 'failure',
          statusCode: 400,
          runtimeMode: runtime.mode,
          projectSlug: slug,
        });
        return json(res, 400, {
          success: false,
          error: 'STRATEGY_ARTIFACT_INVALID',
          message: 'Canonical strategy artifact validation failed',
          validation_errors: strategyValidation.errors,
        });
      }
    }

    if (seed.messaging_rules && typeof seed.messaging_rules === 'object') {
      const messagingValidation = validateMessagingRules(seed.messaging_rules);
      if (!messagingValidation.valid) {
        emitRolloutEndpointTelemetry({
          endpoint,
          startedAt,
          outcomeState: 'failure',
          statusCode: 400,
          runtimeMode: runtime.mode,
          projectSlug: slug,
        });
        return json(res, 400, {
          success: false,
          error: 'MESSAGING_RULES_INVALID',
          message: 'Canonical messaging rules validation failed',
          validation_errors: messagingValidation.errors,
        });
      }
    }

    // Phase 73: Brand input normalization and deterministic graph writes (D-04, D-06)
    let brandNormalizationResult = null;
    let brandGraphResult = null;
    let strategySynthesisResult = null;
    let strategyPersistenceResult = null;
    let compiledMessagingRules = null;
    let roleViews = null;
    let compiledIdentityArtifact = null;
    let accessibilityGateReport = null;
    let identityArtifactWrite = null;
    let tokenContractCompilation = null;
    let componentContractCompilation = null;
    let designSystemDiagnostics = [];
    let designSystemArtifactWrite = null;
    let starterDescriptorResult = null;
    let roleHandoffPackResult = null;
    let nextjsHandoffDiagnostics = [];
    let starterArtifactWrite = null;
    let publishReadiness = {
      status: 'not_evaluated',
      blocked: false,
      reason_codes: [],
      diagnostics: [],
    };
    const brandExecutionContext = buildExecutionContext(req, slug || 'submit');
    
    if (seed.brand_input && typeof seed.brand_input === 'object') {
      try {
        // Call normalization pipeline (D-04: hybrid normalization with canonical fingerprints)
        brandNormalizationResult = normalizeBrandInput(brandExecutionContext.tenant_id, seed.brand_input);
        
        // Verify determinism on same input (replay stability check)
        const determinismCheck = verifyDeterminism(brandExecutionContext.tenant_id, seed.brand_input);
        
        // Write normalized segments into evidence graph (D-06: tenant-safe idempotent upserts)
        if (brandNormalizationResult) {
          brandGraphResult = await upsertNormalizedSegments(
            brandExecutionContext.tenant_id,
            brandNormalizationResult
          );

          // Phase 74: deterministic strategy synthesis + explicit conflict annotations + tenant-safe persistence.
          strategySynthesisResult = synthesizeStrategyArtifact(
            brandExecutionContext.tenant_id,
            brandNormalizationResult
          );
          strategySynthesisResult.artifact.conflict_annotations = detectContradictions(
            strategySynthesisResult.artifact,
            { ruleset_version: strategySynthesisResult.metadata.ruleset_version }
          );
          compiledMessagingRules = compileMessagingRules(
            strategySynthesisResult.artifact,
            seed.messaging_rules,
            { ruleset_version: strategySynthesisResult.metadata.ruleset_version }
          );
          roleViews = projectRoleViews(strategySynthesisResult, compiledMessagingRules);
          strategyPersistenceResult = persistStrategyArtifact(
            brandExecutionContext.tenant_id,
            strategySynthesisResult
          );

          // Phase 75: deterministic identity compilation and publish accessibility gating.
          compiledIdentityArtifact = compileIdentityArtifact(strategySynthesisResult);
          accessibilityGateReport = evaluateAccessibilityGates(compiledIdentityArtifact);
          identityArtifactWrite = persistIdentityArtifact(
            brandExecutionContext.tenant_id,
            compiledIdentityArtifact
          );

          tokenContractCompilation = compileTokenContract(
            strategySynthesisResult,
            compiledIdentityArtifact
          );
          componentContractCompilation = compileComponentContractManifest({
            token_contract: tokenContractCompilation.token_contract,
            strategy_result: strategySynthesisResult,
            identity_result: compiledIdentityArtifact,
            semantic_intent: resolveDesignSystemSemanticIntent(seed),
          });

          designSystemDiagnostics = []
            .concat(Array.isArray(tokenContractCompilation.diagnostics) ? tokenContractCompilation.diagnostics : [])
            .concat(Array.isArray(componentContractCompilation.diagnostics) ? componentContractCompilation.diagnostics : []);

          if (tokenContractCompilation.token_contract && componentContractCompilation.component_contract_manifest) {
            designSystemArtifactWrite = persistDesignSystemArtifacts(
              brandExecutionContext.tenant_id,
              {
                token_contract: tokenContractCompilation.token_contract,
                token_contract_metadata: tokenContractCompilation.metadata,
                component_contract_manifest: componentContractCompilation.component_contract_manifest,
                component_contract_metadata: componentContractCompilation.metadata,
              }
            );

            starterDescriptorResult = compileStarterDescriptor({
              strategy_result: strategySynthesisResult,
              identity_result: compiledIdentityArtifact,
              token_contract: tokenContractCompilation.token_contract,
              component_contract_manifest: componentContractCompilation.component_contract_manifest,
            });

            if (starterDescriptorResult && starterDescriptorResult.starter_descriptor) {
              roleHandoffPackResult = projectRoleHandoffPacks(
                starterDescriptorResult.starter_descriptor,
                {
                  ruleset_version: starterDescriptorResult.metadata
                    ? starterDescriptorResult.metadata.ruleset_version
                    : undefined,
                }
              );
            } else {
              roleHandoffPackResult = {
                role_pack_contract: null,
                metadata: {
                  ruleset_version: starterDescriptorResult
                    && starterDescriptorResult.metadata
                    && starterDescriptorResult.metadata.ruleset_version
                    ? starterDescriptorResult.metadata.ruleset_version
                    : null,
                  deterministic_fingerprint: null,
                },
                diagnostics: [],
              };
            }

            nextjsHandoffDiagnostics = []
              .concat(Array.isArray(starterDescriptorResult && starterDescriptorResult.diagnostics)
                ? starterDescriptorResult.diagnostics
                : [])
              .concat(Array.isArray(roleHandoffPackResult && roleHandoffPackResult.diagnostics)
                ? roleHandoffPackResult.diagnostics
                : []);

            if (
              starterDescriptorResult
              && starterDescriptorResult.starter_descriptor
              && roleHandoffPackResult
              && roleHandoffPackResult.role_pack_contract
            ) {
              starterArtifactWrite = persistStarterArtifacts(
                brandExecutionContext.tenant_id,
                {
                  starter_descriptor: starterDescriptorResult.starter_descriptor,
                  starter_metadata: starterDescriptorResult.metadata,
                  role_handoff_packs: roleHandoffPackResult.role_pack_contract,
                  role_handoff_metadata: roleHandoffPackResult.metadata,
                }
              );
            }
          }

          const blockedDiagnostics = (accessibilityGateReport.diagnostics || []).filter(
            (entry) => entry && entry.blocking
          );
          const diagnostics = blockedDiagnostics.length > 0
            ? blockedDiagnostics
            : (accessibilityGateReport.diagnostics || []);
          const reasonCodes = [...new Set(diagnostics
            .map((entry) => entry && entry.reason_code)
            .filter((code) => typeof code === 'string' && code.length > 0))]
            .sort((a, b) => a.localeCompare(b));

          publishReadiness = {
            status: accessibilityGateReport.gate_status === 'blocked' ? 'blocked' : 'ready',
            blocked: accessibilityGateReport.gate_status === 'blocked',
            reason_codes: reasonCodes,
            diagnostics,
          };

        }
        
        console.log(`✓ Phase 73: Brand input normalized for tenant ${brandExecutionContext.tenant_id}`);
        console.log(`  Determinism verified: ${determinismCheck.match ? 'PASS' : 'FAIL'}`);
        console.log(`  Graph writes: ${brandGraphResult?.segments_upserted?.length || 0} segments, ${brandGraphResult?.edges_created?.length || 0} edges`);
        console.log(`  Phase 74 strategy artifact: ${strategyPersistenceResult?.artifact_id || 'not-written'}`);
      } catch (brandErr) {
        console.error('Phase 73 brand normalization error:', redactSensitive(brandErr.message));
        // Don't fail the submission on brand normalization error - log it but continue
        brandNormalizationResult = null;
        brandGraphResult = null;
        strategySynthesisResult = null;
        strategyPersistenceResult = null;
        compiledIdentityArtifact = null;
        identityArtifactWrite = null;
        tokenContractCompilation = null;
        componentContractCompilation = null;
        designSystemDiagnostics = [];
        designSystemArtifactWrite = null;
        starterDescriptorResult = null;
        roleHandoffPackResult = null;
        nextjsHandoffDiagnostics = [];
        starterArtifactWrite = null;
        accessibilityGateReport = {
          gate_status: 'blocked',
          checks: [],
          diagnostics: [
            {
              check_id: 'identity.pipeline',
              required_ratio: null,
              observed_ratio: null,
              blocking: true,
              message: 'Identity compilation and accessibility gate evaluation failed',
              reason_code: 'IDENTITY_PIPELINE_ERROR',
            },
          ],
        };
        publishReadiness = {
          status: 'blocked',
          blocked: true,
          reason_codes: ['IDENTITY_PIPELINE_ERROR'],
          diagnostics: accessibilityGateReport.diagnostics,
        };
      }
    }

    // Determine slug
    const crypto = require('crypto');
    let querySlug = null;
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      querySlug = parsedUrl.searchParams.get('project_slug') || parsedUrl.searchParams.get('client');
    } catch {
      querySlug = null;
    }
    const requestedSlug = resolveRequestedProjectSlug({
      explicitSlug: body.project_slug,
      requestUrl: req.url,
      config: runtime.config,
      companyName: seed.company?.name || '',
    });
    slug = requestedSlug;

    const projectQuotaCheck = evaluateQuotaDimensionAccess(buildExecutionContext(req, requestedSlug || 'submit'), 'projects', {
      action: 'create_project',
      requested_delta: 1,
    });
    if (!projectQuotaCheck.allowed) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 403,
        runtimeMode: runtime.mode,
        projectSlug: slug,
      });
      return json(res, 403, {
        success: false,
        error: projectQuotaCheck.reason_code || 'PROJECT_CAP_EXCEEDED',
        message: 'Project creation blocked by billing quota',
        outcome: {
          state: 'blocked',
          code: projectQuotaCheck.reason_code || 'PROJECT_CAP_EXCEEDED',
          message: 'Project creation blocked by billing quota',
        },
      });
    }

    if (!body.project_slug && !querySlug) {
      slug = `${requestedSlug}-${crypto.randomUUID().slice(0, 8)}`;
    }

    slug = resolveProjectSlug(runtime, slug);

    const linearTickets = await autoCreateLinearIntakeTickets({
      slug,
      phase: '34',
      seed,
    });

    let seedPath = null;
    if (runtime.canWriteLocalFiles) {
      const outputPath = resolveSeedOutputPath(runtime.config);
      fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2));
      console.log(`\n✓ onboarding-seed.json written to: ${outputPath}`);
      seedPath = outputPath;
    }

    console.log('\n🤖 Running MarkOS AI draft generation for:', slug);
    const orchestrator = require('./agents/orchestrator.cjs');
    const executionContext = buildExecutionContext(req, slug);
    const { drafts, vectorStoreResults, errors } = await orchestrator.orchestrate(seed, slug, executionContext);

    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'success',
      statusCode: 200,
      runtimeMode: runtime.mode,
      projectSlug: slug,
    });

      // Phase 43 LIT-13 / LIT-15: evaluate literacy readiness and emit activation telemetry.
      // Inline require ensures withMockedModule patches are picked up at call time.
      const { evaluateLiteracyReadiness } = require('./literacy/activation-readiness.cjs');
      const literacyResult = await evaluateLiteracyReadiness(seed, runtime.config);

      if (telemetry && typeof telemetry.capture === 'function') {
        telemetry.capture('literacy_activation_observed', {
          readiness_status: literacyResult.readiness,
          disciplines_available: literacyResult.disciplines_available,
          disciplines_missing: literacyResult.gaps,
          business_model: String(seed && seed.product ? (seed.product.business_model || '') : ''),
          pain_point_count: Array.isArray(seed && seed.audience ? seed.audience.pain_points : null)
            ? seed.audience.pain_points.length : 0,
        });
      }

      // Phase 78: Governance artifact emission — additive integration per D-07, D-08, D-09
      let brandingGovernanceResult = { error: 'governance_unavailable', machine_readable: true };
      try {
        const tenantId = brandExecutionContext.tenant_id;

        // Phase 79: metadata-first lineage handoff (D-01, D-02, D-03)
        const canonicalArtifacts = buildCanonicalArtifactsFromWrites({
          strategyPersistenceResult,
          identityArtifactWrite,
          designSystemArtifactWrite,
          starterArtifactWrite,
        });

        // Create governance lineage bundle (immutable, tenant-scoped per D-06)
        const bundleResult = createBundle(tenantId, canonicalArtifacts);
        if (bundleResult.denied) {
          console.warn(`[Phase 78] Bundle creation denied: ${bundleResult.reason_code}`);
          brandingGovernanceResult = {
            error: 'bundle_creation_denied',
            reason_code: bundleResult.reason_code,
            machine_readable: true,
          };
        } else {
          const bundle = bundleResult;

          // Run closure gates (determinism, tenant isolation, contract integrity per D-05, D-06)
          const gateResults = runClosureGates(tenantId, bundle, {});

          const closeoutVerification = verifyGovernanceCloseout({
            tenant_id: tenantId,
            artifact_id: bundle.bundle_id,
            retrieval_mode: 'manage',
            run_id: `closeout-${String(bundle.bundle_id || '').slice(0, 16)}`,
            actor_role: 'system',
            expected_evidence_ref: gateResults.passed ? `bundle://${bundle.bundle_id}` : '',
            observed_evidence_ref: `bundle://${bundle.bundle_id}`,
            reasoning_trace: gateResults.passed
              ? 'runtime closeout verification passed and closure can proceed'
              : '',
          });

          if (!closeoutVerification.ok) {
            brandingGovernanceResult = {
              error: closeoutVerification.error,
              machine_readable: true,
              governance: {
                code: closeoutVerification.code,
                message: closeoutVerification.message,
              },
              verification: closeoutVerification.verification,
            };
          } else {
            // Audit drift against active pointer per D-04, D-08
            const driftSummary = auditDrift(tenantId, canonicalArtifacts);

            // Write governance evidence envelope (deterministic, machine-readable per D-08, D-10)
            const evidenceEnvelope = writeGovernanceEvidence(tenantId, bundle.bundle_id, gateResults, driftSummary);

            // Set verification evidence hash on bundle registry (rollback enablement per D-03)
            setVerificationEvidence(tenantId, bundle.bundle_id, evidenceEnvelope.evidence_hash);

            const closurePersistence = await emitRuntimeClosureEvidence({
              phase: '89',
              tenant_id: tenantId,
              bundle_id: bundle.bundle_id,
              actor_role: 'system',
              gate_results: gateResults,
              closeout_verification: closeoutVerification,
              require_durable_persistence: shouldRequireDurableClosurePersistence(),
            });

            if (!closurePersistence.ok) {
              brandingGovernanceResult = {
                error: closurePersistence.error,
                machine_readable: true,
                governance: {
                  code: closurePersistence.code,
                  message: closurePersistence.message,
                },
                closure: closurePersistence.closure,
                verification: closeoutVerification.verification,
              };
            } else {
              brandingGovernanceResult = {
                ...evidenceEnvelope,
                verification: closeoutVerification.verification,
                closure: {
                  bundle_hash: closurePersistence.closure.bundle_hash,
                  bundle_locator: closurePersistence.closure.bundle_locator,
                  bundle_path: closurePersistence.closure.bundle_path,
                  written_at: closurePersistence.closure.written_at,
                },
              };
            }
          }
          console.log(`✓ Phase 78 governance: bundle ${bundle.bundle_id.slice(0, 8)}... verified for tenant ${tenantId}`);
        }
      } catch (govErr) {
        console.error('[Phase 78] Governance error:', redactSensitive(govErr.message));
        // Governance errors do not fail the submission per D-07 (fallback gracefully)
        brandingGovernanceResult = { error: 'governance_unavailable', machine_readable: true };
      }

      json(res, 200, {
        success: true,
        seed_path: seedPath,
        slug,
        validation: {
          applied: applyStrictValidation,
          valid: true,
          failed_rules: [],
        },
        linear_tickets: linearTickets.created || [],
        linear_skipped: linearTickets.skipped || [],
        linear_error: linearTickets.error || null,
        drafts,
        session_url: `http://localhost:${runtime.config?.port || 4242}/?slug=${encodeURIComponent(slug)}`,
        vector_store: vectorStoreResults,
        errors,
        literacy: {
          readiness: literacyResult.readiness,
          disciplines_available: literacyResult.disciplines_available,
          gaps: literacyResult.gaps,
        },
        // Phase 73: Brand normalization and graph results (D-04, D-06)
        brand_normalization: brandNormalizationResult ? {
          content_fingerprint: brandNormalizationResult.content_fingerprint,
          normalized_segments_count: brandNormalizationResult.normalized_segments.length,
        } : null,
        brand_graph_writes: brandGraphResult ? {
          profile_upserted: brandGraphResult.profile_upserted,
          segments_upserted_count: brandGraphResult.segments_upserted.length,
          edges_created_count: brandGraphResult.edges_created.length,
        } : null,
        strategy_artifact: strategySynthesisResult ? strategySynthesisResult.artifact : null,
        strategy_artifact_metadata: strategySynthesisResult ? strategySynthesisResult.metadata : null,
        messaging_rules_compiled: compiledMessagingRules,
        role_views: roleViews,
        strategy_artifact_write: strategyPersistenceResult,
        identity_artifact: compiledIdentityArtifact ? compiledIdentityArtifact.artifact : null,
        identity_artifact_metadata: compiledIdentityArtifact ? compiledIdentityArtifact.metadata : null,
        identity_artifact_write: identityArtifactWrite,
        token_contract: tokenContractCompilation ? tokenContractCompilation.token_contract : null,
        token_contract_metadata: tokenContractCompilation ? tokenContractCompilation.metadata : null,
        component_contract_manifest: componentContractCompilation ? componentContractCompilation.component_contract_manifest : null,
        component_contract_metadata: componentContractCompilation ? componentContractCompilation.metadata : null,
        design_system_diagnostics: designSystemDiagnostics,
        design_system_artifact_write: designSystemArtifactWrite,
        nextjs_starter_descriptor: starterDescriptorResult ? starterDescriptorResult.starter_descriptor : null,
        nextjs_starter_descriptor_metadata: starterDescriptorResult ? starterDescriptorResult.metadata : null,
        role_handoff_packs: roleHandoffPackResult ? roleHandoffPackResult.role_pack_contract : null,
        role_handoff_packs_metadata: roleHandoffPackResult ? roleHandoffPackResult.metadata : null,
        nextjs_handoff_diagnostics: nextjsHandoffDiagnostics,
        nextjs_starter_artifact_write: starterArtifactWrite,
        accessibility_gate_report: accessibilityGateReport,
        publish_readiness: publishReadiness,
        // Phase 78: Machine-readable governance evidence envelope (D-08, D-10) — additive only, no existing fields mutated per D-07, D-09
        branding_governance: brandingGovernanceResult,
      });
  } catch (err) {
    console.error('[POST /submit] Error:', redactSensitive(err.message));
    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'failure',
      statusCode: 500,
      runtimeMode: runtime.mode,
      projectSlug: slug,
    });
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleRegenerate(req, res) {
  try {
    // Phase 51-03: Action-level IAM authorization check
    const authCheck = checkActionAuthorization('execute_task', req);
    if (!authCheck.authorized) {
      return json(res, authCheck.statusCode, {
        success: false,
        error: 'AUTHORIZATION_DENIED',
        message: authCheck.reason,
        outcome: {
          state: 'failure',
          code: 'AUTHORIZATION_DENIED',
          message: authCheck.reason,
        },
      });
    }

    const entitlementCheck = assertEntitledAction(buildExecutionContext(req, 'regenerate'), 'execute_task');
    if (!entitlementCheck.allowed) {
      return json(res, 403, {
        success: false,
        error: entitlementCheck.reason_code || 'BILLING_POLICY_BLOCKED',
        message: 'Action blocked by billing policy',
        outcome: {
          state: 'blocked',
          code: entitlementCheck.reason_code || 'BILLING_POLICY_BLOCKED',
          message: 'Action blocked by billing policy',
        },
      });
    }

    const runtime = createRuntimeContext();
    const vectorStore = require('./vector-store-client.cjs');
    vectorStore.configure(runtime.config);
    const { section, seed, slug } = await readBody(req);
    const mirFiller = require('./agents/mir-filler.cjs');
    const mspFiller = require('./agents/msp-filler.cjs');
    
    const generators = {
      company_profile: () => mirFiller.generateCompanyProfile(seed, buildRuntimeLLMOptions(req, slug, 'company_profile')),
      mission_values: () => mirFiller.generateMissionVisionValues(seed, buildRuntimeLLMOptions(req, slug, 'mission_values')),
      audience: () => mirFiller.generateAudienceProfile(seed, buildRuntimeLLMOptions(req, slug, 'audience')),
      competitive: () => mirFiller.generateCompetitiveLandscape(seed, buildRuntimeLLMOptions(req, slug, 'competitive')),
      brand_voice: () => mspFiller.generateBrandVoice(seed, slug, buildRuntimeLLMOptions(req, slug, 'brand_voice')),
      channel_strategy: () => mspFiller.generateChannelStrategy(seed, slug, buildRuntimeLLMOptions(req, slug, 'channel_strategy')),
    };

    if (!generators[section]) {
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        reason: 'unknown_regenerate_section',
        section,
      });
      return json(res, 400, { error: `Unknown section: ${section}` });
    }

    const result = await generators[section]();
    let persistenceWarning = null;
    if (result.ok && slug) {
      const storeResult = await vectorStore.storeDraft(slug, section, result.text);
      if (storeResult && storeResult.ok === false) {
        persistenceWarning = `Failed to persist regenerated-${section}: ${storeResult.error || 'Unknown vector persistence error'}`;
      }
    }

    if (!result.ok) {
      telemetry.captureExecutionCheckpoint('execution_failure', {
        checkpoint: 'regenerate',
        section,
        reason: result.error || 'unknown_regenerate_failure',
      });
      return json(res, 502, {
        success: false,
        content: result.text,
        error: result.error,
        outcome: createOutcome('failure', 'REGENERATE_FAILED', 'Section regeneration failed.', {
          errors: [result.error || 'Unknown regenerate failure'],
        }),
      });
    }

    if (result.isFallback) {
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        reason: 'regenerate_fallback',
        section,
      });
      const warnings = [result.error || 'Provider unavailable; fallback content returned'];
      if (persistenceWarning) warnings.push(persistenceWarning);
      return json(res, 200, {
        success: true,
        content: result.text,
        error: result.error,
        outcome: createOutcome('degraded', 'REGENERATE_FALLBACK', 'Section regenerated using fallback content.', {
          fallback: true,
          warnings,
        }),
      });
    }

    if (persistenceWarning) {
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        reason: 'regenerate_persistence_warning',
        section,
      });
      return json(res, 200, {
        success: true,
        content: result.text,
        error: null,
        outcome: createOutcome('warning', 'REGENERATE_PERSIST_WARNING', 'Section regenerated but persistence warning occurred.', {
          warnings: [persistenceWarning],
        }),
      });
    }

    json(res, 200, {
      success: true,
      content: result.text,
      error: null,
      outcome: createOutcome('success', 'REGENERATE_OK', 'Section regenerated successfully.'),
    });
  } catch (err) {
    telemetry.captureExecutionCheckpoint('execution_failure', {
      checkpoint: 'regenerate',
      reason: err.message,
    });
    json(res, 500, {
      success: false,
      error: err.message,
      outcome: createOutcome('failure', 'REGENERATE_EXCEPTION', 'Unhandled regenerate failure.', {
        errors: [err.message],
      }),
    });
  }
}

async function handleApprove(req, res) {
  const startedAt = Date.now();
  const endpoint = '/approve';
  let projectSlug = null;
  let runtimeMode = 'unknown';
  try {
    const {
      approvedDrafts,
      slug,
      run_id,
      run_state,
      decision,
      rationale,
    } = await readBody(req);

    const runtime = createRuntimeContext();
    runtimeMode = runtime.mode;
    const secretCheck = validateRequiredSecrets({
      runtimeMode: runtime.mode,
      operation: 'approve_write',
      env: process.env,
    });
    if (!secretCheck.ok) {
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 503,
        runtimeMode,
        projectSlug,
      });
      return json(res, 503, {
        success: false,
        error: 'REQUIRED_SECRET_MISSING',
        message: `Missing required runtime secret(s): ${secretCheck.missing.join(', ')}`,
      });
    }

    if (!runtime.canWriteLocalFiles) {
      telemetry.captureExecutionCheckpoint('execution_failure', {
        checkpoint: 'approve',
        reason: 'LOCAL_PERSISTENCE_UNAVAILABLE',
      });
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 501,
        runtimeMode,
        projectSlug,
      });
      return json(res, 501, {
        success: false,
        error: 'LOCAL_PERSISTENCE_UNAVAILABLE',
        message: 'Approve/write flows require local filesystem access. Use the local onboarding server to persist approved drafts.',
        outcome: createOutcome('failure', 'LOCAL_PERSISTENCE_UNAVAILABLE', 'Approve/write flows require local filesystem access.', {
          errors: ['Approve/write flows require local filesystem access.'],
        }),
      });
    }

    const vectorStore = require('./vector-store-client.cjs');
    vectorStore.configure(runtime.config);

    projectSlug = resolveProjectSlug(
      runtime,
      slug || resolveRequestedProjectSlug({
        explicitSlug: slug,
        requestUrl: req.url,
        config: runtime.config,
      })
    );

    const approvalContext = buildExecutionContext(req, projectSlug || slug || 'approval');
    const hasApprovalGateMetadata = [run_id, run_state, decision, rationale]
      .some((value) => value !== undefined && value !== null && String(value).length > 0);
    const requiresApprovalGate = runtime.mode === 'hosted' || Boolean(req && req.markosAuth) || hasApprovalGateMetadata;

    if (requiresApprovalGate) {
      const runId = String(run_id || `approve-${projectSlug || 'unknown'}`);
      const runState = String(run_state || '');

      try {
        assertAwaitingApproval({ run_id: runId, state: runState });
      } catch (approvalErr) {
        emitRolloutEndpointTelemetry({
          endpoint,
          startedAt,
          outcomeState: 'failure',
          statusCode: 409,
          runtimeMode,
          projectSlug,
        });
        return json(res, 409, {
          success: false,
          error: 'AGENT_RUN_NOT_AWAITING_APPROVAL',
          message: approvalErr.message,
          outcome: createOutcome('failure', 'AGENT_RUN_NOT_AWAITING_APPROVAL', approvalErr.message, {
            errors: [approvalErr.message],
          }),
        });
      }

      const decisionResult = recordApprovalDecision({
        run_id: runId,
        tenant_id: approvalContext.tenant_id,
        state: runState,
        actor_id: approvalContext.actor_id,
        actor_role: approvalContext.role,
        action: decision || 'approved',
        rationale: rationale || null,
        correlation_id: approvalContext.correlation_id || approvalContext.request_id,
        decisionStore: approvalDecisionStore,
        authorizationCheck: (roleOverride) => {
          if (!(req && req.markosAuth) && runtime.mode !== 'hosted') {
            return { authorized: true, reason: null, statusCode: 200 };
          }

          const principal = req && req.markosAuth ? req.markosAuth : {};
          const authReq = {
            ...req,
            markosAuth: {
              ...principal,
              iamRole: roleOverride,
              role: roleOverride,
            },
          };
          return checkActionAuthorization('approve_task', authReq);
        },
        buildDenyEvent,
        emitDenyTelemetry,
      });

      if (!decisionResult.ok) {
        const statusCode = decisionResult.statusCode || 403;
        emitRolloutEndpointTelemetry({
          endpoint,
          startedAt,
          outcomeState: 'failure',
          statusCode,
          runtimeMode,
          projectSlug,
        });

        return json(res, statusCode, {
          success: false,
          error: decisionResult.error || 'APPROVAL_DECISION_DENIED',
          message: decisionResult.message || 'Approval decision denied.',
          deny_event: decisionResult.deny_event || null,
          outcome: createOutcome('failure', decisionResult.error || 'APPROVAL_DECISION_DENIED', decisionResult.message || 'Approval decision denied.'),
        });
      }
    }

    let approvalWrite;
    try {
      approvalWrite = writeApprovedDrafts({
        config: runtime.config,
        projectSlug,
        approvedDrafts: approvedDrafts || {},
      });
    } catch (pathErr) {
      telemetry.captureExecutionCheckpoint('execution_failure', {
        checkpoint: 'approve',
        reason: pathErr.message,
      });
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 400,
        runtimeMode,
        projectSlug,
      });
      return json(res, 400, {
        success: false,
        error: pathErr.message,
        message: 'Approve/write target path is outside the canonical vault root.',
        outcome: createOutcome('failure', 'CANONICAL_VAULT_PATH_OUT_OF_BOUNDS', 'Approve/write target path is outside the canonical vault root.', {
          errors: [pathErr.message],
        }),
      });
    }

    const written = approvalWrite.written;
    const stateUpdated = false;
    const mergeEvents = [];
    const report = writeRunReport({
      config: runtime.config,
      projectSlug,
      mode: 'onboarding_approve',
      surface: 'browser',
      items: approvalWrite.items,
      legacyRoots: [
        runtime.config?.legacy_outputs?.mir?.output_path || '.markos-local/MIR',
        runtime.config?.legacy_outputs?.msp?.output_path || '.markos-local/MSP',
      ],
    });

    console.log(`\n✓ Vault notes written: ${written.join(', ')}`);
    console.log(`  Report note: ${report.report_note_path}`);

    const vectorStoreErrors = [];
    for (const [section, content] of Object.entries(approvedDrafts)) {
      try {
        const storeResult = await vectorStore.storeDraft(projectSlug, `approved-${section}`, content);
        if (storeResult && storeResult.ok === false) {
          vectorStoreErrors.push(`Failed to persist approved-${section}: ${storeResult.error || 'Unknown vector persistence error'}`);
        }
      } catch (storeErr) {
        vectorStoreErrors.push(`Failed to persist approved-${section}: ${storeErr.message}`);
      }
    }

    const writeWarnings = approvalWrite.items.flatMap((item) => {
      const warnings = [];
      if (item.outcome === 'blocked') {
        warnings.push(`${item.source_key}: ${item.reason || 'blocked'}`);
      }
      if (item.outcome === 'skipped') {
        warnings.push(`${item.source_key}: ${item.reason || 'skipped'}`);
      }
      if (Array.isArray(item.warnings)) {
        warnings.push(...item.warnings.map((warning) => `${item.source_key}: ${warning}`));
      }
      return warnings;
    });
    const combinedErrors = [...approvalWrite.errors, ...vectorStoreErrors];

    if (written.length === 0) {
      telemetry.captureExecutionCheckpoint('execution_failure', {
        checkpoint: 'approve',
        reason: 'APPROVE_WRITE_FAILED',
      });
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'failure',
        statusCode: 500,
        runtimeMode,
        projectSlug,
      });
      return json(res, 500, {
        success: false,
        written,
        stateUpdated,
        errors: combinedErrors,
        mergeEvents,
        report_note_path: report.report_note_path,
        canonical_notes_written: written.length,
        note_outcomes: approvalWrite.items,
        outcome: createOutcome('failure', 'APPROVE_WRITE_FAILED', 'No drafts were written to canonical vault notes.', {
          errors: combinedErrors.length > 0 ? combinedErrors : ['No files were written'],
        }),
      });
    }

    let skeletonsSummary = { generated: [], failed: [] };
    let packSelection = null; // Phase 109 — declared here so both json() calls outside the try can read it
    try {
      let seed = {};
      if (fs.existsSync(SEED_PATH)) {
        seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
      }

      // Phase 109: resolve pack selection and persist to seed (D-01, D-02, D-06, D-08) ─────────
      try {
        packSelection = resolvePackSelection(seed);
        seed.packSelection = packSelection; // D-08: written as-is, no transformation
      } catch (resolveErr) {
        console.warn('[POST /approve] resolvePackSelection failed:', resolveErr.message);
        // packSelection remains null; seed.packSelection not set; continue (D-06)
      }

      if (packSelection !== null) {
        try {
          fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), 'utf8'); // D-02
        } catch (writeErr) {
          console.warn('[POST /approve] Failed to persist packSelection to seed:', writeErr.message);
          // Non-fatal — approval continues without persisted packSelection (D-06)
        }
      }
      // End Phase 109 ────────────────────────────────────────────────────────────────────────────

      const skeletonResults = await generateSkeletons(seed, approvedDrafts, undefined, undefined, packSelection); // Phase 109
      skeletonsSummary = skeletonResults.reduce(
        (accumulator, result) => {
          if (Array.isArray(result.files) && result.files.length > 0) {
            accumulator.generated.push(...result.files);
          }
          if (result.error) {
            accumulator.failed.push(result.discipline);
          }
          return accumulator;
        },
        { generated: [], failed: [] }
      );
    } catch (_error) {
      skeletonsSummary = { generated: [], failed: ['all'] };
    }

    const readiness = buildExecutionReadiness(approvedDrafts || {});
    const onboardingCompleted = written.length > 0;

    if (combinedErrors.length > 0 || writeWarnings.length > 0) {
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        checkpoint: 'approve',
        project_slug: projectSlug,
        reason: 'APPROVE_PARTIAL_WARNING',
        blocking_count: readiness.blocking_checks.length,
      });
      emitRolloutEndpointTelemetry({
        endpoint,
        startedAt,
        outcomeState: 'warning',
        statusCode: 200,
        runtimeMode,
        projectSlug,
      });
      return json(res, 200, {
        success: true,
        written,
        stateUpdated,
        errors: combinedErrors,
        mergeEvents,
        report_note_path: report.report_note_path,
        canonical_notes_written: written.length,
        note_outcomes: approvalWrite.items,
        handoff: {
          onboarding_completed: onboardingCompleted,
          execution_readiness: readiness,
        },
        skeletons: skeletonsSummary,
        packSelection: packSelection,        // Phase 109 — null if resolution failed (D-07)
        outcome: createOutcome('warning', 'APPROVE_PARTIAL_WARNING', 'Drafts were written with warnings.', {
          warnings: [...writeWarnings, ...combinedErrors],
        }),
      });
    }

    telemetry.captureExecutionCheckpoint('approval_completed', {
      checkpoint: 'approve',
      project_slug: projectSlug,
      written_count: written.length,
    });
    telemetry.captureExecutionCheckpoint(
      readiness.status === 'ready' ? 'execution_readiness_ready' : 'execution_readiness_blocked',
      {
        checkpoint: 'approve',
        project_slug: projectSlug,
        blocking_count: readiness.blocking_checks.length,
      }
    );
    if (readiness.status === 'ready') {
      telemetry.captureExecutionCheckpoint('execution_loop_completed', {
        checkpoint: 'approve',
        project_slug: projectSlug,
      });
    }

    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'success',
      statusCode: 200,
      runtimeMode,
      projectSlug,
    });

    return json(res, 200, {
      success: true,
      written,
      stateUpdated,
      errors: [],
      mergeEvents,
      report_note_path: report.report_note_path,
      canonical_notes_written: written.length,
      note_outcomes: approvalWrite.items,
      handoff: {
        onboarding_completed: onboardingCompleted,
        execution_readiness: readiness,
      },
      skeletons: skeletonsSummary,
      packSelection: packSelection,        // Phase 109 — null if resolution failed (D-07)
      outcome: createOutcome('success', 'APPROVE_OK', 'Drafts were written successfully.'),
    });
  } catch (err) {
    console.error('[POST /approve] Error:', redactSensitive(err.message));
    telemetry.captureExecutionCheckpoint('execution_failure', {
      checkpoint: 'approve',
      reason: err.message,
    });
    emitRolloutEndpointTelemetry({
      endpoint,
      startedAt,
      outcomeState: 'failure',
      statusCode: 500,
      runtimeMode,
      projectSlug,
    });
    json(res, 500, {
      success: false,
      error: err.message,
      outcome: createOutcome('failure', 'APPROVE_EXCEPTION', 'Unhandled approve failure.', {
        errors: [err.message],
      }),
    });
  }
}

async function handleImporterScan(req, res) {
  const runtime = createRuntimeContext();
  if (!runtime.canWriteLocalFiles) {
    return createImporterUnavailableResponse(
      res,
      'Legacy import requires the local onboarding server because it must scan local MIR and MSP files.'
    );
  }

  try {
    const body = await readBody(req);
    const explicitSlug = body?.slug || body?.project_slug;
    const projectSlug = resolveProjectSlug(
      runtime,
      explicitSlug || resolveRequestedProjectSlug({
        explicitSlug,
        requestUrl: req.url,
        config: runtime.config,
      })
    );

    const plan = planImport({
      config: runtime.config,
      projectSlug,
    });
    const items = normalizeImportItems(plan.items || []);
    const totals = summarizeImporterItems(items);
    const hasBlocked = totals.blocked > 0;
    const hasWarnings = totals.imported_with_warnings > 0;

    return json(res, 200, {
      success: true,
      slug: projectSlug,
      phase: 'scan',
      legacy_roots: plan.legacy_roots,
      items,
      totals,
      legacy_files_preserved: true,
      report_note_path: null,
      outcome: createOutcome(
        hasBlocked || hasWarnings ? 'warning' : 'success',
        hasBlocked || hasWarnings ? 'IMPORT_SCAN_REVIEW_REQUIRED' : 'IMPORT_SCAN_READY',
        hasBlocked || hasWarnings
          ? 'Legacy scan completed. Review warnings and blocked items before applying import.'
          : 'Legacy scan completed. Import plan is ready to apply.'
      ),
    });
  } catch (err) {
    return json(res, 500, {
      success: false,
      error: err.message,
      outcome: createOutcome('failure', 'IMPORT_SCAN_EXCEPTION', 'Legacy import scan failed.', {
        errors: [err.message],
      }),
    });
  }
}

async function handleImporterApply(req, res) {
  const runtime = createRuntimeContext();
  if (!runtime.canWriteLocalFiles) {
    return createImporterUnavailableResponse(
      res,
      'Legacy import requires the local onboarding server because it must read legacy files and write canonical vault notes.'
    );
  }

  try {
    const body = await readBody(req);
    const explicitSlug = body?.slug || body?.project_slug;
    const projectSlug = resolveProjectSlug(
      runtime,
      explicitSlug || resolveRequestedProjectSlug({
        explicitSlug,
        requestUrl: req.url,
        config: runtime.config,
      })
    );

    const plan = planImport({
      config: runtime.config,
      projectSlug,
    });
    const applied = applyImportPlan({
      config: runtime.config,
      projectSlug,
      plan,
      surface: 'browser',
    });
    const items = normalizeImportItems(applied.items || []);
    const totals = summarizeImporterItems(items);
    const warnings = items.flatMap((item) => {
      const itemWarnings = Array.isArray(item.warnings) ? item.warnings.map((warning) => `${item.source_path || item.source_key}: ${warning}`) : [];
      if (item.outcome === 'blocked' && item.reason) {
        itemWarnings.unshift(`${item.source_path || item.source_key}: ${item.reason}`);
      }
      return itemWarnings;
    });
    const hasReviewItems = totals.blocked > 0 || totals.imported_with_warnings > 0;

    return json(res, 200, {
      success: true,
      slug: projectSlug,
      phase: 'apply',
      legacy_roots: applied.legacy_roots,
      items,
      totals,
      legacy_files_preserved: true,
      report_note_path: applied.report_note_path,
      outcome: createOutcome(
        hasReviewItems ? 'warning' : 'success',
        hasReviewItems ? 'IMPORT_APPLY_REVIEW_REQUIRED' : 'IMPORT_APPLY_OK',
        hasReviewItems
          ? 'Import applied with warnings or blocked items. Review the report note before continuing.'
          : 'Import applied successfully. Canonical vault notes and a durable report note were written.',
        warnings.length > 0 ? { warnings } : {}
      ),
    });
  } catch (err) {
    return json(res, 500, {
      success: false,
      error: err.message,
      outcome: createOutcome('failure', 'IMPORT_APPLY_EXCEPTION', 'Legacy import apply failed.', {
        errors: [err.message],
      }),
    });
  }
}

async function handleExtractSources(req, res) {
  try {
    const runtime = createRuntimeContext();
    const { IncomingForm } = require('formidable');
    const tavilyScraper = require('./scrapers/tavily-scraper.cjs');
    const pdfParser = require('./parsers/pdf-parser.cjs');
    const docxParser = require('./parsers/docx-parser.cjs');
    const csvParser = require('./parsers/csv-parser.cjs');
    const textParser = require('./parsers/text-parser.cjs');
    const form = new IncomingForm({ maxTotalFileSize: 10 * 1024 * 1024, maxFiles: 5 }); // 10MB limit

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return json(res, 400, { success: false, error: 'File upload error: ' + err.message });
      }

      const url = fields.url;
      // 1. Parallel Scraping & Parsing
      const scrapePromise = url ? tavilyScraper.scrapeDomain(url, runtime.config.tavily_api_key || process.env.TAVILY_API_KEY).catch(e => {
        console.warn(`Scrape failed for ${url}:`, e.message);
        return `--- TAVILY SCRAPE FAILED FOR ${url} ---\n(User provided URL but scraping failed: ${e.message})\n\n`;
      }) : Promise.resolve('');

      const uploadedFiles = files['files[]'] || files['files'] || [];
      const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

      const parserPromises = fileArray.map(async (file) => {
        try {
          const buffer = fs.readFileSync(file.filepath);
          const ext = path.extname(file.originalFilename).toLowerCase();
          let text = '';
          switch (ext) {
            case '.pdf':  text = await pdfParser.parsePdf(buffer); break;
            case '.docx': text = await docxParser.parseDocx(buffer); break;
            case '.csv':  text = csvParser.parseCsv(buffer); break;
            case '.txt':
            case '.md':   text = textParser.parseText(buffer); break;
          }
          return text ? `\n[File: ${file.originalFilename}]\n${text}\n` : '';
        } catch (e) {
          console.warn(`Failed to parse file ${file.originalFilename}:`, e.message);
          return '';
        }
      });

      const [webText, ...fileTexts] = await Promise.all([scrapePromise, ...parserPromises]);
      const fileText = fileTexts.join('\n').trim();

      json(res, 200, { 
        success: true, 
        webText: webText.trim(), 
        fileText: fileText
      });
    });
  } catch (err) {
    console.error('[POST /api/extract-sources] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleExtractAndScore(req, res) {
  try {
    const schemaExtractor = require('./extractors/schema-extractor.cjs');
    const confidenceScorer = require('./confidences/confidence-scorer.cjs');
    const { webText, fileText, chatText } = await readBody(req);
    // Backward compatibility for single 'text' field
    const w = webText || '';
    const f = fileText || '';
    const c = chatText || '';

    const jsonMap = await schemaExtractor.extractToSchema(w, f, c);
    
    let scoredMap = {};
    try {
      scoredMap = confidenceScorer.scoreFields(jsonMap);
    } catch (scoreErr) {
      console.error('[HANDLERS] Scorer failed:', scoreErr.message);
    }

    json(res, 200, { success: true, data: jsonMap, scores: scoredMap });
  } catch (err) {
    console.error('[POST /api/extract-and-score] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleGenerateQuestion(req, res) {
  try {
    const { getGroupingPrompt, getGroupingSystemPrompt } = require('./prompts/grouping-prompt.js');
    const llm = require('./agents/llm-adapter.cjs');
    const body = await readBody(req);
    const schema = body.schema || body.seed || {};
    const businessModel = body.businessModel || schema.company?.business_model || 'B2B';
    const scores = body.scores || {};
    const questionCount = Math.max(0, Number(body.questionCount || 0));
    
    // Helper to extract missing fields from scores
    const extractMissing = (scoresObj, prefix = '') => {
      let missing = [];
      for (const [key, meta] of Object.entries(scoresObj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (meta && typeof meta === 'object' && meta.score !== undefined) {
          if (meta.score === 'Red' || meta.score === 'Yellow') {
            missing.push(path);
          }
        } else if (meta && typeof meta === 'object') {
          missing = missing.concat(extractMissing(meta, path));
        }
      }
      return missing;
    };

    const missingFields = body.missingFields || (Object.keys(scores).length > 0 ? extractMissing(scores) : []);

    if (questionCount >= INTERVIEW_MAX_QUESTIONS) {
      return json(res, 200, {
        success: true,
        question: null,
        missingFields,
        completionReason: 'max_questions_reached',
        maxQuestions: INTERVIEW_MAX_QUESTIONS,
      });
    }

    if (!missingFields || missingFields.length === 0) {
      return json(res, 200, {
        success: true,
        question: null,
        missingFields,
        completionReason: 'missing_fields_resolved',
        maxQuestions: INTERVIEW_MAX_QUESTIONS,
      });
    }

    const userPrompt = getGroupingPrompt(businessModel, missingFields.slice(0, 3));
    const systemPrompt = getGroupingSystemPrompt();

    const llmRes = await llm.call(systemPrompt, userPrompt, { temperature: 0.6 });
    if (!llmRes.ok) throw new Error(llmRes.error);

    json(res, 200, {
      success: true,
      question: llmRes.text.trim(),
      missingFields,
      completionReason: null,
      maxQuestions: INTERVIEW_MAX_QUESTIONS,
    });
  } catch (err) {
    console.error('[POST /api/generate-question] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleParseAnswer(req, res) {
  try {
    const schemaExtractor = require('./extractors/schema-extractor.cjs');
    const confidenceScorer = require('./confidences/confidence-scorer.cjs');
    const body = await readBody(req);
    const existingData = body.existingData || body.schema || body.seed || {};
    const userAnswer   = body.userAnswer || body.answer;

    if (!existingData || !userAnswer) {
      return json(res, 400, { success: false, error: 'existingData and userAnswer (answer) required.' });
    }

    const jsonMap = await schemaExtractor.extractPartialToSchema(existingData, userAnswer);
    const scoredMap = confidenceScorer.scoreFields(jsonMap);

    json(res, 200, { success: true, data: jsonMap, updatedSchema: jsonMap, scores: scoredMap });
  } catch (err) {
    console.error('[POST /api/parse-answer] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleSparkSuggestion(req, res) {
  try {
    const { getSparkPrompt } = require('./prompts/spark-prompt.js');
    const llm = require('./agents/llm-adapter.cjs');
    const { fieldName, currentState } = await readBody(req);
    if (!fieldName || !currentState) {
      return json(res, 400, { success: false, error: 'fieldName and currentState are required' });
    }

    const contextString = JSON.stringify(currentState, null, 2);
    const prompt = getSparkPrompt(fieldName, contextString);
    
    // Call LLM adapter
    const llmRes = await llm.call(
      "You are a helpful AI that strictly outputs JSON arrays of strings. No preamble.",
      prompt,
      { max_tokens: 300, temperature: 0.7 }
    );
    
    if (!llmRes.ok) {
      if (llmRes.error === 'NO_AI_AVAILABLE') {
        return json(res, 503, { success: false, error: 'NO_AI_AVAILABLE' });
      }
      throw new Error(llmRes.error);
    }

    let parsed = [];
    try {
      const jsonStart = llmRes.text.indexOf('[');
      const jsonEnd = llmRes.text.lastIndexOf(']');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        parsed = JSON.parse(llmRes.text.substring(jsonStart, jsonEnd + 1));
      } else {
        parsed = JSON.parse(llmRes.text);
      }
    } catch (e) {
      throw new Error('LLM did not return a valid JSON array. Response: ' + llmRes.text);
    }

    json(res, 200, { success: true, suggestions: parsed });
  } catch(err) {
    console.error('[POST /api/spark-suggestion] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleCompetitorDiscovery(req, res) {
  try {
    const { discoverCompetitors } = require('./enrichers/competitor-enricher.cjs');
    const { companyName, industry } = await readBody(req);
    const result = await discoverCompetitors(companyName, industry);
    if (!result.success) {
      if (result.reason === "No TAVILY_API_KEY provided") {
        return json(res, 400, { success: false, reason: "No API Key" });
      }
      return json(res, 500, { success: false, error: result.reason });
    }
    json(res, 200, { success: true, enrichedData: result.enrichedData });
  } catch (err) {
    console.error('[POST /api/competitor-discovery] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

function handleCorsPreflight(req, res) {
  res.writeHead(204, { 
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Headers': 'Content-Type', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
  });
  res.end();
}

function isValidAdminSecret(req) {
  const configured = String(process.env.MARKOS_ADMIN_SECRET || '').trim();
  if (!configured) return false;
  const provided = String((req && req.headers && (req.headers['x-markos-admin-secret'] || req.headers['X-Markos-Admin-Secret'])) || '').trim();
  return provided.length > 0 && provided === configured;
}

async function handleLiteracyHealth(req, res) {
  if (!isValidAdminSecret(req)) {
    return json(res, 401, { success: false, error: 'ADMIN_SECRET_REQUIRED' });
  }

  const vectorStore = require('./vector-store-client.cjs');
  const runtime = createRuntimeContext();
  vectorStore.configure(runtime.config || {});

  const health = await vectorStore.healthCheck();
  return json(res, 200, {
    success: true,
    literacy: {
      mode: runtime.mode,
      providers: health.providers || {},
      status: health.status || 'unknown',
    },
  });
}

async function handleLiteracyQuery(req, res) {
  if (!isValidAdminSecret(req)) {
    return json(res, 401, { success: false, error: 'ADMIN_SECRET_REQUIRED' });
  }

  const body = await readBody(req);
  const discipline = String(body.discipline || '').trim();
  const query = String(body.query || 'summary');
  const topK = Math.max(1, Number(body.topK) || 5);

  if (!discipline) {
    return json(res, 400, { success: false, error: 'discipline is required' });
  }

  const vectorStore = require('./vector-store-client.cjs');
  const runtime = createRuntimeContext();
  vectorStore.configure(runtime.config || {});

  const filters = {
    business_model: body.business_model || null,
    funnel_stage: body.funnel_stage || null,
    content_type: body.content_type || null,
  };

  const matches = await vectorStore.getLiteracyContext(discipline, query, filters, topK);
  return json(res, 200, {
    success: true,
    diagnostics: {
      namespace: `markos-standards-${String(discipline).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`,
      topK,
      filters,
      returned: matches.length,
    },
    matches,
  });
}

const OPERATOR_ALLOWED_ACTIONS = new Set([
  'set_publish_flag',
  'set_workflow_state',
  'set_governance_marker',
]);

function resolveRoleViewContext(req) {
  const tenantId = String((req && req.headers && req.headers['x-tenant-id']) || '').trim();
  const role = String((req && req.headers && req.headers['x-role']) || '').trim();
  const resourceTenantId = String(
    (req && req.headers && req.headers['x-resource-tenant-id']) || tenantId
  ).trim();

  return {
    tenantId,
    role,
    resourceTenantId,
  };
}

function createRoleViewDeps(overrides = {}) {
  const store = overrides.auditStore || auditStore;
  const lineage = overrides.lineage || createLineageLogger({
    append: async (entry) => store.append(entry),
  });

  return {
    auditStore: store,
    lineage,
    retriever: overrides.retriever || createVaultRetriever({
      getArtifacts: async () => store.getAll(),
      lineage,
    }),
  };
}

function resolveGovernanceTelemetryCapture(overrides = {}) {
  if (overrides && typeof overrides.captureGovernanceEvent === 'function') {
    return overrides.captureGovernanceEvent;
  }
  if (telemetry && typeof telemetry.captureGovernanceEvent === 'function') {
    return telemetry.captureGovernanceEvent;
  }
  const err = new Error('Governance telemetry capture is unavailable.');
  err.code = 'E_GOVERNANCE_TELEMETRY_UNAVAILABLE';
  throw err;
}

function governanceTelemetryFailureStatus(code) {
  return code === 'E_GOVERNANCE_TELEMETRY_UNAVAILABLE' ? 503 : 422;
}

function governanceTelemetryFailureEnvelope(stage, err) {
  return {
    success: false,
    error: 'E_GOVERNANCE_TELEMETRY_INVALID',
    machine_readable: true,
    governance: {
      stage,
      code: err && err.code ? err.code : 'E_GOVERNANCE_TELEMETRY_INVALID',
      message: err && err.message ? err.message : 'Governance telemetry payload is invalid.',
    },
  };
}

function verifyGovernanceCloseout(input = {}) {
  const verification = verifyHighRiskExecution({
    reasoning_trace: input.reasoning_trace,
    expected_evidence_ref: input.expected_evidence_ref,
    observed_evidence_ref: input.observed_evidence_ref,
  });

  if (!verification.verified) {
    return {
      ok: false,
      error: 'E_GOVERNANCE_CLOSEOUT_VERIFICATION_FAILED',
      verification,
      code: 'E_GOVERNANCE_CLOSEOUT_VERIFICATION_FAILED',
      message: 'High-risk closeout verification failed before governance closure emission.',
    };
  }

  const captureGovernanceEvent = resolveGovernanceTelemetryCapture({
    captureGovernanceEvent: input.captureGovernanceEvent,
  });

  try {
    const telemetryPayload = captureGovernanceEvent(
      input.event_name || 'runtime_governance_closeout_verified',
      {
        tenant_id: String(input.tenant_id || '').trim(),
        artifact_id: String(input.artifact_id || '').trim(),
        retrieval_mode: String(input.retrieval_mode || 'manage').trim(),
        run_id: String(input.run_id || '').trim(),
        actor_role: String(input.actor_role || 'system').trim(),
        outcome_status: 'verified',
        expected_evidence_ref: String(input.expected_evidence_ref || '').trim(),
        observed_evidence_ref: String(input.observed_evidence_ref || '').trim(),
        anomaly_flags: Array.isArray(verification.anomaly_flags) ? verification.anomaly_flags : [],
        timestamp: new Date().toISOString(),
      }
    );

    return {
      ok: true,
      verification,
      telemetry: telemetryPayload,
    };
  } catch (err) {
    return {
      ok: false,
      error: 'E_GOVERNANCE_TELEMETRY_INVALID',
      verification,
      code: err && err.code ? err.code : 'E_GOVERNANCE_TELEMETRY_INVALID',
      message: err && err.message ? err.message : 'Governance telemetry payload is invalid.',
    };
  }
}

function buildClosureSections({ gateResults, closeoutVerification }) {
  const gates = (gateResults && gateResults.gates) || {};
  const verification = (closeoutVerification && closeoutVerification.verification) || {};
  const verified = Boolean(verification.verified);

  return {
    tenant_isolation_matrix: {
      passed: Boolean(gates.tenant_isolation && gates.tenant_isolation.passed),
      detail: gates.tenant_isolation || null,
    },
    telemetry_validation: {
      passed: verified,
      detail: {
        anomaly_flags: Array.isArray(verification.anomaly_flags) ? verification.anomaly_flags : [],
      },
    },
    non_regression_results: {
      passed: Boolean(gates.contract_integrity && gates.contract_integrity.passed),
      detail: gates.contract_integrity || null,
    },
    pageindex_sla_evidence: {
      passed: verified,
      detail: 'runtime closeout verification evidence accepted',
    },
    obsidian_sync_stability: {
      passed: verified,
      detail: 'runtime closeout verification evidence accepted',
    },
    requirement_coverage_ledger: {
      passed: Boolean(gateResults && gateResults.passed && verified),
      requirements: ['GOVV-05'],
    },
  };
}

function shouldRequireDurableClosurePersistence() {
  if (String(process.env.NODE_ENV || '').trim() === 'test') {
    return false;
  }
  return true;
}

async function emitRuntimeClosureEvidence(input = {}) {
  const actorRole = String(input.actor_role || 'system').trim();
  if (actorRole !== 'system') {
    return {
      ok: false,
      error: 'E_CLOSURE_SYSTEM_ACTOR_REQUIRED',
      code: 'E_CLOSURE_SYSTEM_ACTOR_REQUIRED',
      message: 'Runtime closure emission is restricted to system actor ownership.',
    };
  }

  const closureArtifact = persistMilestoneClosureBundle({
    phase: String(input.phase || '').trim(),
    sections: buildClosureSections({
      gateResults: input.gate_results,
      closeoutVerification: input.closeout_verification,
    }),
    outputDir: input.closureOutputDir,
    now: input.now,
  });

  const store = input.auditStore || auditStore;
  const requireDurable = input.require_durable_persistence !== false;
  const appendClosureRecord = typeof auditStore.appendClosureRecord === 'function'
    ? auditStore.appendClosureRecord
    : async (entry) => store.append({ ...entry, type: 'milestone_closure_bundle' });

  try {
    const auditEntry = await appendClosureRecord(
      {
        tenant_id: String(input.tenant_id || '').trim(),
        artifact_id: String(input.bundle_id || '').trim(),
        actor_role: actorRole,
        bundle_hash: closureArtifact.bundle_hash,
        bundle_locator: closureArtifact.bundle_locator,
        bundle_path: closureArtifact.bundle_path,
        phase: String(closureArtifact.phase || '').trim(),
        written_at: closureArtifact.written_at,
        passed: closureArtifact.passed,
      },
      {
        store,
        requireDurable,
      }
    );

    return {
      ok: true,
      closure: closureArtifact,
      audit_record: auditEntry,
    };
  } catch (error) {
    return {
      ok: false,
      error: error && error.code === 'E_AUDIT_DURABLE_REQUIRED'
        ? 'E_CLOSURE_DURABLE_PERSISTENCE_REQUIRED'
        : 'E_CLOSURE_AUDIT_APPEND_FAILED',
      code: error && error.code ? error.code : 'E_CLOSURE_AUDIT_APPEND_FAILED',
      message: error && error.message
        ? error.message
        : 'Failed to persist closure evidence record.',
      closure: closureArtifact,
    };
  }
}

async function handleRoleViewOperator(req, res, overrides) {
  const context = resolveRoleViewContext(req);
  const scope = checkOperatorViewScope(
    { tenantId: context.tenantId, role: context.role },
    { tenantId: context.resourceTenantId }
  );
  if (!scope.allowed) {
    return json(res, 403, { success: false, error: scope.code, reason: scope.reason });
  }

  const body = await readBody(req);
  const action = String(body.action || '').trim();
  const artifactId = String(body.artifact_id || '').trim();

  if (!OPERATOR_ALLOWED_ACTIONS.has(action)) {
    return json(res, 400, {
      success: false,
      error: 'E_OPERATOR_ACTION_INVALID',
      reason: 'Operator action is not allowed for role-view management.',
    });
  }

  if (!artifactId) {
    return json(res, 400, {
      success: false,
      error: 'E_ARTIFACT_ID_REQUIRED',
      reason: 'artifact_id is required for operator role-view actions.',
    });
  }

  const deps = createRoleViewDeps(overrides);
  await deps.lineage.appendLineageEvent({
    tenant_id: context.resourceTenantId,
    artifact_id: artifactId,
    view: 'operator',
    role: context.role,
    action,
    mode: 'manage',
    timestamp: new Date().toISOString(),
  });

  try {
    const captureGovernanceEvent = resolveGovernanceTelemetryCapture(overrides);
    captureGovernanceEvent('runtime_role_view_operator_event', {
      tenant_id: context.resourceTenantId,
      artifact_id: artifactId,
      retrieval_mode: 'manage',
      run_id: `operator-${artifactId}`,
      actor_role: context.role,
      outcome_status: 'success',
      expected_evidence_ref: `lineage://operator/${artifactId}`,
      observed_evidence_ref: `lineage://operator/${artifactId}`,
      anomaly_flags: [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return json(
      res,
      governanceTelemetryFailureStatus(err && err.code),
      governanceTelemetryFailureEnvelope('runtime_role_view_operator', err)
    );
  }

  return json(res, 200, {
    success: true,
    view: 'operator',
    tenant_id: context.resourceTenantId,
    management: {
      action,
      artifact_id: artifactId,
      status: 'accepted',
    },
  });
}

async function handleRoleViewAgent(req, res, overrides) {
  const context = resolveRoleViewContext(req);
  const scope = checkAgentViewScope(
    { tenantId: context.tenantId, role: context.role },
    { tenantId: context.resourceTenantId, strictAgentRole: true }
  );
  if (!scope.allowed) {
    return json(res, 403, { success: false, error: scope.code, reason: scope.reason });
  }

  const routePath = String((req && req.url) || '').split('?')[0];
  const mode = String(routePath.split('/').pop() || '').trim();
  if (!['reason', 'apply', 'iterate'].includes(mode)) {
    return json(res, 400, {
      success: false,
      error: 'E_AGENT_MODE_INVALID',
      reason: 'Agent role-view mode must be reason, apply, or iterate.',
    });
  }

  const deps = createRoleViewDeps(overrides);
  const method = mode === 'reason'
    ? 'retrieveReason'
    : mode === 'apply'
      ? 'retrieveApply'
      : 'retrieveIterate';

  const items = await deps.retriever[method]({
    tenantId: context.resourceTenantId,
    claims: {
      tenantId: context.tenantId,
      role: context.role,
    },
    filter: {},
  });

  try {
    const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
    const artifactId = String(
      (firstItem && (firstItem.artifact_id || firstItem.doc_id)) || `agent-${mode}-empty`
    ).trim();
    const captureGovernanceEvent = resolveGovernanceTelemetryCapture(overrides);
    captureGovernanceEvent('runtime_role_view_agent_event', {
      tenant_id: context.resourceTenantId,
      artifact_id: artifactId,
      retrieval_mode: mode,
      run_id: `agent-${mode}-${context.resourceTenantId}`,
      actor_role: context.role,
      outcome_status: 'success',
      expected_evidence_ref: `lineage://agent/${mode}/${artifactId}`,
      observed_evidence_ref: `lineage://agent/${mode}/${artifactId}`,
      anomaly_flags: [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return json(
      res,
      governanceTelemetryFailureStatus(err && err.code),
      governanceTelemetryFailureEnvelope('runtime_role_view_agent', err)
    );
  }

  return json(res, 200, {
    success: true,
    view: 'agent',
    mode,
    tenant_id: context.resourceTenantId,
    items,
  });
}

module.exports = {
  handleConfig,
  handleStatus,
  handleLiteracyCoverage,
  handleSubmit,
  handleRegenerate,
  handleApprove,
  handleImporterScan,
  handleImporterApply,
  handleMarkosdbMigration,
  handleLinearSync,
  handleCampaignResult,
  handleExtractSources,
  handleExtractAndScore,
  handleGenerateQuestion,
  handleParseAnswer,
  handleSparkSuggestion,
    INTAKE_VALIDATION_RULES,
    validateIntake,
  handleCompetitorDiscovery,
  handleCorsPreflight,
  handleRoleViewOperator,
  handleRoleViewAgent,
  handleLiteracyHealth,
  handleLiteracyQuery,
  __testing: {
    checkActionAuthorization,
    verifyGovernanceCloseout,
    emitRuntimeClosureEvidence,
    resetApprovalDecisionStore() {
      approvalDecisionStore.clear();
    },
    getApprovalDecisionStoreSize() {
      return approvalDecisionStore.size;
    },
    verifyHighRiskExecution,
  },
};



