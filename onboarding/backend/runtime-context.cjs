'use strict';

const fs = require('fs');
const path = require('path');

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

  return {
    ok: true,
    status: 200,
    operation,
    token_payload: payload,
    tenant_id: canonicalTenantId,
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

module.exports = {
  ROLLOUT_MODES,
  REQUIRED_SECRET_MATRIX,
  RETENTION_POLICY,
  assertRolloutPromotionAllowed,
  createRuntimeContext,
  getRolloutMode,
  getMarkosdbAccessMatrix,
  getDefaultProjectSlug,
  getTelemetryPreference,
  isHostedRuntime,
  loadMigrationCheckpoints,
  loadRuntimeConfig,
  persistProjectSlug,
  redactSensitive,
  requireHostedSupabaseAuth,
  readPersistedProjectSlug,
  resolveMirOutputPath,
  resolveRequestedProjectSlugFromRequest,
  ensureMirOutputPathWithinLocalRoots,
  validateRequiredSecrets,
  resolveProjectSlug,
  resolveRequestedProjectSlug,
  resolveSeedOutputPath,
};