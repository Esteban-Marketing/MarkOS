#!/usr/bin/env node
'use strict';

// scripts/distribution/bump-homebrew-formula.cjs
// Phase 204 Plan 10 — rewrites Formula/markos.rb `url` + `sha256` for the
// current package.json version.
//
// Flow:
//   1. Read package.json → version.
//   2. Construct tarball URL: https://registry.npmjs.org/markos/-/markos-<version>.tgz
//   3. Stream the tarball via HTTPS, piping bytes through crypto.createHash('sha256').
//   4. Rewrite the url + sha256 lines in Formula/markos.rb.
//   5. Print old-vs-new diff; exit 0 on success, 1 on error.
//
// Usage:
//   node scripts/distribution/bump-homebrew-formula.cjs          # live bump
//   node scripts/distribution/bump-homebrew-formula.cjs --dry    # no write; print plan
//
// Consumed by release CI (Plan 204-12) as the fallback path when the 3rd-party
// mislav/bump-homebrew-formula-action is unavailable.

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const FORMULA_PATH = path.join(ROOT, 'Formula', 'markos.rb');
const REGISTRY = 'https://registry.npmjs.org/markos/-/markos-';

function readVersion() {
  const raw = fs.readFileSync(PKG_PATH, 'utf-8');
  const pkg = JSON.parse(raw);
  if (!pkg.version || typeof pkg.version !== 'string') {
    throw new Error(`package.json version missing or invalid: ${pkg.version}`);
  }
  return pkg.version;
}

function tarballUrl(version) {
  return `${REGISTRY}${version}.tgz`;
}

// Follows a single 301/302 redirect then streams response body through sha256.
function fetchSha256(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        const loc = res.headers.location;
        if (!loc) {
          reject(new Error(`redirect ${res.statusCode} with no Location header`));
          return;
        }
        res.resume();
        fetchSha256(loc).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`GET ${url} → HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      const hash = crypto.createHash('sha256');
      let bytes = 0;
      res.on('data', (chunk) => {
        hash.update(chunk);
        bytes += chunk.length;
      });
      res.on('end', () => {
        resolve({ sha256: hash.digest('hex'), bytes });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(60_000, () => {
      req.destroy(new Error(`timeout fetching ${url}`));
    });
  });
}

function rewriteFormula(formulaText, newUrl, newSha256) {
  const before = formulaText;
  const urlPattern = /^(\s*url\s+)"[^"]+"/m;
  const shaPattern = /^(\s*sha256\s+)"[^"]+"/m;

  if (!urlPattern.test(before)) {
    throw new Error('Formula/markos.rb: could not locate `url "…"` line');
  }
  if (!shaPattern.test(before)) {
    throw new Error('Formula/markos.rb: could not locate `sha256 "…"` line');
  }

  const out = before
    .replace(urlPattern, `$1"${newUrl}"`)
    .replace(shaPattern, `$1"${newSha256}"`);

  return { before, after: out };
}

function simpleDiff(before, after) {
  const bLines = before.split('\n');
  const aLines = after.split('\n');
  const max = Math.max(bLines.length, aLines.length);
  const out = [];
  for (let i = 0; i < max; i += 1) {
    if (bLines[i] !== aLines[i]) {
      if (bLines[i] !== undefined) out.push(`- ${bLines[i]}`);
      if (aLines[i] !== undefined) out.push(`+ ${aLines[i]}`);
    }
  }
  return out.join('\n');
}

async function main() {
  const dry = process.argv.includes('--dry') || process.argv.includes('--dry-run');

  const version = readVersion();
  const url = tarballUrl(version);
  process.stderr.write(`[bump-homebrew] version=${version}\n`);
  process.stderr.write(`[bump-homebrew] url=${url}\n`);

  const { sha256, bytes } = await fetchSha256(url);
  process.stderr.write(`[bump-homebrew] sha256=${sha256} (${bytes} bytes)\n`);

  const formulaText = fs.readFileSync(FORMULA_PATH, 'utf-8');
  const { before, after } = rewriteFormula(formulaText, url, sha256);

  if (before === after) {
    process.stdout.write('[bump-homebrew] no changes (formula already at target version + sha256)\n');
    return;
  }

  const diff = simpleDiff(before, after);
  process.stdout.write(`${diff}\n`);

  if (dry) {
    process.stderr.write('[bump-homebrew] --dry: skipping write\n');
    return;
  }

  fs.writeFileSync(FORMULA_PATH, after, 'utf-8');
  process.stderr.write(`[bump-homebrew] wrote ${FORMULA_PATH}\n`);
}

// Exported for unit tests (rewriteFormula + tarballUrl are pure).
module.exports = {
  readVersion,
  tarballUrl,
  rewriteFormula,
  fetchSha256,
  simpleDiff,
  FORMULA_PATH,
  PKG_PATH,
};

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`[bump-homebrew] error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
