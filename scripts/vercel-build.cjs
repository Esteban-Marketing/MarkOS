'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const gateConfig = require(path.join(workspaceRoot, 'vercel.function-gate.config.cjs'));

const ROUTE_FILE_NAMES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'route.ts', 'route.tsx', 'route.js', 'route.jsx']);
const API_FILE_PATTERN = /\.js$/i;
const STORY_FILE_PATTERN = /\.stories\.[jt]sx?$/i;
const GATED_SUFFIX = '.vercel-gated';

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(dirPath, collector) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath, collector);
      continue;
    }
    collector(entryPath);
  }
}

function collectRouteCandidates() {
  const candidates = [];

  walk(path.join(workspaceRoot, 'app'), (filePath) => {
    if (ROUTE_FILE_NAMES.has(path.basename(filePath))) {
      candidates.push(filePath);
    }
  });

  walk(path.join(workspaceRoot, 'api'), (filePath) => {
    if (API_FILE_PATTERN.test(filePath)) {
      candidates.push(filePath);
    }
  });

  return candidates;
}

function collectStoryCandidates() {
  const candidates = [];

  walk(path.join(workspaceRoot, 'app'), (filePath) => {
    if (STORY_FILE_PATTERN.test(filePath)) {
      candidates.push(filePath);
    }
  });

  return candidates;
}

function escapeRegexFragment(value) {
  return value.replaceAll(/[-/\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
}

function globToRegExp(glob) {
  let pattern = '^';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const nextChar = glob[index + 1];
    if (char === '*' && nextChar === '*') {
      pattern += '.*';
      index += 1;
      continue;
    }
    if (char === '*') {
      pattern += '[^/]*';
      continue;
    }
    pattern += escapeRegexFragment(char);
  }
  pattern += '$';
  return new RegExp(pattern);
}

function resolveIncludedRoutes(profileName) {
  const override = process.env.MARKOS_ALLOWED_SERVERLESS_ROUTES;
  if (override?.trim()) {
    return override
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  const profile = gateConfig.profiles[profileName];
  if (!profile) {
    throw new Error(`Unknown deployment profile '${profileName}'.`);
  }

  return profile.include || [];
}

function shouldKeepRoute(relativePath, allowPatterns) {
  return allowPatterns.some((pattern) => pattern.test(relativePath));
}

function getProfileName() {
  const explicitProfile = process.env.MARKOS_DEPLOY_PROFILE;
  if (explicitProfile) {
    return explicitProfile;
  }

  if (process.env.VERCEL === '1' && process.env.MARKOS_HOBBY_GATE === '1') {
    return 'hobby';
  }

  return 'full';
}

function gateRoutes(profileName) {
  if (profileName === 'full') {
    return { gated: [], kept: collectRouteCandidates().length };
  }

  const includePatterns = resolveIncludedRoutes(profileName).map(globToRegExp);
  const routeCandidates = collectRouteCandidates();
  const storyCandidates = collectStoryCandidates();
  const gated = [];
  let kept = 0;

  for (const absolutePath of routeCandidates) {
    const relativePath = toPosixPath(path.relative(workspaceRoot, absolutePath));
    if (shouldKeepRoute(relativePath, includePatterns)) {
      kept += 1;
      continue;
    }

    const gatedPath = `${absolutePath}${GATED_SUFFIX}`;
    fs.renameSync(absolutePath, gatedPath);
    gated.push({ absolutePath, gatedPath, relativePath });
  }

  for (const absolutePath of storyCandidates) {
    const relativePath = toPosixPath(path.relative(workspaceRoot, absolutePath));
    const gatedPath = `${absolutePath}${GATED_SUFFIX}`;
    fs.renameSync(absolutePath, gatedPath);
    gated.push({ absolutePath, gatedPath, relativePath });
  }

  const maxFunctions = Number(process.env.MARKOS_SERVERLESS_BUDGET || gateConfig.maxFunctions || 12);
  if (kept > maxFunctions) {
    throw new Error(`Profile '${profileName}' still keeps ${kept} serverless entry files, which exceeds the configured budget of ${maxFunctions}.`);
  }

  return { gated, kept };
}

function restoreRoutes(gatedRoutes) {
  for (const entry of gatedRoutes.reverse()) {
    if (fs.existsSync(entry.gatedPath)) {
      fs.renameSync(entry.gatedPath, entry.absolutePath);
    }
  }
}

function runNextBuild() {
  const nextBinPath = require.resolve('next/dist/bin/next');
  const result = spawnSync(process.execPath, [nextBinPath, 'build'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (typeof result.status === 'number') {
    process.exitCode = result.status;
    return;
  }

  if (result.error) {
    throw result.error;
  }
}

function main() {
  const profileName = getProfileName();
  const dryRun = process.argv.includes('--dry-run');
  const profile = gateConfig.profiles[profileName];
  if (!profile) {
    throw new Error(`Unknown deployment profile '${profileName}'. Available profiles: ${Object.keys(gateConfig.profiles).join(', ')}`);
  }

  console.log(`[vercel-build] Using '${profileName}' profile: ${profile.description}`);

  const routeCandidates = collectRouteCandidates();
  console.log(`[vercel-build] Discovered ${routeCandidates.length} serverless entry files before gating.`);

  let gateResult = { gated: [], kept: routeCandidates.length };
  try {
    gateResult = gateRoutes(profileName);
    console.log(`[vercel-build] Keeping ${gateResult.kept} serverless entry files after gating.`);

    if (gateResult.gated.length > 0) {
      console.log('[vercel-build] Gated routes:');
      for (const entry of gateResult.gated) {
        console.log(`  - ${entry.relativePath}`);
      }
    }

    if (dryRun) {
      return;
    }

    runNextBuild();
  } finally {
    restoreRoutes(gateResult.gated);
  }
}

main();