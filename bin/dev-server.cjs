'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_ROOT = path.join(PROJECT_ROOT, 'api');
const ONBOARDING_ROOT = path.join(PROJECT_ROOT, 'onboarding');
const ONBOARDING_PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');
const STATIC_MIME = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
});
const LEGACY_ROUTE_ALIASES = Object.freeze({
  '/approve': '/api/approve',
  '/campaign/result': '/api/campaign/result',
  '/config': '/api/config',
  '/linear/sync': '/api/linear/sync',
  '/migrate/local-to-cloud': '/api/migrate',
  '/regenerate': '/api/regenerate',
  '/status': '/api/status',
  '/submit': '/api/submit',
});
const DIRECT_HANDLER_ROUTES = Object.freeze({
  'GET /admin/literacy/health': 'handleLiteracyHealth',
  'POST /admin/literacy/query': 'handleLiteracyQuery',
  'POST /api/competitor-discovery': 'handleCompetitorDiscovery',
  'POST /api/extract-and-score': 'handleExtractAndScore',
  'POST /api/extract-sources': 'handleExtractSources',
  'POST /api/generate-question': 'handleGenerateQuestion',
  'POST /api/parse-answer': 'handleParseAnswer',
  'POST /api/spark-suggestion': 'handleSparkSuggestion',
});

try {
  require('dotenv').config({ path: path.join(PROJECT_ROOT, '.env') });
} catch {}

function normalizeRoutePath(pathname) {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

function isPathInsideBase(targetPath, basePath) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(basePath);

  if (process.platform === 'win32') {
    return resolvedTarget.toLowerCase().startsWith(resolvedBase.toLowerCase() + path.sep) || resolvedTarget.toLowerCase() === resolvedBase.toLowerCase();
  }

  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

function toQueryObject(searchParams) {
  const query = {};
  for (const [key, value] of searchParams.entries()) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      const current = query[key];
      query[key] = Array.isArray(current) ? current.concat(value) : [current, value];
      continue;
    }
    query[key] = value;
  }
  return query;
}

function resolveLegacyApiRoute(pathname) {
  const normalizedPath = normalizeRoutePath(pathname);
  const aliasedPath = LEGACY_ROUTE_ALIASES[normalizedPath] || normalizedPath;

  if (!aliasedPath.startsWith('/api/')) {
    return null;
  }

  const relativeApiPath = aliasedPath.slice('/api/'.length);
  if (!relativeApiPath) {
    return null;
  }

  const modulePath = path.join(API_ROOT, `${relativeApiPath}.js`);
  if (!isPathInsideBase(modulePath, API_ROOT) || !fs.existsSync(modulePath)) {
    return null;
  }

  return modulePath;
}

function resolveOnboardingAssetPath(pathname) {
  const normalizedPath = normalizeRoutePath(pathname);
  let relativePath = null;

  if (normalizedPath === '/onboarding') {
    relativePath = 'index.html';
  } else if (normalizedPath.startsWith('/onboarding/')) {
    relativePath = normalizedPath.slice('/onboarding/'.length);
  } else if (normalizedPath.startsWith('/onboarding.')) {
    relativePath = normalizedPath.slice(1);
  }

  if (!relativePath) {
    return null;
  }

  const filePath = path.join(ONBOARDING_ROOT, relativePath);
  if (!isPathInsideBase(filePath, ONBOARDING_ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return null;
  }

  return filePath;
}

function loadFreshModule(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function attachResponseHelpers(res) {
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };

  res.json = (payload) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return res;
  };

  res.send = (payload) => {
    if (payload !== undefined && !res.headersSent) {
      res.end(payload);
    }
    return res;
  };

  return res;
}

function buildLocalAuthContext(env = process.env) {
  const tenantId = String(env.MARKOS_ACTIVE_TENANT_ID || 'tenant-alpha-001').trim() || 'tenant-alpha-001';
  const role = String(env.MARKOS_ACTIVE_ROLE || 'owner').trim() || 'owner';
  const userId = String(env.MARKOS_ACTIVE_USER_ID || 'local-operator').trim() || 'local-operator';

  return {
    iamRole: role,
    ok: true,
    principal: {
      active_tenant_id: tenantId,
      id: userId,
      tenant_id: tenantId,
      tenant_role: role,
      type: 'runtime_local',
    },
    role,
    status: 200,
    tenant_id: tenantId,
    userId,
  };
}

function buildPluginTenantContext(env = process.env) {
  const auth = buildLocalAuthContext(env);
  const pluginEnabled = String(env.MARKOS_PLUGIN_ENABLED || 'true').trim().toLowerCase() !== 'false';
  const configuredCapabilities = String(env.MARKOS_PLUGIN_CAPABILITIES || '').trim();
  const defaultCapabilities = [
    'publish_campaigns',
    'read_approvals',
    'read_campaigns',
    'read_drafts',
    'write_approvals',
    'write_campaigns',
  ];
  const grantedCapabilities = configuredCapabilities
    ? configuredCapabilities.split(',').map((value) => value.trim()).filter(Boolean)
    : defaultCapabilities;

  return {
    grantedCapabilities,
    pluginEnabled,
    role: auth.role,
    tenantId: auth.tenant_id,
    userId: auth.userId,
  };
}

