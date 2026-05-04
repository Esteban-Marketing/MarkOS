#!/usr/bin/env node
'use strict';

/**
 * bump-apt-package.cjs - build and publish a signed Debian apt repository tree.
 *
 * This keeps the Phase 204 distribution rule intact: the npm tarball is the
 * source artifact, and apt is only another signed front door for those bytes.
 *
 * Required CI secrets:
 *   MARKOS_APT_GPG_KEY         base64 armored private key; imported before signing
 *   MARKOS_APT_GPG_PASSPHRASE  optional key passphrase for gpg loopback mode
 *   MARKOS_APT_REPO_HOST       scp target host, for example deploy@apt.markos.dev
 *   MARKOS_APT_REPO_KEY        optional private SSH key content for upload
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const https = require('node:https');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const REGISTRY_BASE = (process.env.MARKOS_NPM_REGISTRY || 'https://registry.npmjs.org').replace(/\/+$/, '');
const DEFAULT_APT_ROOT = path.join(ROOT, 'dist', 'apt');

function usage() {
  return [
    'Usage: node scripts/distribution/bump-apt-package.cjs [--version <x.y.z>] [--dry-run]',
    '',
    'Options:',
    '  --version <x.y.z>      Release version. Defaults to package.json version.',
    '  --output-dir <path>    apt repository output root. Defaults to dist/apt.',
    '  --dry-run              Build and sign locally; skip scp upload.',
    '  --skip-sign            Build repo metadata without gpg signing.',
    '  --help                 Show this help.',
  ].join('\n');
}

function parseArgs(argv = process.argv.slice(2)) {
  const opts = {
    dryRun: false,
    help: false,
    outputDir: process.env.MARKOS_APT_DIST_DIR || DEFAULT_APT_ROOT,
    skipSign: false,
    version: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run' || arg === '--dry') {
      opts.dryRun = true;
    } else if (arg === '--skip-sign') {
      opts.skipSign = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version' && i + 1 < argv.length) {
      opts.version = argv[++i];
    } else if (arg.startsWith('--version=')) {
      opts.version = arg.slice('--version='.length);
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

function runTool(command, args, options = {}) {
  return childProcess.execFileSync(command, args, {
    encoding: options.encoding || 'utf8',
    input: options.input,
    stdio: options.stdio || 'pipe',
    cwd: options.cwd || ROOT,
  });
}

function toolExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  try {
    childProcess.execFileSync(checker, [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function requireTools(tools) {
  const missing = tools.filter((tool) => !toolExists(tool));
  if (missing.length > 0) {
    throw new Error(`missing required apt packaging tool(s): ${missing.join(', ')}`);
  }
}

function fetchBuffer(url, redirectsRemaining = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsRemaining < 0) {
      reject(new Error('too many redirects while fetching npm tarball'));
      return;
    }

    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(fetchBuffer(res.headers.location, redirectsRemaining - 1));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        res.resume();
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(60_000, () => {
      req.destroy(new Error(`timeout fetching ${url}`));
    });
  });
}

function controlFile(version) {
  return `Package: markos
Version: ${version}
Section: utils
Priority: optional
Architecture: amd64
Depends: nodejs (>= 22)
Maintainer: Inarcus <hello@markos.dev>
Description: Marketing Operating System CLI
 MarkOS is the marketing operating-system CLI. Subcommands: init, generate, plan, run, eval, login, keys, whoami, env, status, doctor.
`;
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

async function buildDeb({ version, outputDir }) {
  const normalized = normalizeVersion(version);
  const repoRoot = path.resolve(outputDir);
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-apt-'));
  const tarballPath = path.join(workDir, `markos-${normalized}.tgz`);
  const extractDir = path.join(workDir, 'extract');
  const packageDir = path.join(workDir, `markos_${normalized}_amd64`);
  const poolDir = path.join(repoRoot, 'pool', 'main', 'm', 'markos');
  const debPath = path.join(poolDir, `markos_${normalized}_amd64.deb`);

  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(poolDir, { recursive: true });

  const tarball = await fetchBuffer(tarballUrl(normalized));
  fs.writeFileSync(tarballPath, tarball);
  runTool('tar', ['-xzf', tarballPath, '-C', extractDir], { stdio: 'inherit' });

  const packageSource = path.join(extractDir, 'package');
  if (!fs.existsSync(packageSource)) {
    throw new Error('npm tarball did not contain the expected package/ directory');
  }

  const debianDir = path.join(packageDir, 'DEBIAN');
  const libDir = path.join(packageDir, 'usr', 'lib', 'markos');
  const binDir = path.join(packageDir, 'usr', 'bin');
  fs.mkdirSync(debianDir, { recursive: true });
  fs.mkdirSync(libDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  fs.writeFileSync(path.join(debianDir, 'control'), controlFile(normalized), 'utf8');
  fs.cpSync(packageSource, libDir, { recursive: true });

  const wrapperPath = path.join(binDir, 'markos');
  fs.writeFileSync(wrapperPath, '#!/bin/sh\nexec node /usr/lib/markos/bin/install.cjs "$@"\n', 'utf8');
  fs.chmodSync(wrapperPath, 0o755);

  runTool('dpkg-deb', ['--build', '--root-owner-group', packageDir, debPath], { stdio: 'inherit' });
  return { debPath, repoRoot, workDir };
}

function generatePackages(repoRoot) {
  const binaryDir = path.join(repoRoot, 'dists', 'stable', 'main', 'binary-amd64');
  fs.mkdirSync(binaryDir, { recursive: true });

  const packagesText = runTool('dpkg-scanpackages', ['--arch', 'amd64', 'pool', '/dev/null'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const packagesPath = path.join(binaryDir, 'Packages');
  fs.writeFileSync(packagesPath, packagesText, 'utf8');
  runTool('gzip', ['-kf', packagesPath], { stdio: 'inherit' });
  return {
    packagesGzPath: `${packagesPath}.gz`,
    packagesPath,
  };
}

function digestFile(file, algorithm) {
  const data = fs.readFileSync(file);
  return {
    digest: crypto.createHash(algorithm).update(data).digest('hex'),
    size: data.length,
  };
}

function releaseFile(repoRoot) {
  const stableDir = path.join(repoRoot, 'dists', 'stable');
  const packageFiles = [
    'main/binary-amd64/Packages',
    'main/binary-amd64/Packages.gz',
  ];

  const checksumBlock = (algorithm, label) => {
    const lines = [`${label}:`];
    for (const relativePath of packageFiles) {
      const { digest, size } = digestFile(path.join(stableDir, relativePath), algorithm);
      lines.push(` ${digest} ${size} ${relativePath}`);
    }
    return lines.join('\n');
  };

  const content = [
    'Origin: MarkOS',
    'Label: MarkOS',
    'Suite: stable',
    'Codename: stable',
    'Architectures: amd64',
    'Components: main',
    `Date: ${new Date().toUTCString()}`,
    'Description: MarkOS CLI apt repository',
    checksumBlock('md5', 'MD5Sum'),
    checksumBlock('sha256', 'SHA256'),
    '',
  ].join('\n');

  const releasePath = path.join(stableDir, 'Release');
  fs.writeFileSync(releasePath, content, 'utf8');
  return releasePath;
}

function importGpgKeyFromEnv() {
  const encoded = process.env.MARKOS_APT_GPG_KEY;
  if (!encoded) {
    return false;
  }
  const armored = Buffer.from(encoded, 'base64').toString('utf8');
  const args = ['--batch', '--yes'];
  if (process.env.MARKOS_APT_GPG_PASSPHRASE) {
    args.push('--pinentry-mode', 'loopback', '--passphrase', process.env.MARKOS_APT_GPG_PASSPHRASE);
  }
  args.push('--import');
  runTool('gpg', args, { input: armored, stdio: ['pipe', 'inherit', 'inherit'] });
  return true;
}

function signRelease(releasePath) {
  const stableDir = path.dirname(releasePath);
  const baseArgs = ['--batch', '--yes'];
  if (process.env.MARKOS_APT_GPG_PASSPHRASE) {
    baseArgs.push('--pinentry-mode', 'loopback', '--passphrase', process.env.MARKOS_APT_GPG_PASSPHRASE);
  }

  runTool('gpg', [
    ...baseArgs,
    '--clearsign',
    '--output',
    path.join(stableDir, 'InRelease'),
    releasePath,
  ], { stdio: 'inherit' });

  runTool('gpg', [
    ...baseArgs,
    '--detach-sign',
    '--armor',
    '--output',
    path.join(stableDir, 'Release.gpg'),
    releasePath,
  ], { stdio: 'inherit' });
}

function uploadRepo(repoRoot) {
  const host = process.env.MARKOS_APT_REPO_HOST || 'apt.markos.dev';
  const targetPath = process.env.MARKOS_APT_REPO_PATH || '.';
  const args = ['-r'];
  let keyPath = null;

  if (process.env.MARKOS_APT_REPO_KEY) {
    keyPath = path.join(os.tmpdir(), `markos-apt-repo-${Date.now()}`);
    fs.writeFileSync(keyPath, process.env.MARKOS_APT_REPO_KEY, { mode: 0o600 });
    args.push('-i', keyPath, '-o', 'StrictHostKeyChecking=accept-new');
  }

  args.push(path.join(repoRoot, 'dists'), path.join(repoRoot, 'pool'), `${host}:${targetPath}`);

  try {
    runTool('scp', args, { stdio: 'inherit' });
  } finally {
    if (keyPath) {
      fs.rmSync(keyPath, { force: true });
    }
  }
}

async function buildRepo({ version, outputDir, skipSign = false }) {
  const repoRoot = path.resolve(outputDir);
  cleanDir(repoRoot);
  const deb = await buildDeb({ version, outputDir: repoRoot });
  const packages = generatePackages(repoRoot);
  const releasePath = releaseFile(repoRoot);
  importGpgKeyFromEnv();
  if (!skipSign) {
    signRelease(releasePath);
  }
  return {
    debPath: deb.debPath,
    packagesPath: packages.packagesPath,
    packagesGzPath: packages.packagesGzPath,
    releasePath,
    repoRoot,
  };
}

async function main() {
  const opts = parseArgs();
  if (opts.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const version = normalizeVersion(opts.version || readPackageVersion());
  const tools = ['tar', 'dpkg-deb', 'dpkg-scanpackages', 'gzip'];
  if (!opts.skipSign) tools.push('gpg');
  if (!opts.dryRun) tools.push('scp');
  requireTools(tools);

  process.stderr.write(`[bump-apt-package] version: ${version}\n`);
  process.stderr.write(`[bump-apt-package] tarball: ${tarballUrl(version)}\n`);
  process.stderr.write(`[bump-apt-package] output:  ${path.resolve(opts.outputDir)}\n`);

  const result = await buildRepo({
    outputDir: opts.outputDir,
    skipSign: opts.skipSign,
    version,
  });

  process.stderr.write(`[bump-apt-package] deb:     ${result.debPath}\n`);
  process.stderr.write(`[bump-apt-package] release: ${result.releasePath}\n`);

  if (opts.dryRun) {
    process.stderr.write('[bump-apt-package] --dry-run: skipping upload\n');
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  uploadRepo(result.repoRoot);
  process.stderr.write('[bump-apt-package] uploaded apt repo tree\n');
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`[bump-apt-package] ERROR: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_APT_ROOT,
  buildDeb,
  buildRepo,
  controlFile,
  digestFile,
  fetchBuffer,
  generatePackages,
  importGpgKeyFromEnv,
  main,
  normalizeVersion,
  parseArgs,
  readPackageVersion,
  releaseFile,
  requireTools,
  signRelease,
  tarballUrl,
  toolExists,
  uploadRepo,
  usage,
};
