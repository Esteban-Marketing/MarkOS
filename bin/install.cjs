#!/usr/bin/env node
/**
 * install.cjs — MarkOS Interactive Installer & GSD Co-existence Wizard
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Handles the first-run setup of the MarkOS protocol in a new or existing project.
 *   Ensures parallel co-existence with the `get-shit-done` (GSD) protocol.
 *
 * INSTALLATION FLOW:
 *   1. Detection: Checks for existing GSD or legacy MARKOS-compatible installations in `.agent/`.
 *   2. User Prompt: Asks for installation scope (Project Local vs Global Home).
 *   3. Template Copy: Deep-copies `.agent/markos/` templates.
 *   4. GSD Integration: If GSD exists, merges ITM templates but keeps files isolated.
 *   5. Vector Boot: Delegates to `bin/ensure-vector.cjs` to validate vector providers.
 *   6. Manifest: Writes `.markos-install-manifest.json` for idempotent updates later.
 *
 * COMMANDS:
 *   npx markos                    → runs interactive install
 *   npx markos update             → delegates to `bin/update.cjs`
 *
 * RELATED FILES:
 *   bin/update.cjs             (Handles idempotent SHA256 patches)
 *   bin/ensure-vector.cjs      (Handles vector memory provider checks)
 *   README.md                  (User-facing install guide)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const {
  assertSupportedNodeVersion,
  banner,
  buildFileHashes,
  copyRecursive,
  detectObsidianInstall,
  detectQmdSupport,
  detectExistingMarkOS,
  detectGSD,
  hasAnyAiKey,
  inferProjectName,
  isCIEnvironment,
  isInteractiveSession,
  loadProjectEnv,
  parseCliArgs,
  printInstallUsage,
  resolveScopeTarget,
  slugify,
  normalizeInstallProfile,
  VALID_PRESET_BUCKETS,
} = require('./cli-runtime.cjs');
const {
  loadPreset,
  applyPreset,
  writePresetSeed,
  validateBucket,
} = require('./lib/preset-loader.cjs');

// ── Environment Settings ───────────────────────────────────────────────────
const PKG_DIR = path.resolve(__dirname, '..');
const VERSION = fs.readFileSync(path.join(PKG_DIR, '.agent/markos/VERSION'), 'utf8').trim();
const CWD = process.cwd();
const VAULT_ROOT_NAME = 'MarkOS-Vault';
const VAULT_FAMILIES = ['Home', 'Strategy', 'Execution', 'Relationships', 'Evidence', 'Reviews', 'Memory'];
const PROFILE_SCHEMA_VERSION = 1;

function isValidProfile(profile) {
  return profile === 'full' || profile === 'cli' || profile === 'minimal';
}

function resolveInstallProfile(cli) {
  if (cli.profileConflict) {
    throw new Error(cli.profileConflict);
  }

  const explicitProfile = normalizeInstallProfile(cli.installProfile);
  return explicitProfile || 'full';
}

function buildProfileComponents(profile, noOnboarding) {
  const base = {
    onboarding_enabled: profile === 'full',
    ui_enabled: profile === 'full',
  };

  if (noOnboarding) {
    return {
      ...base,
      onboarding_enabled: false,
      ui_enabled: false,
    };
  }

  return base;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * Prompts the user with a question and returns the answer as a Promise.
 */
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function toPortablePath(value) {
  return String(value).split(path.sep).join('/');
}

