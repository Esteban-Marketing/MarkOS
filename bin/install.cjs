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
} = require('./cli-runtime.cjs');

// ── Environment Settings ───────────────────────────────────────────────────
const PKG_DIR = path.resolve(__dirname, '..');
const VERSION = fs.readFileSync(path.join(PKG_DIR, '.agent/markos/VERSION'), 'utf8').trim();
const CWD = process.cwd();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * Prompts the user with a question and returns the answer as a Promise.
 */
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

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

function writeInstallManifest({ cwd, markosDest, isGlobal, projectName, projectSlug }) {
  const manifestPath = path.join(cwd, '.markos-install-manifest.json');
  const manifest = {
    version: VERSION,
    installed: new Date().toISOString(),
    location: isGlobal ? 'global' : 'project',
    project_name: projectName,
    project_slug: projectSlug,
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

function printInstallSummary({ markosDest, projectName, projectSlug, readiness }) {
  banner(`MarkOS v${VERSION} installed ✓`);
  console.log(`\n  Protocol:   ${markosDest}`);
  console.log(`  Project:    ${projectName}`);
  console.log(`  Slug:       ${projectSlug}`);
  console.log('  Update:     npx markos update');
  console.log(`  Readiness:  ${readiness.readiness}`);
  console.log('  Docs:       .agent/markos/MARKOS-INDEX.md');
  if (readiness.warnings.length > 0) {
    for (const warning of readiness.warnings) {
      console.log(`  Warning:    ${warning}`);
    }
  }
  if (readiness.nextStep) {
    console.log(`  Next step:  ${readiness.nextStep}`);
  }
  console.log('');
}

function buildInstallContext(cli) {
  const isInteractive = isInteractiveSession();
  const isCI = isCIEnvironment();
  const scope = cli.scope || 'project';

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
    launchOnboarding: !cli.noOnboarding && isInteractive && !isCI,
    targetDir: resolveScopeTarget(CWD, scope),
  };
}

async function performFreshInstall(context) {
  const agentDir = path.join(context.targetDir, '.agent');
  const { markosDest } = installProtocolFiles({ pkgDir: PKG_DIR, cwd: CWD, agentDir, hasGSD: context.hasGSD });

  const projectConfig = ensureProjectConfig(CWD, context.projectName);
  if (projectConfig.changed) {
    console.log('✓ Project slug initialized (.markos-project.json)');
  }

  writeInstallManifest({
    cwd: CWD,
    markosDest,
    isGlobal: context.isGlobal,
    projectName: context.projectName,
    projectSlug: projectConfig.projectSlug,
  });

  const gitignoreResult = applyGitignoreProtections(CWD);
  if (gitignoreResult.changed) {
    console.log('✓ .gitignore updated with private local artifact protections');
  }

  appendAiDocSection(CWD);

  const { ensureVectorStores } = require('./ensure-vector.cjs');
  const vectorReport = await ensureVectorStores();
  const onboardingServerPath = path.join(CWD, 'onboarding', 'backend', 'server.cjs');
  const readiness = summarizeReadiness({
    hasAiKeys: hasAnyAiKey(CWD),
    vectorReport,
    launchOnboarding: context.launchOnboarding,
    onboardingServerPath,
  });

  return {
    markosDest,
    onboardingServerPath,
    projectConfig,
    readiness,
  };
}

function completeInstall(context, installResult) {
  printInstallSummary({
    markosDest: installResult.markosDest,
    projectName: context.projectName,
    projectSlug: installResult.projectConfig.projectSlug,
    readiness: installResult.readiness,
  });

  if (context.launchOnboarding && installResult.readiness.readiness !== 'blocked') {
    console.log('🚀 Starting MarkOS onboarding...\n');
    rl.close();
    require(installResult.onboardingServerPath);
    return;
  }

  console.log('Run `node onboarding/backend/server.cjs` to fully launch the system later.\n');
  rl.close();
}

function summarizeReadiness({ hasAiKeys, vectorReport, launchOnboarding, onboardingServerPath }) {
  const warnings = [];
  let readiness = 'ready';

  if (!hasAiKeys) {
    readiness = 'degraded';
    warnings.push('No AI provider key detected in environment or .env; onboarding can start, but AI draft generation will stay degraded until a key is added.');
  }

  if (vectorReport.status !== 'providers_ready') {
    readiness = 'degraded';
    warnings.push(vectorReport.message);
  }

  if (launchOnboarding && !fs.existsSync(onboardingServerPath)) {
    readiness = 'blocked';
    warnings.push('Onboarding server entrypoint is missing after install, so automatic handoff cannot continue.');
  }

  const nextSteps = [];
  if (!hasAiKeys) {
    nextSteps.push('Add one of OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to .env for full AI drafting.');
  }
  if (vectorReport.actionable_next_step) {
    nextSteps.push(vectorReport.actionable_next_step);
  }
  if (launchOnboarding && !fs.existsSync(onboardingServerPath)) {
    nextSteps.push('Re-run `npx markos` to restore the onboarding app, or start `node onboarding/backend/server.cjs` once the file exists.');
  }

  return {
    readiness,
    warnings,
    nextStep: nextSteps[0] || null,
  };
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

  loadProjectEnv(CWD);

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
  console.log(`  Project: ${context.projectName}`);
  console.log(`  Project name source: ${context.projectNameSource}`);
  console.log(`  Mode: ${context.isInteractive ? 'interactive' : 'non-interactive'}`);
  console.log(`  GSD co-existence: ${context.hasGSD ? 'Yes (non-destructive)' : 'N/A'}`);
  console.log(`  Onboarding auto-launch: ${context.launchOnboarding ? 'Yes' : 'No'}`);

  banner('Installing MarkOS...');

  const installResult = await performFreshInstall(context);
  completeInstall(context, installResult);
}

run().catch(e => { console.error(e); rl.close(); process.exit(1); });
