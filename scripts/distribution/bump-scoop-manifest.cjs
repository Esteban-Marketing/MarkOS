#!/usr/bin/env node
'use strict';

/**
 * bump-scoop-manifest.cjs — rewrite bucket/markos.json for a new release.
 *
 * Mirrors scripts/distribution/bump-homebrew-formula.cjs shape, but uses
 * JSON.parse + JSON.stringify (instead of regex) because the manifest is
 * structured JSON and Scoop's schema.json validates field types.
 *
 * Pipeline:
 *   1. Read package.json → locked version (source of truth per QA-03).
 *   2. Fetch https://registry.npmjs.org/markos/-/markos-<VERSION>.tgz.
 *   3. Stream sha256 of the tarball (no full buffer in memory).
 *   4. Parse bucket/markos.json → update version + url + hash (sha256: prefix).
 *   5. Write back pretty-printed (2-space indent) preserving schema shape.
 *   6. Print before/after diff; exit 0 on success, non-zero on failure.
 *
 * Usage:
 *   node scripts/distribution/bump-scoop-manifest.cjs
 *   node scripts/distribution/bump-scoop-manifest.cjs --version 3.4.0
 *   node scripts/distribution/bump-scoop-manifest.cjs --dry-run
 *
 * Env:
 *   MARKOS_NPM_REGISTRY   — override https://registry.npmjs.org (testing)
 *   MARKOS_SCOOP_MANIFEST — override bucket/markos.json path (testing)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG_JSON = path.join(REPO_ROOT, 'package.json');
const MANIFEST_PATH = process.env.MARKOS_SCOOP_MANIFEST
  || path.join(REPO_ROOT, 'bucket', 'markos.json');
const REGISTRY_BASE = (process.env.MARKOS_NPM_REGISTRY || 'https://registry.npmjs.org').replace(/\/+$/, '');

function parseArgs(argv) {
  const opts = { dryRun: false, version: null };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--version' && i + 1 < argv.length) {
      opts.version = argv[++i];
    } else if (arg.startsWith('--version=')) {
      opts.version = arg.slice('--version='.length);
    }
  }
  return opts;
}

function readPackageVersion() {
  const raw = fs.readFileSync(PKG_JSON, 'utf8');
  const pkg = JSON.parse(raw);
  if (!pkg.version || typeof pkg.version !== 'string') {
    throw new Error(`package.json missing version string (got ${JSON.stringify(pkg.version)})`);
  }
  return pkg.version;
}

function tarballUrl(version) {
  return `${REGISTRY_BASE}/markos/-/markos-${version}.tgz`;
}

function fetchSha256(url, redirectsRemaining = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsRemaining < 0) {
      reject(new Error('too many redirects'));
      return;
    }
    const req = https.get(url, (res) => {
      // Follow redirects (npm CDN occasionally 302s to cloudfront)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(fetchSha256(res.headers.location, redirectsRemaining - 1));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        res.resume();
        return;
      }
      const hash = crypto.createHash('sha256');
      res.on('data', (chunk) => hash.update(chunk));
      res.on('end', () => resolve(hash.digest('hex')));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(60_000, () => {
      req.destroy(new Error(`timeout fetching ${url}`));
    });
  });
}

function readManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return { raw, json: JSON.parse(raw) };
}

function writeManifest(manifest) {
  // Preserve 2-space indent + trailing newline (parity with current file)
  const out = JSON.stringify(manifest, null, 2) + '\n';
  fs.writeFileSync(MANIFEST_PATH, out, 'utf8');
  return out;
}

function rewriteManifest(manifest, { version, sha256 }) {
  const next = JSON.parse(JSON.stringify(manifest)); // deep clone
  next.version = version;
  next.url = tarballUrl(version);
  next.hash = `sha256:${sha256}`;
  return next;
}

function diffSummary(before, after) {
  const fields = ['version', 'url', 'hash'];
  const lines = [];
  for (const f of fields) {
    if (before[f] !== after[f]) {
      lines.push(`  - ${f}:\n      before: ${before[f]}\n      after:  ${after[f]}`);
    }
  }
  return lines.length ? lines.join('\n') : '  (no field changes)';
}

async function main() {
  const opts = parseArgs(process.argv);
  const version = opts.version || readPackageVersion();
  const url = tarballUrl(version);

  process.stderr.write(`[bump-scoop-manifest] version: ${version}\n`);
  process.stderr.write(`[bump-scoop-manifest] tarball: ${url}\n`);

  const sha256 = await fetchSha256(url);
  process.stderr.write(`[bump-scoop-manifest] sha256:  ${sha256}\n`);

  const { json: before } = readManifest();
  const after = rewriteManifest(before, { version, sha256 });

  process.stderr.write(`[bump-scoop-manifest] diff:\n${diffSummary(before, after)}\n`);

  if (opts.dryRun) {
    process.stderr.write('[bump-scoop-manifest] --dry-run: not writing file\n');
    return;
  }

  writeManifest(after);
  process.stderr.write(`[bump-scoop-manifest] wrote ${MANIFEST_PATH}\n`);
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`[bump-scoop-manifest] ERROR: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  readPackageVersion,
  tarballUrl,
  fetchSha256,
  readManifest,
  writeManifest,
  rewriteManifest,
  diffSummary,
};