function applyGitignoreProtections(projectDir) {
  const gitignorePath = path.join(projectDir, '.gitignore');
  const blockStart = '# >>> MarkOS private local artifacts >>>';
  const blockEnd = '# <<< MarkOS private local artifacts <<<';
  const protectedEntries = [
    '.markos-local/',
    '.markos-local/',
    '.markos-install-manifest.json',
    '.markos-install-manifest.json',
    '.markos-project.json',
    '.markos-project.json',
    'onboarding-seed.json',
  ];

  const managedBlock = [
    blockStart,
    '# Auto-managed by MarkOS installer. Keeps private local artifacts out of source control.',
    ...protectedEntries,
    blockEnd,
  ].join('\n');

  const existing = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8')
    : '';

  let next = existing;
  let changed = false;

  if (existing.includes(blockStart) && existing.includes(blockEnd)) {
    const blockPattern = new RegExp(String.raw`${blockStart}[\s\S]*?${blockEnd}`);
    const replacement = managedBlock;
    next = existing.replace(blockPattern, replacement);
    changed = next !== existing;
  } else {
    const hasAllEntries = protectedEntries.every((entry) => existing.includes(entry));
    if (!hasAllEntries) {
      let separator = '';
      if (existing.length > 0 && !existing.endsWith('\n')) {
        separator = '\n\n';
      } else if (existing.length > 0) {
        separator = '\n';
      }
      next = `${existing}${separator}${managedBlock}\n`;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(gitignorePath, next, 'utf8');
  }

  return {
    changed,
    gitignorePath,
  };
}

function ensureProjectConfig(projectDir, projectName) {
  const projectConfigPath = path.join(projectDir, '.markos-project.json');
  const defaultSlug = slugify(projectName);

  if (fs.existsSync(projectConfigPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
      if (existing && typeof existing.project_slug === 'string' && existing.project_slug.trim()) {
        return { path: projectConfigPath, projectSlug: existing.project_slug.trim(), changed: false };
      }
    } catch {}
  }

  fs.writeFileSync(projectConfigPath, JSON.stringify({ project_slug: defaultSlug }, null, 2));
  return { path: projectConfigPath, projectSlug: defaultSlug, changed: true };
}

function appendAiDocSection(projectDir) {
  for (const aiMd of ['GEMINI.md', 'CLAUDE.md', 'copilot-instructions.md', 'AGENTS.md']) {
    const aiMdPath = path.join(projectDir, aiMd);
    if (!fs.existsSync(aiMdPath)) {
      continue;
    }

    const existing = fs.readFileSync(aiMdPath, 'utf8');
    if (existing.includes('MarkOS')) {
      continue;
    }

    fs.appendFileSync(aiMdPath, `\n\n## MarkOS — Marketing Operating System\n\nMarkOS protocol installed at \`.agent/markos/\`.\nSee \`.agent/markos/MARKOS-INDEX.md\` for full documentation.\n`);
    console.log(`✓ MarkOS section appended to ${aiMd}`);
  }
}

function installProtocolFiles({ pkgDir, cwd, agentDir, hasGSD }) {
  const markosSrc = path.join(pkgDir, '.agent', 'markos');
  const markosDest = path.join(agentDir, 'markos');
  copyRecursive(markosSrc, markosDest);
  console.log('✓ MarkOS protocol files installed (.agent/markos path)');

  const onboardingSrc = path.join(pkgDir, 'onboarding');
  const onboardingDest = path.join(cwd, 'onboarding');
  if (!fs.existsSync(onboardingDest)) {
    copyRecursive(onboardingSrc, onboardingDest);
    console.log('✓ Onboarding app installed');
  }

  fs.writeFileSync(path.join(markosDest, 'VERSION'), VERSION);

  if (hasGSD) {
    console.log('✓ MarkOS skills co-exist with GSD (no conflicts)');
  }

  return { markosDest };
}

function writeFileIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function ensureCanonicalVaultBootstrap(projectDir, projectName, projectSlug) {
  const vaultRoot = path.join(projectDir, VAULT_ROOT_NAME);
  const createdPaths = [];

  if (!fs.existsSync(vaultRoot)) {
    fs.mkdirSync(vaultRoot, { recursive: true });
    createdPaths.push(vaultRoot);
  }

  for (const family of VAULT_FAMILIES) {
    const familyDir = path.join(vaultRoot, family);
    if (!fs.existsSync(familyDir)) {
      fs.mkdirSync(familyDir, { recursive: true });
      createdPaths.push(familyDir);
    }
  }

  const obsidianDir = path.join(vaultRoot, '.obsidian');
  if (!fs.existsSync(obsidianDir)) {
    fs.mkdirSync(obsidianDir, { recursive: true });
    createdPaths.push(obsidianDir);
  }

  if (writeFileIfMissing(path.join(obsidianDir, 'app.json'), JSON.stringify({ alwaysUpdateLinks: true }, null, 2))) {
    createdPaths.push(path.join(obsidianDir, 'app.json'));
  }

  const vaultReadme = `# MarkOS Vault\n\nThis Obsidian vault is the canonical MarkOS operating surface for ${projectName}.\n\n## Canonical Families\n\n- Home\n- Strategy\n- Execution\n- Relationships\n- Evidence\n- Reviews\n- Memory\n\n## Current Boundary\n\nThis bootstrap creates the canonical vault scaffold and Home entrypoint now. Onboarding and importer behavior remain on the legacy path until the vault-native write flow lands in a later phase.\n\n## Project Metadata\n\n- Project name: ${projectName}\n- Project slug: ${projectSlug}\n`;

  if (writeFileIfMissing(path.join(vaultRoot, 'README.md'), vaultReadme)) {
    createdPaths.push(path.join(vaultRoot, 'README.md'));
  }

  const timestamp = new Date().toISOString();
  const homeNote = `---\nid: home-${projectSlug}\ntitle: MarkOS Home\nvault_family: Home\nnote_family: home\nstatus: active\nowner: ${projectSlug}\nreview_cycle: weekly\ncreated_at: ${timestamp}\nupdated_at: ${timestamp}\nsource_mode: native\nsummary: Canonical landing note for the vault-first MarkOS workspace.\n---\n\n# MarkOS Home\n\nUse this vault as the canonical source of truth for strategy, execution, evidence, reviews, relationships, and memory.\n\n## First Run\n\n- Open this folder in Obsidian.\n- Confirm the top-level vault families exist and remain the primary operating structure.\n- Use onboarding as a migration-era helper only; its write path is still being rewritten.\n`;

  const homeNotePath = path.join(vaultRoot, 'Home', 'HOME.md');
  if (writeFileIfMissing(homeNotePath, homeNote)) {
    createdPaths.push(homeNotePath);
  }

  return {
    vaultRoot,
    homeNotePath,
    createdPaths,
  };
}

function writeInstallManifest({ cwd, markosDest, isGlobal, projectName, projectSlug, vaultBootstrap, installProfile, components }) {
  const manifestPath = path.join(cwd, '.markos-install-manifest.json');
  const manifest = {
    manifest_schema_version: 2,
    version: VERSION,
    installed: new Date().toISOString(),
    location: isGlobal ? 'global' : 'project',
    project_name: projectName,
    project_slug: projectSlug,
    bootstrap_model: 'vault-first',
    legacy_surface_policy: 'migration-only',
    install_profile: installProfile,
    profile_schema_version: PROFILE_SCHEMA_VERSION,
    components,
    vault_root: toPortablePath(path.relative(cwd, vaultBootstrap.vaultRoot)),
    vault_home_note: toPortablePath(path.relative(cwd, vaultBootstrap.homeNotePath)),
    file_hashes: buildFileHashes(markosDest)
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Install manifest written (.markos-install-manifest.json)');
}

async function handleExistingInstall({ isInteractive, autoUpdate }) {
  console.log(`\n📦 MarkOS is already installed in this project.`);
  if (!isInteractive || autoUpdate) {
    console.log('  Existing install detected; switching to `npx markos update` automatically.');
    return true;
  }

  const choice = await ask('Run update instead? (Y/n): ');
  return choice.trim() === '' || choice.trim().toLowerCase() === 'y';
}

function printInstallSummary({ markosDest, projectName, projectSlug, readiness, vaultBootstrap, obsidianReport, qmdReport }) {
  const obsidianStatus = obsidianReport.available
    ? `detected (${obsidianReport.path})`
    : 'not detected';
  const qmdStatus = qmdReport.available
    ? `available (${qmdReport.command})`
    : 'optional enhancement not detected';

  banner(`MarkOS v${VERSION} installed ✓`);
  console.log(`\n  Protocol:   ${markosDest}`);
  console.log(`  Vault:      ${vaultBootstrap.vaultRoot}`);
  console.log(`  Home note:  ${vaultBootstrap.homeNotePath}`);
  console.log(`  Project:    ${projectName}`);
  console.log(`  Slug:       ${projectSlug}`);
  console.log('  Update:     npx markos update');
  console.log(`  Readiness:  ${readiness.readiness}`);
  console.log(`  Obsidian:   ${obsidianStatus}`);
  console.log(`  QMD:        ${qmdStatus}`);
  console.log('  Docs:       .agent/markos/MARKOS-INDEX.md');
  if (readiness.warnings.length > 0) {
    for (const warning of readiness.warnings) {
      console.log(`  Warning:    ${warning}`);
    }
  }
  if (readiness.nextStep) {
    console.log(`  Next step:  ${readiness.nextStep}`);
  }
  if (readiness.installProfile) {
    console.log(`  Profile:    ${readiness.installProfile}`);
    const components = readiness.components || {};
    console.log(`  Components: onboarding=${components.onboarding_enabled ? 'enabled' : 'disabled'}, ui=${components.ui_enabled ? 'enabled' : 'disabled'}`);
  }
  console.log('');
}

function buildInstallContext(cli) {
  const isInteractive = isInteractiveSession();
  const isCI = isCIEnvironment();
  const scope = cli.scope || 'project';
  const installProfile = resolveInstallProfile(cli);
  if (!isValidProfile(installProfile)) {
    throw new Error('Unsupported install profile. Use --profile full|cli|minimal.');
  }
  const components = buildProfileComponents(installProfile, cli.noOnboarding);

  return {
    cli,
    isInteractive,
    isCI,
    hasGSD: detectGSD(CWD),
    hasMarkOS: detectExistingMarkOS(CWD),
    projectName: cli.projectName || inferProjectName(CWD),
    projectNameSource: cli.projectName ? 'flag override' : 'cwd inference',
    scope,
    isGlobal: scope === 'global',
    launchOnboarding: components.onboarding_enabled && isInteractive && !isCI,
    targetDir: resolveScopeTarget(CWD, scope),
    installProfile,
    components,
  };
}

async function performFreshInstall(context) {
  const agentDir = path.join(context.targetDir, '.agent');
  const { markosDest } = installProtocolFiles({ pkgDir: PKG_DIR, cwd: CWD, agentDir, hasGSD: context.hasGSD });

  const projectConfig = ensureProjectConfig(CWD, context.projectName);
  if (projectConfig.changed) {
    console.log('✓ Project slug initialized (.markos-project.json)');
  }

  const vaultBootstrap = ensureCanonicalVaultBootstrap(CWD, context.projectName, projectConfig.projectSlug);
  console.log(`✓ Canonical vault scaffold ready (${path.relative(CWD, vaultBootstrap.vaultRoot)})`);

  writeInstallManifest({
    cwd: CWD,
    markosDest,
    isGlobal: context.isGlobal,
    projectName: context.projectName,
    projectSlug: projectConfig.projectSlug,
    vaultBootstrap,
    installProfile: context.installProfile,
    components: context.components,
  });

  const gitignoreResult = applyGitignoreProtections(CWD);
  if (gitignoreResult.changed) {
    console.log('✓ .gitignore updated with private local artifact protections');
  }

  appendAiDocSection(CWD);

  const { ensureVectorStores } = require('./ensure-vector.cjs');
  const vectorReport = await ensureVectorStores();
  const onboardingServerPath = path.join(CWD, 'onboarding', 'backend', 'server.cjs');
  const obsidianReport = detectObsidianInstall();
  const qmdReport = detectQmdSupport();
  const readiness = summarizeReadiness({
    vaultBootstrap,
    obsidianReport,
    qmdReport,
    hasAiKeys: hasAnyAiKey(CWD),
    vectorReport,
    launchOnboarding: context.launchOnboarding,
    onboardingServerPath,
    installProfile: context.installProfile,
    components: context.components,
  });

  return {
    markosDest,
    onboardingServerPath,
    projectConfig,
    vaultBootstrap,
    obsidianReport,
    qmdReport,
    readiness,
  };
}

function completeInstall(context, installResult) {
  printInstallSummary({
    markosDest: installResult.markosDest,
    projectName: context.projectName,
    projectSlug: installResult.projectConfig.projectSlug,
    readiness: installResult.readiness,
    vaultBootstrap: installResult.vaultBootstrap,
    obsidianReport: installResult.obsidianReport,
    qmdReport: installResult.qmdReport,
  });

  if (context.launchOnboarding && installResult.readiness.readiness !== 'blocked') {
    console.log('🚀 Starting the transitional MarkOS onboarding helper...\n');
    rl.close();
    require(installResult.onboardingServerPath);
    return;
  }

  console.log('Run `node onboarding/backend/server.cjs` to launch the transitional onboarding helper later.\n');
  rl.close();
}

function summarizeReadiness({ vaultBootstrap, obsidianReport, qmdReport, hasAiKeys, vectorReport, launchOnboarding, onboardingServerPath, installProfile, components }) {
  const warnings = [];
  let readiness = 'ready';
  const onboardingAvailable = fs.existsSync(onboardingServerPath);

  if (!vaultBootstrap || !fs.existsSync(vaultBootstrap.vaultRoot) || !fs.existsSync(vaultBootstrap.homeNotePath)) {
    readiness = 'blocked';
    warnings.push('Canonical vault bootstrap is incomplete; rerun `npx markos` to recreate MarkOS-Vault and the Home entrypoint.');
  }

  if (!obsidianReport.available) {
    readiness = 'blocked';
    warnings.push('Obsidian was not detected. MarkOS-Vault was created, but the primary vault-first workflow is blocked until Obsidian is installed or MARKOS_OBSIDIAN_PATH is set.');
  }

  if (onboardingAvailable) {
    warnings.push('Onboarding is available only as a transitional migration helper. Its approved drafts still write to legacy MIR/MSP outputs and do not define canonical vault readiness.');
  }

  if (!qmdReport.available && readiness !== 'blocked') {
    readiness = 'degraded';
    warnings.push('Optional QMD enhancement was not detected. Core vault bootstrap is usable, but richer markdown workflows stay unavailable until qmd or quarto is installed.');
  }

  if (!hasAiKeys && readiness !== 'blocked') {
    readiness = 'degraded';
    warnings.push('No AI provider key detected in environment or .env; vault bootstrap succeeded, but AI draft generation will stay degraded until a key is added.');
  }

  if (vectorReport.status !== 'providers_ready' && readiness !== 'blocked') {
    readiness = 'degraded';
    warnings.push(vectorReport.message);
  }

  if (launchOnboarding && !fs.existsSync(onboardingServerPath)) {
    readiness = 'blocked';
    warnings.push('Onboarding server entrypoint is missing after install, so automatic handoff cannot continue.');
  }

  const nextSteps = [];
  if (!obsidianReport.available) {
    nextSteps.push('Install Obsidian, then rerun `npx markos vault:open` to open the canonical vault.');
  }
  if (obsidianReport.available) {
    nextSteps.push('Run `npx markos vault:open` to open the canonical Home note in Obsidian.');
  }
  if (!qmdReport.available) {
    nextSteps.push('Install `qmd` or `quarto` if you want the optional QMD enhancement path.');
  }
  if (!hasAiKeys) {
    nextSteps.push('Add one of OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to .env for full AI drafting.');
  }
  if (vectorReport.actionable_next_step) {
    nextSteps.push(vectorReport.actionable_next_step);
  }
  if (onboardingAvailable) {
    nextSteps.push('Use `node onboarding/backend/server.cjs` only if you need the transitional legacy drafting helper before the vault-native write path lands.');
  }
  if (launchOnboarding && !fs.existsSync(onboardingServerPath)) {
    nextSteps.push('Re-run `npx markos` to restore the onboarding app, or start `node onboarding/backend/server.cjs` once the file exists.');
  }

  return {
    readiness,
    warnings,
    nextStep: nextSteps[0] || null,
    installProfile,
    components,
  };
}

/**
 * performPresetInstall — non-interactive preset-seeded install
 *
 * Validates the bucket, installs protocol files, writes the preset seed,
 * and exits. Does not launch the onboarding server or ask any questions.
 *
 * @param {object} cli - Parsed CLI args (must contain cli.preset)
 */
async function performPresetInstall(cli) {
  const bucket = cli.preset;

  // Validate bucket early so the error is clear.
  const bucketCheck = validateBucket(bucket);
  if (!bucketCheck.valid) {
    console.error(`\n✗ ${bucketCheck.error}`);
    console.error(`  Valid presets: ${VALID_PRESET_BUCKETS.join(', ')}\n`);
    process.exit(1);
  }

  banner(`MarkOS Preset Install v${VERSION} — bucket: ${bucket}`);
  console.log(`\n  Preset:  ${bucket}`);
  console.log(`  Mode:    non-interactive (preset fast-path)`);
  console.log(`  Target:  ${CWD}\n`);

  // 1. Install protocol files (same as standard install).
  const scope = cli.scope || 'project';
  const targetDir = resolveScopeTarget(CWD, scope);
  const agentDir = path.join(targetDir, '.agent');
  const hasGSD = detectGSD(CWD);
  const { markosDest } = installProtocolFiles({ pkgDir: PKG_DIR, cwd: CWD, agentDir, hasGSD });

  // 2. Ensure project config.
  const projectName = cli.projectName || inferProjectName(CWD);
  const projectConfig = ensureProjectConfig(CWD, projectName);

  // 3. Bootstrap vault scaffold.
  const vaultBootstrap = ensureCanonicalVaultBootstrap(CWD, projectName, projectConfig.projectSlug);
  console.log(`✓ Canonical vault scaffold ready (${path.relative(CWD, vaultBootstrap.vaultRoot)})`);

  // 4. Load preset and write seed file.
  const preset = loadPreset(bucket);
  const seed = applyPreset(preset, {
    company_name: projectName,
    product_name: projectName,
    service_name: projectName,
    creator_name: projectName,
  });

  const { SEED_PATH } = require('../onboarding/backend/path-constants.cjs');
  writePresetSeed(SEED_PATH, seed);
  console.log(`✓ Preset seed written (${path.relative(CWD, SEED_PATH)})`);
  console.log(`  Bucket:           ${bucket}`);
  console.log(`  Motion templates: ${seed.msp?.motion_templates?.length || 0}`);
  console.log(`  Literacy nodes:   ${Object.values(seed.literacy_nodes || {}).flat().length}`);

  // 5. Write install manifest.
  const installProfile = 'cli';
  const components = buildProfileComponents(installProfile, true);
  writeInstallManifest({
    cwd: CWD,
    markosDest,
    isGlobal: scope === 'global',
    projectName,
    projectSlug: projectConfig.projectSlug,
    vaultBootstrap,
    installProfile,
    components,
  });

  // 6. Apply gitignore protections.
  const gitignoreResult = applyGitignoreProtections(CWD);
  if (gitignoreResult.changed) {
    console.log('✓ .gitignore updated with private local artifact protections');
  }

  appendAiDocSection(CWD);

  banner(`MarkOS preset "${bucket}" installed ✓`);
  console.log(`\n  Preset seed:   ${path.relative(CWD, SEED_PATH)}`);
  console.log(`  Vault:         ${vaultBootstrap.vaultRoot}`);
  console.log(`  Project:       ${projectName}`);
  console.log(`  Next step:     Open MarkOS-Vault in Obsidian, or run \`node onboarding/backend/server.cjs\` to review seed data.\n`);
}

async function run() {
  const cli = parseCliArgs();

  if (cli.help) {
    printInstallUsage();
    rl.close();
    return;
  }

  if (!assertSupportedNodeVersion(cli.command === 'update' ? 'npx markos update' : 'npx markos')) {
    rl.close();
    process.exit(1);
  }

  if (cli.command === 'db:setup') {
    rl.close();
    const { runDbSetupCLI } = require('./db-setup.cjs');
    await runDbSetupCLI();
    return;
  }

  if (cli.command === 'import:legacy') {
    rl.close();
    const { runImportLegacyCLI } = require('./import-legacy.cjs');
    await runImportLegacyCLI({ cli, cwd: CWD });
    return;
  }

  if (cli.command === 'vault:open') {
    rl.close();
    const { runVaultOpenCLI } = require('./vault-open.cjs');
    const result = await runVaultOpenCLI({ cli, cwd: CWD });
    if (!result.ok) {
      process.exitCode = 1;
    }
    return;
  }

  if (cli.command === 'update') {
    rl.close();
    require('./update.cjs');
    return;
  }

  if (cli.command === 'llm:config') {
    rl.close();
    const { runLLMConfigCLI } = require('./llm-config.cjs');
    await runLLMConfigCLI({ cli });
    return;
  }

  if (cli.command === 'llm:status' || cli.command === 'llm:providers') {
    rl.close();
    const { runLLMStatusCLI } = require('./llm-status.cjs');
    await runLLMStatusCLI({ cli });
    return;
  }

  if (cli.command === 'generate') {
    rl.close();
    const { main: runGenerateCLI } = require('./generate.cjs');
    await runGenerateCLI();
    return;
  }

  // ── Phase 204 Plan 01: operator subcommand dispatch (stubs in this plan;
  //     business logic lands in 204-02 through 204-11). Alphabetical order.
  if (cli.command === 'doctor') {
    rl.close();
    const { main } = require('./commands/doctor.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'env') {
    rl.close();
    const { main } = require('./commands/env.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'eval') {
    rl.close();
    const { main } = require('./commands/eval.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'init') {
    rl.close();
    const { main } = require('./commands/init.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'keys') {
    rl.close();
    const { main } = require('./commands/keys.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'login') {
    rl.close();
    const { main } = require('./commands/login.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'plan') {
    rl.close();
    const { main } = require('./commands/plan.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'run') {
    rl.close();
    const { main } = require('./commands/run.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'status') {
    rl.close();
    const { main } = require('./commands/status.cjs');
    await main({ cli });
    return;
  }

  if (cli.command === 'whoami') {
    rl.close();
    const { main } = require('./commands/whoami.cjs');
    await main({ cli });
    return;
  }

  loadProjectEnv(CWD);

  // ── Preset fast-path: --preset=<bucket> skips guided interview ─────────────
  if (cli.preset) {
    rl.close();
    await performPresetInstall(cli);
    return;
  }

  banner(`MarkOS Installer v${VERSION} — Marketing Operating System`);

  const context = buildInstallContext(cli);

  if (context.hasMarkOS) {
    const shouldUpdate = await handleExistingInstall({ isInteractive: context.isInteractive, autoUpdate: cli.yes });
    if (shouldUpdate) {
      rl.close();
      require('./update.cjs');
      return;
    }

    rl.close();
    return;
  }

  if (context.hasGSD) {
    console.log('\n✓ Existing GSD install detected — MarkOS will be added alongside it.');
  } else {
    console.log('\nℹ No GSD install found — MarkOS will be installed standalone.');
  }

  console.log('\n✓ Smart defaults applied');
  console.log(`  Install to: ${path.join(context.targetDir, '.agent')}`);
  console.log(`  Canonical vault: ${path.join(CWD, VAULT_ROOT_NAME)}`);
  console.log(`  Project: ${context.projectName}`);
  console.log(`  Project name source: ${context.projectNameSource}`);
  console.log(`  Mode: ${context.isInteractive ? 'interactive' : 'non-interactive'}`);
  console.log(`  GSD co-existence: ${context.hasGSD ? 'Yes (non-destructive)' : 'N/A'}`);
  console.log(`  Onboarding auto-launch: ${context.launchOnboarding ? 'Yes' : 'No'}`);
  console.log(`  Setup profile: ${context.installProfile}`);
  console.log(`  Components: onboarding=${context.components.onboarding_enabled ? 'enabled' : 'disabled'}, ui=${context.components.ui_enabled ? 'enabled' : 'disabled'}`);

  banner('Installing MarkOS...');

  const installResult = await performFreshInstall(context);
  completeInstall(context, installResult);
}

if (require.main === module) {
  run().catch(e => { console.error(e); rl.close(); process.exit(1); });
}

module.exports = {
  run,
};
