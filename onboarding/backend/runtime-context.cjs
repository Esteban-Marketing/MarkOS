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

function isHostedRuntime(env = process.env) {
  return Boolean(env.VERCEL || env.NETLIFY || env.AWS_LAMBDA_FUNCTION_NAME);
}

function getTelemetryPreference(env = process.env) {
  return env.MARKOS_TELEMETRY ?? env.MGSD_TELEMETRY;
}

function loadRuntimeConfig(env = process.env) {
  let config = {
    port: 4242,
    auto_open_browser: true,
    output_path: '../onboarding-seed.json',
    chroma_host: env.CHROMA_CLOUD_URL || 'http://localhost:8000',
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
  if (config.mir_output_path) {
    return path.resolve(PROJECT_ROOT, config.mir_output_path);
  }

  return path.join(LEGACY_LOCAL_DIR, 'MIR');
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

module.exports = {
  createRuntimeContext,
  getDefaultProjectSlug,
  getTelemetryPreference,
  isHostedRuntime,
  loadRuntimeConfig,
  persistProjectSlug,
  readPersistedProjectSlug,
  resolveMirOutputPath,
  resolveProjectSlug,
  resolveRequestedProjectSlug,
  resolveSeedOutputPath,
};