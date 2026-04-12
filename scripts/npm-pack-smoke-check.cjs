'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(workspaceRoot, 'package.json'));
const versionFile = fs.readFileSync(path.join(workspaceRoot, 'VERSION'), 'utf8').trim();

function fail(message) {
  console.error(`[release:smoke] ${message}`);
  process.exit(1);
}

function main() {
  if (packageJson.version !== versionFile) {
    fail(`package.json version ${packageJson.version} does not match VERSION ${versionFile}`);
  }

  const raw = execSync('npm pack --json', {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });

  let packResult;
  try {
    packResult = JSON.parse(raw);
  } catch (error) {
    fail(`could not parse npm pack JSON output: ${error.message}`);
  }

  const artifact = Array.isArray(packResult) ? packResult[0] : null;
  if (!artifact?.filename) {
    fail('npm pack did not return an artifact filename');
  }

  const tarballPath = path.join(workspaceRoot, artifact.filename);
  if (!fs.existsSync(tarballPath)) {
    fail(`expected tarball ${artifact.filename} was not created`);
  }

  if (artifact.name !== packageJson.name) {
    fail(`packed artifact name ${artifact.name} does not match package name ${packageJson.name}`);
  }

  if (artifact.version !== packageJson.version) {
    fail(`packed artifact version ${artifact.version} does not match package version ${packageJson.version}`);
  }

  const packedFiles = new Set((artifact.files || []).map((entry) => entry.path));
  const requiredFiles = [
    'package.json',
    'bin/install.cjs',
    'bin/update.cjs',
    'README.md',
    'CHANGELOG.md',
    'VERSION',
    '.agent/markos/VERSION',
    'onboarding/backend/server.cjs',
  ];

  for (const filePath of requiredFiles) {
    if (!packedFiles.has(filePath)) {
      fs.rmSync(tarballPath, { force: true });
      fail(`packed artifact is missing required file: ${filePath}`);
    }
  }

  const binTarget = packageJson.bin?.markos;
  if (!binTarget || !packedFiles.has(binTarget.replace(/^\.\//, ''))) {
    fs.rmSync(tarballPath, { force: true });
    fail(`packed artifact is missing the configured bin target: ${binTarget || '<unset>'}`);
  }

  fs.rmSync(tarballPath, { force: true });
  console.log(`[release:smoke] OK ${artifact.filename}`);
  console.log(`[release:smoke] verified ${requiredFiles.length} required files for ${packageJson.name}@${packageJson.version}`);
}

main();