async function readJsonBody(req) {
  if (req.body) {
    return req.body;
  }

  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    return {};
  }

  await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        req.body = text ? JSON.parse(text) : {};
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

  return req.body;
}

function prepareRequest(req, pathname, searchParams, params = {}) {
  req.path = pathname;
  req.params = params;
  req.query = toQueryObject(searchParams);
  req.markosAuth = buildLocalAuthContext();
  req.tenantContext = buildPluginTenantContext();
  return req;
}

async function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = STATIC_MIME[ext] || 'application/octet-stream';
  const body = await fs.promises.readFile(filePath);
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(body);
}

async function handleDirectRoute(req, res, routeKey) {
  const handlers = loadFreshModule(path.join(PROJECT_ROOT, 'onboarding', 'backend', 'handlers.cjs'));
  const handlerName = DIRECT_HANDLER_ROUTES[routeKey];
  if (!handlerName || typeof handlers[handlerName] !== 'function') {
    return false;
  }

  await readJsonBody(req);
  await handlers[handlerName](req, res);
  return true;
}

function matchPluginRoute(routePath, pathname) {
  const paramNames = [];
  const pattern = routePath.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const matcher = new RegExp(`^${pattern}$`);
  const match = pathname.match(matcher);
  if (!match) {
    return null;
  }

  const params = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  return params;
}

async function handlePluginRoute(req, res, pathname, searchParams) {
  const { digitalAgencyPlugin } = loadFreshModule(path.join(PROJECT_ROOT, 'lib', 'markos', 'plugins', 'digital-agency', 'index.js'));
  if (!digitalAgencyPlugin) {
    return false;
  }

  const method = String(req.method || 'GET').toUpperCase();
  for (const route of digitalAgencyPlugin.routes || []) {
    if (route.method !== method) {
      continue;
    }

    const params = matchPluginRoute(route.path, pathname);
    if (!params) {
      continue;
    }

    prepareRequest(req, pathname, searchParams, params);
    await readJsonBody(req);
    await route.handler(req, attachResponseHelpers(res));
    return true;
  }

  return false;
}

async function handleApiRoute(req, res, pathname, searchParams) {
  const routeKey = `${String(req.method || 'GET').toUpperCase()} ${pathname}`;
  if (DIRECT_HANDLER_ROUTES[routeKey]) {
    prepareRequest(req, pathname, searchParams);
    await handleDirectRoute(req, res, routeKey);
    return true;
  }

  const modulePath = resolveLegacyApiRoute(pathname);
  if (!modulePath) {
    return false;
  }

  prepareRequest(req, pathname, searchParams);
  await readJsonBody(req);
  const handler = loadFreshModule(modulePath);
  await handler(req, attachResponseHelpers(res));
  return true;
}

function applyLocalDevDefaults(port, env = process.env) {
  if (!env.MARKOS_ACTIVE_TENANT_ID) {
    env.MARKOS_ACTIVE_TENANT_ID = 'tenant-alpha-001';
  }
  if (!env.MARKOS_ACTIVE_ROLE) {
    env.MARKOS_ACTIVE_ROLE = 'owner';
  }
  if (!env.MARKOS_ACTIVE_USER_ID) {
    env.MARKOS_ACTIVE_USER_ID = 'local-operator';
  }
  if (!env.NEXT_PUBLIC_APP_URL) {
    env.NEXT_PUBLIC_APP_URL = `http://127.0.0.1:${port}`;
  }
}

async function startDevServer({ port = Number(process.env.PORT || 3000), hostname = '127.0.0.1' } = {}) {
  applyLocalDevDefaults(port);

  const next = require('next');
  const nextApp = next({ dev: true, dir: PROJECT_ROOT, hostname, port });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${hostname}:${port}`}`);
      const pathname = normalizeRoutePath(requestUrl.pathname);

      if (await handleApiRoute(req, res, pathname, requestUrl.searchParams)) {
        return;
      }

      if (await handlePluginRoute(req, res, pathname, requestUrl.searchParams)) {
        return;
      }

      const onboardingAssetPath = resolveOnboardingAssetPath(pathname);
      if (onboardingAssetPath) {
        await serveStaticFile(res, onboardingAssetPath);
        return;
      }

      if (pathname.startsWith('/public/')) {
        const publicPath = path.join(ONBOARDING_PUBLIC_ROOT, pathname.slice('/public/'.length));
        if (isPathInsideBase(publicPath, ONBOARDING_PUBLIC_ROOT) && fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
          await serveStaticFile(res, publicPath);
          return;
        }
      }

      await handle(req, res);
    } catch (error) {
      console.error('Unified dev server request failed:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      }
      res.end(JSON.stringify({ success: false, error: 'DEV_SERVER_ERROR', message: error.message }));
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, hostname, resolve);
  });

  const address = server.address();
  console.log(`MarkOS unified dev server listening on http://${hostname}:${address.port}`);
  console.log(`Active tenant: ${process.env.MARKOS_ACTIVE_TENANT_ID} (${process.env.MARKOS_ACTIVE_ROLE})`);
  return server;
}

if (require.main === module) {
  startDevServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  buildLocalAuthContext,
  buildPluginTenantContext,
  resolveLegacyApiRoute,
  resolveOnboardingAssetPath,
  startDevServer,
};