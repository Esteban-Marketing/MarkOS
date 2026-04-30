#!/usr/bin/env node
'use strict';

/**
 * bump-winget-manifest.cjs - render winget manifests for the npm-published CLI.
 *
 * The npm tarball remains the single source artifact. This script mirrors the
 * Scoop bump flow: resolve a release version, fetch/hash the tarball, and write
 * deterministic manifest YAML under the winget-pkgs tree.
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const REGISTRY_BASE = (process.env.MARKOS_NPM_REGISTRY || 'https://registry.npmjs.org').replace(/\/+$/, '');
const DEFAULT_MANIFEST_ROOT = path.join(ROOT, 'winget-pkgs', 'manifests', 'm', 'markos', 'markos');

const FILES = {
  version: 'markos.markos.yaml',
  installer: 'markos.markos.installer.yaml',
  locale: 'markos.markos.locale.en-US.yaml',
};

function usage() {
  return [
    'Usage: node scripts/distribution/bump-winget-manifest.cjs [--version <x.y.z>] [--sha256 <hex>] [--dry-run]',
    '',
    'Options:',
    '  --version <x.y.z>     Release version. Defaults to package.json version.',
    '  --sha256 <hex>        Precomputed tarball sha256. When omitted, npm tarball is fetched.',
    '  --output-dir <path>   Directory that contains version subdirectories.',
    '  --dry-run             Print rendered file contents as JSON; do not write.',
    '  --help                Show this help.',
  ].join('\n');
}

function parseArgs(argv = process.argv.slice(2)) {
  const opts = {
    dryRun: false,
    help: false,
    outputDir: process.env.MARKOS_WINGET_MANIFEST_ROOT || DEFAULT_MANIFEST_ROOT,
    sha256: null,
    version: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run' || arg === '--dry') {
      opts.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version' && i + 1 < argv.length) {
      opts.version = argv[++i];
    } else if (arg.startsWith('--version=')) {
      opts.version = arg.slice('--version='.length);
    } else if (arg === '--sha256' && i + 1 < argv.length) {
      opts.sha256 = argv[++i];
    } else if (arg.startsWith('--sha256=')) {
      opts.sha256 = arg.slice('--sha256='.length);
    } else if (arg === '--output-dir' && i + 1 < argv.length) {
      opts.outputDir = path.resolve(argv[++i]);
    } else if (arg.startsWith('--output-dir=')) {
      opts.outputDir = path.resolve(arg.slice('--output-dir='.length));
    } else if (!arg.startsWith('-') && !opts.version) {
      opts.version = arg;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  return opts;
}

function normalizeVersion(version) {
  const raw = String(version || '').trim();
  const normalized = raw.replace(/^refs\/tags\//, '').replace(/^v(?=\d+\.\d+\.\d+)/, '');
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(normalized)) {
    throw new Error(`invalid semver version: ${version}`);
  }
  return normalized;
}

function readPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  if (!pkg.version || typeof pkg.version !== 'string') {
    throw new Error(`package.json missing version string (got ${JSON.stringify(pkg.version)})`);
  }
  return pkg.version;
}

function tarballUrl(version) {
  return `${REGISTRY_BASE}/markos/-/markos-${normalizeVersion(version)}.tgz`;
}

function fetchSha256(url, redirectsRemaining = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsRemaining < 0) {
      reject(new Error('too many redirects while fetching npm tarball'));
      return;
    }

    const req = https.get(url, (res) => {
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

function versionManifest(version) {
  return `PackageIdentifier: markos.markos
PackageVersion: ${version}
DefaultLocale: en-US
ManifestType: version
ManifestVersion: 1.6.0
`;
}

function installerManifest(version, sha256) {
  return `PackageIdentifier: markos.markos
PackageVersion: ${version}
Platform:
  - Windows.Desktop
MinimumOSVersion: 10.0.17763.0
InstallerType: zip
NestedInstallerType: portable
NestedInstallerFiles:
  - RelativeFilePath: package\\bin\\install.cjs
    PortableCommandAlias: markos
Commands:
  - markos
Installers:
  - Architecture: x64
    InstallerUrl: ${tarballUrl(version)}
    InstallerSha256: ${sha256}
ManifestType: installer
ManifestVersion: 1.6.0
`;
}

function localeManifest(version) {
  return `PackageIdentifier: markos.markos
PackageVersion: ${version}
PackageLocale: en-US
Publisher: Inarcus
PublisherUrl: https://markos.esteban.marketing
PublisherSupportUrl: https://github.com/Esteban-Marketing/MarkOS/issues
PackageName: MarkOS
PackageUrl: https://markos.esteban.marketing
License: MIT
LicenseUrl: https://github.com/Esteban-Marketing/MarkOS/blob/main/LICENSE
ShortDescription: Marketing Operating System CLI - generate, plan, run, and evaluate marketing assets from briefs.
Description: |
  MarkOS is the marketing operating-system CLI. Subcommands include init, generate, plan, run, eval, login, keys, whoami, env, status, and doctor.
Tags:
  - cli
  - marketing
  - automation
  - ai
ManifestType: defaultLocale
ManifestVersion: 1.6.0
`;
}

function renderManifests({ version, sha256 }) {
  const normalized = normalizeVersion(version);
  if (!sha256 || !/^[0-9A-Za-z]+$/.test(sha256)) {
    throw new Error('sha256 is required to render winget installer manifest');
  }

  return {
    [FILES.version]: versionManifest(normalized),
    [FILES.installer]: installerManifest(normalized, sha256),
    [FILES.locale]: localeManifest(normalized),
  };
}

function writeManifests(manifests, { outputDir, version }) {
  const targetDir = path.join(outputDir, normalizeVersion(version));
  fs.mkdirSync(targetDir, { recursive: true });
  for (const filename of Object.values(FILES)) {
    fs.writeFileSync(path.join(targetDir, filename), manifests[filename], 'utf8');
  }
  return targetDir;
}

async function main() {
  const opts = parseArgs();
  if (opts.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const version = normalizeVersion(opts.version || readPackageVersion());
  const url = tarballUrl(version);
  const sha256 = opts.sha256 || await fetchSha256(url);
  const manifests = renderManifests({ version, sha256 });

  process.stderr.write(`[bump-winget-manifest] version: ${version}\n`);
  process.stderr.write(`[bump-winget-manifest] tarball: ${url}\n`);
  process.stderr.write(`[bump-winget-manifest] sha256:  ${sha256}\n`);

  if (opts.dryRun) {
    process.stdout.write(`${JSON.stringify(manifests, null, 2)}\n`);
    process.stderr.write('[bump-winget-manifest] --dry-run: not writing files\n');
    return;
  }

  const targetDir = writeManifests(manifests, { outputDir: opts.outputDir, version });
  process.stderr.write(`[bump-winget-manifest] wrote ${targetDir}\n`);
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`[bump-winget-manifest] ERROR: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_MANIFEST_ROOT,
  FILES,
  fetchSha256,
  normalizeVersion,
  parseArgs,
  readPackageVersion,
  renderManifests,
  tarballUrl,
  usage,
  writeManifests,
};
