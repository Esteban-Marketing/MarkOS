'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { detectObsidianInstall } = require('./cli-runtime.cjs');

const VAULT_FAMILY_TARGETS = Object.freeze({
  execution: Object.freeze({ label: 'Execution', directory: 'Execution' }),
  evidence: Object.freeze({ label: 'Evidence', directory: 'Evidence' }),
  reviews: Object.freeze({ label: 'Reviews', directory: 'Reviews' }),
});

function readInstallManifest(cwd) {
  const manifestPath = path.join(cwd, '.markos-install-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function resolvePortableProjectPath(cwd, relativePath, fallbackPath) {
  if (!relativePath) {
    return fallbackPath;
  }

  const normalized = String(relativePath).split('/').join(path.sep);
  return path.resolve(cwd, normalized);
}

function resolveVaultArtifacts(cwd) {
  const manifest = readInstallManifest(cwd);
  const vaultRoot = resolvePortableProjectPath(
    cwd,
    manifest && manifest.vault_root,
    path.join(cwd, 'MarkOS-Vault')
  );
  const homeNotePath = resolvePortableProjectPath(
    cwd,
    manifest && manifest.vault_home_note,
    path.join(cwd, 'MarkOS-Vault', 'Home', 'HOME.md')
  );

  return {
    manifest,
    vaultRoot,
    homeNotePath,
  };
}

function resolveFamilyTargetPath(vaultRoot, vaultFamily) {
  if (!vaultFamily) {
    return null;
  }

  const key = String(vaultFamily).trim().toLowerCase();
  const family = VAULT_FAMILY_TARGETS[key];
  if (!family) {
    return null;
  }

  const directoryPath = path.join(vaultRoot, family.directory);
  const preferredNames = [
    `${family.label.toUpperCase()}.md`,
    'INDEX.md',
    'README.md',
  ];

  for (const fileName of preferredNames) {
    const candidate = path.join(directoryPath, fileName);
    if (fs.existsSync(candidate)) {
      return {
        key,
        label: family.label,
        targetPath: candidate,
      };
    }
  }

  return {
    key,
    label: family.label,
    targetPath: directoryPath,
  };
}

function buildObsidianOpenUri(targetPath) {
  return `obsidian://open?path=${encodeURIComponent(path.resolve(targetPath))}`;
}

function openViaProtocol(uri) {
  if (process.platform === 'win32') {
    execFileSync('cmd', ['/c', 'start', '', uri], { stdio: 'ignore' });
    return;
  }

  if (process.platform === 'darwin') {
    execFileSync('open', [uri], { stdio: 'ignore' });
    return;
  }

  execFileSync('xdg-open', [uri], { stdio: 'ignore' });
}

function openViaExecutable(executablePath, targetPath) {
  if (process.platform === 'darwin' && executablePath.endsWith('.app')) {
    execFileSync('open', ['-a', executablePath, targetPath], { stdio: 'ignore' });
    return;
  }

  execFileSync(executablePath, [targetPath], { stdio: 'ignore' });
}

function launchObsidianTarget({ obsidianReport, targetPath, protocolOpener = openViaProtocol, executableOpener = openViaExecutable }) {
  const uri = buildObsidianOpenUri(targetPath);

  try {
    protocolOpener(uri);
    return {
      method: 'uri',
      uri,
      targetPath,
    };
  } catch (protocolError) {
    executableOpener(obsidianReport.path, targetPath);
    return {
      method: 'executable',
      uri,
      targetPath,
      protocolError: protocolError.message,
    };
  }
}

function formatProjectRelative(cwd, targetPath) {
  const relative = path.relative(cwd, targetPath);
  return relative && !relative.startsWith('..') ? relative.split(path.sep).join('/') : targetPath;
}

async function runVaultOpenCLI({
  cli = {},
  cwd = process.cwd(),
  output = (line) => console.log(line),
  errorOutput = (line) => console.error(line),
  detectObsidian = detectObsidianInstall,
  protocolOpener = openViaProtocol,
  executableOpener = openViaExecutable,
} = {}) {
  const { vaultRoot, homeNotePath } = resolveVaultArtifacts(cwd);
  const familyTarget = resolveFamilyTargetPath(vaultRoot, cli.vaultFamily);
  const target = familyTarget ? familyTarget.key : (cli.vaultOpenTarget === 'root' ? 'root' : 'home');
  const targetPath = familyTarget
    ? familyTarget.targetPath
    : (target === 'root' ? vaultRoot : homeNotePath);

  output('MarkOS Vault Opener');
  output('');

  if (!fs.existsSync(vaultRoot)) {
    errorOutput('Canonical vault root was not found. Run `npx markos` first to create MarkOS-Vault.');
    return {
      ok: false,
      reason: 'vault-missing',
      target,
      targetPath,
    };
  }

  if (!fs.existsSync(targetPath)) {
    errorOutput(`Requested vault target is missing: ${formatProjectRelative(cwd, targetPath)}`);
    return {
      ok: false,
      reason: 'target-missing',
      target,
      targetPath,
    };
  }

  const obsidianReport = detectObsidian();
  if (!obsidianReport.available) {
    errorOutput('Obsidian was not detected. Install Obsidian or set MARKOS_OBSIDIAN_PATH, then rerun `npx markos vault:open`.');
    output(`Target: ${formatProjectRelative(cwd, targetPath)}`);
    return {
      ok: false,
      reason: 'obsidian-not-detected',
      target,
      targetPath,
    };
  }

  const launch = launchObsidianTarget({
    obsidianReport,
    targetPath,
    protocolOpener,
    executableOpener,
  });

  const targetLabel = familyTarget
    ? `${familyTarget.label} notes`
    : (target === 'root' ? 'vault root' : 'Home note');
  output(`Opened ${targetLabel} in Obsidian: ${formatProjectRelative(cwd, targetPath)}`);
  if (launch.method === 'executable') {
    output('Fell back to direct executable launch because the Obsidian URI opener was unavailable.');
  }

  return {
    ok: true,
    reason: 'opened',
    target,
    targetPath,
    method: launch.method,
    uri: launch.uri,
  };
}

module.exports = {
  buildObsidianOpenUri,
  resolveVaultArtifacts,
  resolveFamilyTargetPath,
  runVaultOpenCLI,
};