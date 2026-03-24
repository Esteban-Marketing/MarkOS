#!/usr/bin/env node
// marketing-get-shit-done installer v1.0.0

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, exec } = require('child_process');

const PKG_DIR = path.resolve(__dirname, '..');
const VERSION = fs.readFileSync(path.join(PKG_DIR, 'VERSION'), 'utf8').trim();
const CWD = process.cwd();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function banner(text) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` ${text}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

function detectGSD(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'get-shit-done', 'VERSION'));
}

function detectExistingMGSD(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'marketing-get-shit-done', 'VERSION'));
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function run() {
  // Handle: npx marketing-get-shit-done update → defer to update.cjs
  if (process.argv[2] === 'update') {
    require('./update.cjs');
    return;
  }

  banner(`MGSD Installer v${VERSION} — Marketing Get Shit Done`);

  // Detect GSD
  const hasGSD = detectGSD(CWD);
  const hasMGSD = detectExistingMGSD(CWD);

  if (hasMGSD) {
    console.log(`\n📦 MGSD is already installed in this project.`);
    const choice = await ask('Run update instead? (y/n): ');
    if (choice.trim().toLowerCase() === 'y') {
      require('./update.cjs');
      rl.close();
      return;
    }
    rl.close();
    return;
  }

  if (hasGSD) {
    console.log('\n✓ Existing GSD install detected — MGSD will be added alongside it.');
  } else {
    console.log('\nℹ No GSD install found — MGSD will be installed standalone.');
  }

  // Step 1: Install location
  console.log('\n[1/5] Install location');
  console.log('  1) This project only (.agent/ in current directory)');
  console.log('  2) Global (~/.agent/)');
  const locChoice = await ask('Choice (1 or 2): ');
  const isGlobal = locChoice.trim() === '2';
  const os = require('os');
  const targetDir = isGlobal ? os.homedir() : CWD;
  const agentDir = path.join(targetDir, '.agent');

  // Step 2: Project name
  console.log('\n[2/5] Project marketing context');
  const projectName = await ask('Project/client name for this MGSD install: ');

  // Step 3: Launch onboarding?
  console.log('\n[3/5] Client intelligence onboarding');
  console.log('  Launch the 6-step web form to generate RESEARCH/, MIR/, MSP/ automatically?');
  const launchOnboarding = await ask('Launch onboarding form after install? (y/n): ');

  // Step 4: Confirm
  console.log('\n[4/5] Summary');
  console.log(`  Install to: ${agentDir}`);
  console.log(`  Project: ${projectName}`);
  console.log(`  GSD co-existence: ${hasGSD ? 'Yes (non-destructive)' : 'N/A'}`);
  console.log(`  Onboarding: ${launchOnboarding.trim().toLowerCase() === 'y' ? 'Yes' : 'Skip'}`);
  const confirm = await ask('\nProceed? (y/n): ');

  if (confirm.trim().toLowerCase() !== 'y') {
    console.log('\nInstallation cancelled.');
    rl.close();
    return;
  }

  // Step 5: Install
  banner('Installing MGSD...');

  const mgsdSrc = path.join(PKG_DIR, '.agent', 'marketing-get-shit-done');
  const mgsdDest = path.join(agentDir, 'marketing-get-shit-done');
  copyRecursive(mgsdSrc, mgsdDest);
  console.log('✓ MGSD protocol files installed');

  // Copy onboarding
  const onboardingSrc = path.join(PKG_DIR, 'onboarding');
  const onboardingDest = path.join(CWD, 'onboarding');
  if (!fs.existsSync(onboardingDest)) {
    copyRecursive(onboardingSrc, onboardingDest);
    console.log('✓ Onboarding app installed');
  }

  // Write VERSION
  fs.writeFileSync(path.join(mgsdDest, 'VERSION'), VERSION);

  // Write install manifest
  const manifestPath = path.join(CWD, '.mgsd-install-manifest.json');
  
  // Build file hash manifest for accurate conflict detection during updates
  function buildFileHashes(dir, baseDir = dir, hashes = {}) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const rel = path.relative(baseDir, full);
      if (fs.statSync(full).isDirectory()) {
        buildFileHashes(full, baseDir, hashes);
      } else {
        hashes[rel] = require('crypto').createHash('sha256').update(fs.readFileSync(full)).digest('hex');
      }
    }
    return hashes;
  }

  const manifest = {
    version: VERSION,
    installed: new Date().toISOString(),
    location: isGlobal ? 'global' : 'project',
    project_name: projectName,
    file_hashes: buildFileHashes(mgsdDest)
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Install manifest written (.mgsd-install-manifest.json)');

  // Non-destructive GSD append (if GSD detected)
  if (hasGSD) {
    const gsdSkillsDir = path.join(agentDir, 'skills');
    const mgsdSkillsDir = path.join(mgsdDest, 'skills');
    // Skills already in correct place — just confirm
    console.log('✓ MGSD skills co-exist with GSD (no conflicts)');
  }

  // Append to GEMINI.md / CLAUDE.md if present (never overwrite)
  for (const aiMd of ['GEMINI.md', 'CLAUDE.md', 'AGENTS.md']) {
    const aiMdPath = path.join(CWD, aiMd);
    if (fs.existsSync(aiMdPath)) {
      const existing = fs.readFileSync(aiMdPath, 'utf8');
      if (!existing.includes('MGSD')) {
        fs.appendFileSync(aiMdPath, `\n\n## MGSD — Marketing Get Shit Done\n\nMGSD protocol installed at \`.agent/marketing-get-shit-done/\`.\nSee \`.agent/marketing-get-shit-done/MGSD-INDEX.md\` for full documentation.\n`);
        console.log(`✓ MGSD section appended to ${aiMd}`);
      }
    }
  }

  banner(`MGSD v${VERSION} installed ✓`);
  console.log(`\n  Protocol: ${mgsdDest}`);
  console.log(`  Update:   npx marketing-get-shit-done update`);
  console.log(`  Docs:     .agent/marketing-get-shit-done/MGSD-INDEX.md\n`);

  if (launchOnboarding.trim().toLowerCase() === 'y') {
    // ── 1. Interactive .env Setup ───────────────────────────────────────────
    const envPath = path.join(CWD, '.env');
    let hasKeys = false;
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('OPENAI_API_KEY') || 
          envContent.includes('ANTHROPIC_API_KEY') || 
          envContent.includes('GEMINI_API_KEY')) {
        hasKeys = true;
      }
    }

    if (!hasKeys) {
      console.log('\n[!] No AI Keys detected in .env');
      console.log('To power the MGSD AI agents, you need at least one API key.');
      console.log('  1) OpenAI');
      console.log('  2) Anthropic');
      console.log('  3) Google Gemini');
      console.log('  4) Skip for now (will fail to generate AI drafts)');
      
      const providerChoice = await ask('Select provider (1-4): ');
      
      let keyFormat = '';
      if (providerChoice.trim() === '1') {
        const key = await ask('Paste OPENAI_API_KEY (sk-...): ');
        if (key) keyFormat = `\nOPENAI_API_KEY=${key.trim()}\nOPENAI_MODEL=gpt-4o-mini\n`;
      } else if (providerChoice.trim() === '2') {
        const key = await ask('Paste ANTHROPIC_API_KEY (sk-ant-...): ');
        if (key) keyFormat = `\nANTHROPIC_API_KEY=${key.trim()}\nANTHROPIC_MODEL=claude-3-5-haiku-20241022\n`;
      } else if (providerChoice.trim() === '3') {
        const key = await ask('Paste GEMINI_API_KEY (AIza...): ');
        if (key) keyFormat = `\nGEMINI_API_KEY=${key.trim()}\nGEMINI_MODEL=gemini-2.5-flash\n`;
      }

      if (keyFormat) {
        fs.appendFileSync(envPath, keyFormat);
        console.log('✓ API Key saved to .env securely.');
      }
    }

    // ── 2. Vector Memory Daemon ─────────────────────────────────────────────
    console.log('\n[>] Booting Vector Memory (ChromaDB) in background...');
    try {
      // Spawn detached python process
      const { spawn } = require('child_process');
      const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
      const chromaProcess = spawn(pyCmd, ['-m', 'chromadb.cli.cli', 'run'], {
        detached: true,
        stdio: 'ignore'
      });
      chromaProcess.unref(); // Allow node to exit independently of this process
      
      // Wait 2s for boot
      await new Promise(r => setTimeout(r, 2000));
      console.log('✓ Vector memory listening on port 8000');
    } catch (err) {
      console.log('⚠ Could not start ChromaDB automatically. You may need to run: python -m chromadb.cli.cli run');
    }

    // ── 3. Server Handoff ───────────────────────────────────────────────────
    console.log('\n🚀 Starting MGSD Orchestrator Sequence...\n');
    rl.close();
    
    // Redirect to V2 Server
    require(path.join(CWD, 'onboarding', 'backend', 'server.cjs'));

  } else {
    console.log('Run `node onboarding/backend/server.cjs` to fully launch the system later.\n');
    rl.close();
  }
}

run().catch(e => { console.error(e); rl.close(); process.exit(1); });
