'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const billingEntitlements = require('../../lib/markos/billing/entitlements.cjs');

const {
  CONFIG_PATH,
  ONBOARDING_DIR,
  PROJECT_CONFIG_PATH,
  LEGACY_LOCAL_DIR,
  PROJECT_ROOT,
} = require('./path-constants.cjs');

const MARKOS_LOCAL_ROOT = path.join(PROJECT_ROOT, '.markos-local');

const MARKOSDB_ACCESS_MATRIX = Object.freeze({
  config_read: { auth_required_in_hosted_mode: true, local_fallback_allowed: true },
  status_read: { auth_required_in_hosted_mode: true, local_fallback_allowed: true },
  migration_write: { auth_required_in_hosted_mode: true, local_fallback_allowed: true },
  approve_write: { auth_required_in_hosted_mode: true, local_fallback_allowed: true },
  submit_write: { auth_required_in_hosted_mode: true, local_fallback_allowed: true },
});

const ROLLOUT_MODES = Object.freeze(['dry-run', 'dual-write', 'cloud-primary']);

const REQUIRED_SECRET_MATRIX = Object.freeze({
  config_read: Object.freeze({ required: ['MARKOS_SUPABASE_AUD'], hostedOnly: true }),
  status_read: Object.freeze({ required: ['MARKOS_SUPABASE_AUD'], hostedOnly: true }),
  migration_write: Object.freeze({ required: ['MARKOS_SUPABASE_AUD'], hostedOnly: true }),
  linear_sync_write: Object.freeze({ required: ['LINEAR_API_KEY'], hostedOnly: false }),
  submit_write: Object.freeze({ required: [], hostedOnly: false }),
  approve_write: Object.freeze({ required: [], hostedOnly: false }),
  campaign_result_write: Object.freeze({ required: [], hostedOnly: false }),
  telemetry_write: Object.freeze({ required: ['POSTHOG_API_KEY'], hostedOnly: false }),
  literacy_ingest_write: Object.freeze({ required: ['SUPABASE_SERVICE_ROLE_KEY', 'UPSTASH_VECTOR_REST_TOKEN'], hostedOnly: false }),
  literacy_admin_write: Object.freeze({ required: ['SUPABASE_SERVICE_ROLE_KEY', 'UPSTASH_VECTOR_REST_TOKEN'], hostedOnly: false }),
});

const RETENTION_POLICY = Object.freeze({
  server_logs_days: 14,
  rollout_reports_days: 30,
  migration_checkpoint_days: 90,
});

const SUPPORTED_LLM_PROVIDERS = Object.freeze(['anthropic', 'openai', 'gemini']);

const REDACTED_LITERAL = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(authorization|token|access_token|refresh_token|posthog_api_key|linear_api_key|supabase_service_role_key|upstash_vector_rest_token|x-markos-project-slug)/i;
const BEARER_TOKEN_PATTERN = /Bearer\s+[^\s]+/gi;

function normalizeAbsolutePathForCompare(targetPath) {
  const resolved = path.resolve(targetPath);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isPathWithinBase(targetPath, basePath) {
  const normalizedTarget = normalizeAbsolutePathForCompare(targetPath);
  const normalizedBase = normalizeAbsolutePathForCompare(basePath);
  if (normalizedTarget === normalizedBase) return true;
  return normalizedTarget.startsWith(`${normalizedBase}${path.sep}`);
}

function ensureMirOutputPathWithinLocalRoots(mirOutputPath) {
  const allowedRoots = [MARKOS_LOCAL_ROOT];
  const inAllowedRoot = allowedRoots.some((root) => isPathWithinBase(mirOutputPath, root));

  if (!inAllowedRoot) {
    throw new Error('MIR_OUTPUT_PATH_OUT_OF_BOUNDS');
  }

  return mirOutputPath;
}

function isHostedRuntime(env = process.env) {
  return Boolean(env.VERCEL || env.NETLIFY || env.AWS_LAMBDA_FUNCTION_NAME);
}

function getTelemetryPreference(env = process.env) {
  return env.MARKOS_TELEMETRY ?? env.MARKOS_TELEMETRY;
}

function getRolloutMode(env = process.env) {
  const configured = String(env.MARKOS_ROLLOUT_MODE || 'dry-run').trim().toLowerCase();
  if (!ROLLOUT_MODES.includes(configured)) {
    throw new Error(`INVALID_ROLLOUT_MODE:${configured}`);
  }
  return configured;
}

function loadMigrationCheckpoints(filePath) {
  const fallback = {
    current_mode: getRolloutMode(process.env),
    transitions: [],
  };

  if (!filePath || !fs.existsSync(filePath)) {
    return fallback;
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const transitions = Array.isArray(parsed.transitions) ? parsed.transitions : [];
  return {
    current_mode: parsed.current_mode || fallback.current_mode,
    transitions,
  };
}

function assertRolloutPromotionAllowed({ currentMode, targetMode, projectSlug, checkpoints }) {
  if (!ROLLOUT_MODES.includes(currentMode)) {
    throw new Error(`UNKNOWN_CURRENT_MODE:${currentMode}`);
  }
  if (!ROLLOUT_MODES.includes(targetMode)) {
    throw new Error(`UNKNOWN_TARGET_MODE:${targetMode}`);
  }
  if (currentMode === targetMode) {
    return { ok: true, transition_required: false };
  }

  const currentIndex = ROLLOUT_MODES.indexOf(currentMode);
  const targetIndex = ROLLOUT_MODES.indexOf(targetMode);
  if (targetIndex !== currentIndex + 1) {
    throw new Error(`ROLLOUT_PROMOTION_SKIPPED:${currentMode}->${targetMode}`);
  }

  const transitions = Array.isArray(checkpoints && checkpoints.transitions) ? checkpoints.transitions : [];
  const record = transitions.find((entry) =>
    entry &&
    entry.from_mode === currentMode &&
    entry.to_mode === targetMode &&
    entry.project_slug === projectSlug &&
    String(entry.status || '').toLowerCase() === 'approved'
  );

  if (!record) {
    throw new Error(`ROLLOUT_PROMOTION_CHECKPOINT_MISSING:${currentMode}->${targetMode}`);
  }

  const requiredKeys = [
    'from_mode',
    'to_mode',
    'project_slug',
    'owner',
    'approved_at',
    'checkpoint_id',
    'verification_ref',
    'rollback_mode',
    'rollback_command',
    'status',
  ];

  for (const key of requiredKeys) {
    if (!record[key] || String(record[key]).trim().length === 0) {
      throw new Error(`ROLLOUT_PROMOTION_INVALID_RECORD:${key}`);
    }
  }

  if (!ROLLOUT_MODES.includes(record.rollback_mode)) {
    throw new Error(`ROLLOUT_PROMOTION_INVALID_RECORD:rollback_mode`);
  }

  return {
    ok: true,
    transition_required: true,
    checkpoint: {
      id: record.checkpoint_id,
      approved_at: record.approved_at,
      verification_ref: record.verification_ref,
      owner: record.owner,
      from_mode: record.from_mode,
      to_mode: record.to_mode,
      rollback_mode: record.rollback_mode,
      rollback_command: record.rollback_command,
      status: record.status,
    },
  };
}

function validateRequiredSecrets({ runtimeMode, operation, env = process.env }) {
  const rules = REQUIRED_SECRET_MATRIX[operation];
  if (!rules) {
    return {
      ok: false,
      operation,
      missing: [],
      error: `UNKNOWN_SECRET_OPERATION:${operation}`,
    };
  }

  if (rules.hostedOnly && runtimeMode !== 'hosted') {
    return { ok: true, operation, missing: [] };
  }

  const missing = (rules.required || []).filter((key) => {
    const value = env[key];
    return value === undefined || value === null || String(value).trim().length === 0;
  });

  if (missing.length > 0) {
    return {
      ok: false,
      operation,
      missing,
      error: `MISSING_REQUIRED_SECRETS:${missing.join(',')}`,
    };
  }

  return { ok: true, operation, missing: [] };
}

function redactSensitive(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitive(entry));
  }

  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = REDACTED_LITERAL;
      } else {
        output[key] = redactSensitive(entry);
      }
    }
    return output;
  }

  if (typeof value === 'string') {
    return value.replace(BEARER_TOKEN_PATTERN, `Bearer ${REDACTED_LITERAL}`);
  }

  return value;
}

function loadRuntimeConfig(env = process.env) {
  let config = {
    port: 4242,
    auto_open_browser: true,
    output_path: '../onboarding-seed.json',
    vector_endpoint: env.UPSTASH_VECTOR_REST_URL || null,
    project_slug: 'markos-client',
    mir_output_path: null,
    posthog_api_key: getTelemetryPreference(env) !== 'false' ? env.POSTHOG_API_KEY : null,
    posthog_host: env.POSTHOG_HOST || 'https://us.i.posthog.com',
  };

  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    config = { ...config, ...raw };
  } catch (error) {}

  return config;
}

function normalizeProjectNameToSlug(companyName = '') {
  const normalizedName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedName || 'markos-client';
}

function getDefaultProjectSlug(config, companyName = '') {
  if (config.project_slug) return config.project_slug;
  return normalizeProjectNameToSlug(companyName);
}

function resolveRequestedProjectSlug({ explicitSlug, requestUrl = '/', config, companyName = '' }) {
  if (explicitSlug) return explicitSlug;

  try {
    const url = new URL(`http://localhost${requestUrl}`);
    const querySlug = url.searchParams.get('project_slug') || url.searchParams.get('client');
    if (querySlug) return querySlug;
  } catch (error) {}

  return getDefaultProjectSlug(config, companyName);
}

function readPersistedProjectSlug() {
  try {
    if (!fs.existsSync(PROJECT_CONFIG_PATH)) return null;
    const config = JSON.parse(fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8'));
    return config.project_slug || null;
  } catch (error) {
    return null;
  }
}

function persistProjectSlug(slug) {
  try {
    const existing = fs.existsSync(PROJECT_CONFIG_PATH)
      ? JSON.parse(fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8'))
      : {};

    if (existing.project_slug) return existing.project_slug;

    existing.project_slug = slug;
    fs.writeFileSync(PROJECT_CONFIG_PATH, JSON.stringify(existing, null, 2), 'utf8');
    return slug;
  } catch (error) {
    return slug;
  }
}

function resolveProjectSlug(runtimeContext, requestedSlug) {
  if (!runtimeContext.canWriteLocalFiles) return requestedSlug;

  const persistedSlug = readPersistedProjectSlug();
  if (persistedSlug) return persistedSlug;

  return persistProjectSlug(requestedSlug);
}

function resolveSeedOutputPath(config) {
  return path.resolve(ONBOARDING_DIR, config.output_path);
}

function resolveMirOutputPath(config) {
  let resolvedPath;
  if (config.mir_output_path) {
    resolvedPath = path.resolve(PROJECT_ROOT, config.mir_output_path);
  } else {
    resolvedPath = path.join(LEGACY_LOCAL_DIR, 'MIR');
  }

  return ensureMirOutputPathWithinLocalRoots(resolvedPath);
}

function createRuntimeContext(env = process.env) {
  const config = loadRuntimeConfig(env);
  const hosted = isHostedRuntime(env);

  return {
    mode: hosted ? 'hosted' : 'local',
    canWriteLocalFiles: !hosted,
    config,
  };
}

function getMarkosdbAccessMatrix() {
  return MARKOSDB_ACCESS_MATRIX;
}

function readHeader(req, key) {
  if (!req || !req.headers) return undefined;
  return req.headers[key] || req.headers[key.toLowerCase()] || req.headers[key.toUpperCase()];
}

function getBearerToken(req) {
  const authorization = readHeader(req, 'authorization');
  if (!authorization) return null;
  const match = String(authorization).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function decodeJwtPayloadWithoutVerification(token) {
  const parts = String(token || '').split('.');
  if (parts.length < 2) return null;

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function normalizeProjectScopes(payload = {}) {
  const scopes = new Set();
  const appMeta = payload.app_metadata || {};
  const userMeta = payload.user_metadata || {};

  const addScope = (value) => {
    if (!value) return;
    const normalized = String(value).trim();
    if (normalized) scopes.add(normalized);
  };

  const list = []
    .concat(Array.isArray(appMeta.project_slugs) ? appMeta.project_slugs : [])
    .concat(Array.isArray(userMeta.project_slugs) ? userMeta.project_slugs : []);

  for (const value of list) addScope(value);
  addScope(appMeta.project_slug);
  addScope(userMeta.project_slug);
  addScope(payload.project_slug);

  return Array.from(scopes);
}

function isServiceRolePayload(payload = {}) {
  const role = String(payload.role || payload.user_role || '').toLowerCase();
  return role === 'service_role' || role === 'supabase_admin';
}

function resolveRequestedProjectSlugFromRequest(req) {
  const explicit = readHeader(req, 'x-markos-project-slug') || readHeader(req, 'x-project-slug');
  if (explicit) return String(explicit).trim();

  try {
    const parsed = new URL(`http://localhost${req.url || '/'}`);
    return parsed.searchParams.get('project_slug') || parsed.searchParams.get('client') || null;
  } catch {
    return null;
  }
}

function requireHostedSupabaseAuth({ req, runtimeContext, operation, requiredProjectSlug = null, env = process.env }) {
  const operationRules = MARKOSDB_ACCESS_MATRIX[operation] || MARKOSDB_ACCESS_MATRIX.status_read;
  if (!runtimeContext || runtimeContext.mode !== 'hosted' || !operationRules.auth_required_in_hosted_mode) {
    return {
      ok: true,
      status: 200,
      principal: { type: 'runtime_local', id: 'local-operator', scopes: [] },
      operation,
    };
  }

  const secretValidation = validateRequiredSecrets({
    runtimeMode: runtimeContext.mode,
    operation,
    env,
  });
  if (!secretValidation.ok) {
    return {
      ok: false,
      status: 503,
      error: 'REQUIRED_SECRET_MISSING',
      message: `Missing required runtime secret(s): ${secretValidation.missing.join(', ')}`,
      operation,
      missing_secrets: secretValidation.missing,
    };
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'AUTH_REQUIRED',
      message: 'Hosted MarkOSDB operations require a Supabase Bearer token.',
      operation,
    };
  }

  const payload = decodeJwtPayloadWithoutVerification(token);
  if (!payload || !payload.sub) {
    return {
      ok: false,
      status: 401,
      error: 'INVALID_AUTH_TOKEN',
      message: 'Bearer token is malformed or missing Supabase subject claim.',
      operation,
    };
  }

  const expectedAud = env.MARKOS_SUPABASE_AUD || 'authenticated';
  if (expectedAud && payload.aud && payload.aud !== expectedAud) {
    return {
      ok: false,
      status: 403,
      error: 'AUTH_AUDIENCE_MISMATCH',
      message: 'Supabase token audience does not satisfy runtime policy.',
      operation,
    };
  }

  const scopes = normalizeProjectScopes(payload);
  const requestedSlug = requiredProjectSlug || resolveRequestedProjectSlugFromRequest(req);
  const serviceRole = isServiceRolePayload(payload);

  if (requestedSlug && !serviceRole && !scopes.includes(requestedSlug)) {
    return {
      ok: false,
      status: 403,
      error: 'PROJECT_SCOPE_DENIED',
      message: `Token is not scoped for project '${requestedSlug}'.`,
      operation,
    };
  }

  // =========================================================================
  // TENANT CONTEXT RESOLUTION (Task 51-02-01)
  // =========================================================================
  // Resolve tenant_id from trusted JWT claims and detect ambiguous context
  
  // Extract tenant_id from multiple possible sources (in priority order)
  const tenantIdFromPayload = String(payload.active_tenant_id || payload.tenant_id || '').trim();
  const tenantIdFromHeader = String(readHeader(req, 'x-tenant-id') || '').trim();
  const tenantIdFromQuery = (() => {
    try {
      const parsed = new URL(`http://localhost${req.url || '/'}`);
      return String(parsed.searchParams.get('tenant_id') || '').trim();
    } catch {
      return '';
    }
  })();

  // Detect tenant context: canonical tenant_id is from JWT claims
  const canonicalTenantId = tenantIdFromPayload;
  
  // Validate: fail closed if tenant is missing or ambiguous
  if (!canonicalTenantId) {
    return {
      ok: false,
      status: 401,
      error: 'TENANT_CONTEXT_MISSING',
      message: 'Request requires active_tenant_id in verified JWT token.',
      operation,
      tenant_id: null,
    };
  }

  // Validate: fail closed if different tenant sources conflict
  const conflictingTenant = (tenantIdFromHeader && tenantIdFromHeader !== canonicalTenantId) ||
                            (tenantIdFromQuery && tenantIdFromQuery !== canonicalTenantId);
  if (conflictingTenant) {
    return {
      ok: false,
      status: 403,
      error: 'TENANT_CONTEXT_AMBIGUOUS',
      message: 'Tenant context from headers/query conflicts with verified token claims.',
      operation,
      tenant_id: canonicalTenantId,
      expected: canonicalTenantId,
      conflict_sources: {
        header: tenantIdFromHeader || null,
        query: tenantIdFromQuery || null,
        token: canonicalTenantId,
      },
    };
  }

  // Extract tenant memberships and role from payload metadata
  // This is a placeholder for future tenant membership resolution
  const tenantMemberships = payload.app_metadata?.tenant_memberships || [];
  const tenantRole = payload.app_metadata?.tenant_role || 'member';
  const entitlementSnapshot = resolveEntitlementSnapshot({
    entitlement_snapshot: payload.app_metadata?.entitlement_snapshot || payload.user_metadata?.entitlement_snapshot,
  });

  return {
    ok: true,
    status: 200,
    operation,
    token_payload: payload,
    tenant_id: canonicalTenantId,
    iamRole: tenantRole,
    role: tenantRole,
    entitlement_snapshot: entitlementSnapshot,
    principal: {
      type: serviceRole ? 'supabase_service_role' : 'supabase_user',
      id: payload.sub,
      tenant_id: canonicalTenantId,
      tenant_role: tenantRole,
      tenant_memberships: tenantMemberships,
      scopes,
    },
  };
}

// =========================================================================
// DENY HELPER FOR TELEMETRY (Task 51-04-03)
// =========================================================================
// Emit immutable denial events for cross-tenant access attempts

// =========================================================================
// PLUGIN CONTROL HELPERS — Phase 52 PLG-DA-01
// =========================================================================
// All helpers operate against an in-memory Map store keyed by
// "${tenantId}::${pluginId}". In production the store is hydrated from
// the plugin_tenant_config table by the request handler before calling
// these utilities. Unit tests supply a synthetic Map directly.

function _pluginStoreKey(tenantId, pluginId) {
  return `${tenantId}::${pluginId}`;
}

function isTenantPluginEnabled(store, tenantId, pluginId) {
  const entry = store.get(_pluginStoreKey(tenantId, pluginId));
  return !!(entry && entry.enabled === true);
}

function getGrantedCapabilities(store, tenantId, pluginId) {
  const entry = store.get(_pluginStoreKey(tenantId, pluginId));
  if (!entry || !Array.isArray(entry.granted_capabilities)) return [];
  return entry.granted_capabilities.slice();
}

function assertPluginCapability(store, tenantId, pluginId, capability) {
  const entry = store.get(_pluginStoreKey(tenantId, pluginId));
  if (!entry || entry.enabled !== true) {
    const err = new Error(`PLUGIN_DISABLED: plugin '${pluginId}' is not enabled for tenant '${tenantId}'`);
    err.statusCode = 404;
    throw err;
  }
  const caps = Array.isArray(entry.granted_capabilities) ? entry.granted_capabilities : [];
  if (!caps.includes(capability)) {
    const err = new Error(`CAPABILITY_NOT_GRANTED: capability '${capability}' not granted for plugin '${pluginId}' on tenant '${tenantId}'`);
    err.statusCode = 403;
    throw err;
  }
}

function recordCapabilityGrant(store, tenantId, pluginId, capability) {
  const key = _pluginStoreKey(tenantId, pluginId);
  const entry = store.get(key);
  if (!entry) {
    throw new Error(`TENANT_NOT_FOUND: no plugin config entry for tenant '${tenantId}' plugin '${pluginId}'`);
  }
  const caps = Array.isArray(entry.granted_capabilities) ? entry.granted_capabilities : [];
  if (!caps.includes(capability)) {
    store.set(key, { ...entry, granted_capabilities: [...caps, capability] });
  }
  return store;
}

function buildDenyEvent({ actor_id, tenant_id, action, reason, request_id, correlation_id }) {
  const timestamp = new Date().toISOString();
  const resolvedCorrelationId = correlation_id || request_id || crypto.randomUUID?.() || `${Date.now()}`;
  
  // Immutable event structure with correlation ID for audit tracing
  const event = Object.freeze({
    event_type: 'markos_tenant_access_denied',
    timestamp,
    correlation_id: resolvedCorrelationId,
    actor_id: String(actor_id || 'unknown'),
    tenant_id: String(tenant_id || 'unknown'),
    action: String(action || 'unknown'),
    reason: String(reason || 'cross_tenant_access_attempt'),
  });
  
  return event;
}

function resolveTelemetryCapture() {
  try {
    const telemetry = require('./agents/telemetry.cjs');
    if (telemetry && typeof telemetry.capture === 'function') {
      return telemetry.capture.bind(telemetry);
    }
  } catch {
    // Telemetry is optional in local/test environments.
  }

  return null;
}

function emitDenyTelemetry(denyEvent, dependencies = {}) {
  const capture = typeof dependencies.capture === 'function'
    ? dependencies.capture
    : resolveTelemetryCapture();
  const payload = Object.freeze({
    ...denyEvent,
    request_id: denyEvent && denyEvent.correlation_id ? denyEvent.correlation_id : null,
  });

  if (capture) {
    capture('markos_tenant_access_denied', payload);
  }

  return {
    ok: Boolean(capture),
    event_name: 'markos_tenant_access_denied',
    event_id: denyEvent.correlation_id,
    recorded_at: denyEvent.timestamp,
    payload,
  };
}

function buildIdentityMappingEvidence(input = {}) {
  return Object.freeze({
    event_id: String(input.event_id || input.correlation_id || crypto.randomUUID()),
    tenant_id: String(input.tenant_id || 'unknown'),
    actor_id: String(input.actor_id || 'unknown'),
    correlation_id: String(input.correlation_id || `corr-${crypto.randomUUID()}`),
    sso_provider_id: String(input.sso_provider_id || 'unknown'),
    source_claims: Array.isArray(input.source_claims) ? input.source_claims : [],
    matched_rule_id: input.matched_rule_id || null,
    canonical_role: input.canonical_role || null,
    decision: input.decision === 'granted' ? 'granted' : 'denied',
    denial_reason: input.denial_reason || null,
    timestamp: input.timestamp || new Date().toISOString(),
  });
}

function emitIdentityMappingTelemetry(identityEvent, dependencies = {}) {
  const capture = typeof dependencies.capture === 'function'
    ? dependencies.capture
    : resolveTelemetryCapture();
  const eventName = identityEvent && identityEvent.decision === 'granted'
    ? 'markos_identity_role_mapping_granted'
    : 'markos_identity_role_mapping_denied';

  if (capture) {
    capture(eventName, identityEvent);
  }

  return {
    ok: Boolean(capture),
    event_name: eventName,
    event_id: identityEvent && identityEvent.event_id ? identityEvent.event_id : null,
    recorded_at: identityEvent && identityEvent.timestamp ? identityEvent.timestamp : null,
    payload: identityEvent,
  };
}

function resolveEntitlementSnapshot(input = {}) {
  const rawSnapshot = input.entitlement_snapshot
    || input.entitlementSnapshot
    || input.billing_entitlement_snapshot
    || (input.markosAuth && input.markosAuth.entitlement_snapshot)
    || (input.tenantContext && input.tenantContext.entitlementSnapshot)
    || (input.principal && input.principal.entitlement_snapshot)
    || {};

  return billingEntitlements.buildEntitlementSnapshot(rawSnapshot);
}

function assertEntitledAction(input = {}, action = 'unknown', overrides = {}) {
  const snapshot = overrides.snapshot || resolveEntitlementSnapshot(input);
  const actorRole = overrides.actor_role
    || input.role
    || input.iamRole
    || (input.principal && input.principal.tenant_role)
    || 'unknown';

  const decision = billingEntitlements.evaluateEntitlementAccess({
    snapshot,
    action,
    actor_role: actorRole,
  });

  return {
    ...decision,
    snapshot,
    deny_reason: decision.allowed
      ? null
      : billingEntitlements.buildBillingDenyReason({ snapshot, action }),
  };
}

function parseBooleanFlag(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function normalizeProviderList(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return [...new Set(source
    .map((provider) => String(provider || '').trim().toLowerCase())
    .filter((provider) => SUPPORTED_LLM_PROVIDERS.includes(provider)))];
}

/**
 * Resolve a tenantId from an inbound hostname using a domain→tenant map.
 * Supports both shared-domain subdomains (e.g. acme.markos.io) and custom
 * domains (e.g. mycustomdomain.com) as long as they appear in domainMap.
 * Returns null for unknown or empty hostnames — fail-closed.
 *
 * @param {string} hostname
 * @param {Map<string,string>} domainMap  hostname → tenantId
 * @returns {string|null}
 */
function resolveTenantFromDomain(hostname, domainMap) {
  if (!hostname || typeof hostname !== 'string') return null;
  const normalised = hostname.trim().toLowerCase();
  if (!normalised) return null;
  // Try normalised first, then original (preserves case-exact keys if needed)
  return domainMap.get(normalised) || domainMap.get(hostname) || null;
}

function buildRunPolicyMetadata(input = {}, env = process.env) {
  const inputProviderPolicy = input.provider_policy && typeof input.provider_policy === 'object'
    ? input.provider_policy
    : {};
  const primaryProvider = String(
    inputProviderPolicy.primary_provider
    || env.MARKOS_PRIMARY_PROVIDER
    || env.MARKOS_LLM_PRIMARY_PROVIDER
    || 'openai'
  ).trim().toLowerCase() || 'openai';
  const configuredAllowedProviders = normalizeProviderList(
    inputProviderPolicy.allowed_providers
    || env.MARKOS_ALLOWED_PROVIDERS
    || env.MARKOS_LLM_AVAILABLE_PROVIDERS
  );
  const providerPolicy = {
    ...inputProviderPolicy,
    primary_provider: primaryProvider,
    allowed_providers: [...new Set([
      primaryProvider,
      ...(configuredAllowedProviders.length > 0 ? configuredAllowedProviders : SUPPORTED_LLM_PROVIDERS),
    ])],
    allow_fallback: parseBooleanFlag(
      inputProviderPolicy.allow_fallback ?? env.MARKOS_ALLOW_FALLBACK,
      true,
    ),
    max_fallback_attempts: Number.parseInt(
      inputProviderPolicy.max_fallback_attempts ?? env.MARKOS_MAX_FALLBACK_ATTEMPTS ?? '3',
      10,
    ) || 3,
  };

  const toolPolicy = input.tool_policy && typeof input.tool_policy === 'object'
    ? input.tool_policy
    : {
        profile: String(input.tool_profile || env.MARKOS_TOOL_POLICY_PROFILE || 'default'),
        allow_external_mutations: String(env.MARKOS_ALLOW_EXTERNAL_MUTATIONS || 'false').toLowerCase() === 'true',
      };

  return {
    provider_policy: providerPolicy,
    tool_policy: toolPolicy,
  };
}

function buildLLMCallOptions(executionContext = {}, overrides = {}) {
  const policyMetadata = buildRunPolicyMetadata(executionContext);
  const providerPolicy = policyMetadata.provider_policy;
  const primaryProvider = providerPolicy.primary_provider;
  const allowedProviders = normalizeProviderList(providerPolicy.allowed_providers)
    .filter((provider) => provider !== primaryProvider);
  const overrideMetadata = overrides.metadata && typeof overrides.metadata === 'object'
    ? overrides.metadata
    : {};

  return {
    primaryProvider,
    allowedProviders,
    no_fallback: providerPolicy.allow_fallback === false,
    max_fallback_attempts: providerPolicy.max_fallback_attempts,
    request_id: executionContext.request_id || executionContext.correlation_id || null,
    workspace_id: executionContext.workspace_id || executionContext.tenant_id || null,
    role: executionContext.role || 'operator',
    metadata: {
      operatorId: executionContext.actor_id || null,
      tenantId: executionContext.tenant_id || null,
      correlationId: executionContext.correlation_id || null,
      ...overrideMetadata,
    },
    ...overrides,
  };
}

module.exports = {
  ROLLOUT_MODES,
  REQUIRED_SECRET_MATRIX,
  RETENTION_POLICY,
  assertRolloutPromotionAllowed,
  assertEntitledAction,
  assertPluginCapability,
  buildDenyEvent,
  buildIdentityMappingEvidence,
  buildLLMCallOptions,
  createRuntimeContext,
  emitDenyTelemetry,
  emitIdentityMappingTelemetry,
  getRolloutMode,
  getGrantedCapabilities,
  getMarkosdbAccessMatrix,
  getDefaultProjectSlug,
  getTelemetryPreference,
  isHostedRuntime,
  isTenantPluginEnabled,
  loadMigrationCheckpoints,
  loadRuntimeConfig,
  persistProjectSlug,
  recordCapabilityGrant,
  redactSensitive,
  requireHostedSupabaseAuth,
  readPersistedProjectSlug,
  resolveEntitlementSnapshot,
  resolveMirOutputPath,
  resolveRequestedProjectSlugFromRequest,
  ensureMirOutputPathWithinLocalRoots,
  validateRequiredSecrets,
  resolveProjectSlug,
  resolveRequestedProjectSlug,
  resolveSeedOutputPath,
  buildRunPolicyMetadata,
};

// named export appended after object literal to avoid disturbing existing ordering
module.exports.resolveTenantFromDomain = resolveTenantFromDomain;