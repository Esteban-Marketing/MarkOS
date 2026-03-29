#!/usr/bin/env node

/**
 * markos-tools.cjs
 *
 * Core CLI for the MarkOS protocol.
 * Full command router mirroring gsd-tools.cjs architecture,
 * mapped to .agent/markos/ internal paths with legacy fallback.
 *
 * Usage: node markos-tools.cjs <command> [args...]
 */

const path = require('path');
const fs = require('fs');

const CWD = process.cwd();
const MARKOS_ROOT = path.resolve(CWD, '.agent/markos');
const LEGACY_MARKOS_ROOT = path.resolve(CWD, '.agent/markos');
const MARKOS_ROOT = fs.existsSync(MARKOS_ROOT) ? MARKOS_ROOT : LEGACY_MARKOS_ROOT;

// ─── Vector Provider Bootstrap ───────────────────────────────────────────────
// Ensures vector providers are configured before vector-dependent commands run.
const VECTOR_BOOTSTRAP_FILE = path.join(CWD, 'bin/ensure-vector.cjs');
async function bootstrapVectorStores() {
  if (fs.existsSync(VECTOR_BOOTSTRAP_FILE)) {
    const { ensureVectorStores } = require(VECTOR_BOOTSTRAP_FILE);
    await ensureVectorStores();
  }
}

// ─── Bootstrap check ─────────────────────────────────────────────────────────

function checkSetup() {
  if (!fs.existsSync(MARKOS_ROOT)) {
    process.stderr.write('[MarkOS] Protocol not initialized in this repository.\n');
    process.stderr.write('Run /markos-new-project to initialize.\n');
    process.exit(1);
  }
}

// ─── Argument parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];
const rawFlag = args.includes('--raw');

function getArg(index) {
  return args[index] || null;
}

function getFlag(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  return args[idx + 1] || true;
}

function getFilesList() {
  const idx = args.indexOf('--files');
  if (idx === -1) return [];
  return args.slice(idx + 1).filter(a => !a.startsWith('--'));
}

// ─── Command router ──────────────────────────────────────────────────────────

if (!command) {
  const version = fs.existsSync(path.join(MARKOS_ROOT, 'VERSION'))
    ? fs.readFileSync(path.join(MARKOS_ROOT, 'VERSION'), 'utf-8').trim()
    : 'unknown';

  console.log(`markos-tools v${version}`);
  console.log('');
  console.log('Usage: markos-tools <command> [args]');
  console.log('');
  console.log('Project Setup:');
  console.log('  init <workflow> [phase]    Get context for a workflow');
  console.log('  config-new-project <json>  Create initial config.json');
  console.log('  config-set <key> <value>   Set a config value');
  console.log('  config-get <key>           Get a config value');
  console.log('');
  console.log('Planning:');
  console.log('  roadmap get-phase <N>      Get phase info from ROADMAP.md');
  console.log('  roadmap list-phases        List all roadmap phases');
  console.log('  phase-plan-index <N>       Index plans for a phase');
  console.log('  find-phase <N>             Find phase directory');
  console.log('  phase complete <N>         Mark phase complete');
  console.log('');
  console.log('State:');
  console.log('  state begin-phase          Update STATE.md for phase start');
  console.log('  state update <field> <val> Update STATE.md field');
  console.log('');
  console.log('Utilities:');
  console.log('  commit <msg> [--files ..]  Git commit with config checks');
  console.log('  mir-audit                  Audit MIR for gaps and gate status');
  console.log('  slug <text>                Generate URL slug');
  console.log('  timestamp [format]         Current timestamp');
  console.log('  verify-path <path>         Check if path exists');
  console.log('');
  console.log('Documentation:');
  console.log('  Read .protocol-lore/INDEX.md for full architecture map.');
  console.log('  Read .protocol-lore/DEFCON.md for emergency escalation rules.');
  process.exit(0);
}

// ─── Route commands ──────────────────────────────────────────────────────────

switch (command) {
  // ── Init ────────────────────────────────────────────────────────────────────
  case 'init': {
    checkSetup();
    const { cmdInit } = require('./lib/init.cjs');
    cmdInit(CWD, getArg(1), getArg(2), rawFlag);
    break;
  }

  // ── Config ──────────────────────────────────────────────────────────────────
  case 'config-new-project': {
    const { cmdConfigNewProject } = require('./lib/config.cjs');
    cmdConfigNewProject(CWD, getArg(1), rawFlag);
    break;
  }
  case 'config-set': {
    const { cmdConfigSet } = require('./lib/config.cjs');
    cmdConfigSet(CWD, getArg(1), getArg(2), rawFlag);
    break;
  }
  case 'config-get': {
    const { cmdConfigGet } = require('./lib/config.cjs');
    cmdConfigGet(CWD, getArg(1), rawFlag);
    break;
  }

  // ── Roadmap ─────────────────────────────────────────────────────────────────
  case 'roadmap': {
    checkSetup();
    const subCmd = getArg(1);
    const { cmdRoadmapGetPhase, cmdRoadmapListPhases } = require('./lib/roadmap.cjs');
    switch (subCmd) {
      case 'get-phase':
        cmdRoadmapGetPhase(CWD, getArg(2), rawFlag);
        break;
      case 'list-phases':
        cmdRoadmapListPhases(CWD, rawFlag);
        break;
      default:
        process.stderr.write(`Unknown roadmap subcommand: ${subCmd}\n`);
        process.exit(1);
    }
    break;
  }

  // ── Phase ───────────────────────────────────────────────────────────────────
  case 'phase-plan-index': {
    checkSetup();
    const { cmdPhasePlanIndex } = require('./lib/phase.cjs');
    cmdPhasePlanIndex(CWD, getArg(1), rawFlag);
    break;
  }
  case 'find-phase': {
    checkSetup();
    const { cmdFindPhase } = require('./lib/phase.cjs');
    cmdFindPhase(CWD, getArg(1), rawFlag);
    break;
  }
  case 'phase': {
    checkSetup();
    const subCmd = getArg(1);
    if (subCmd === 'complete') {
      const { cmdPhaseComplete } = require('./lib/phase.cjs');
      cmdPhaseComplete(CWD, getArg(2), rawFlag);
    } else {
      process.stderr.write(`Unknown phase subcommand: ${subCmd}\n`);
      process.exit(1);
    }
    break;
  }

  // ── State ───────────────────────────────────────────────────────────────────
  case 'state': {
    checkSetup();
    const subCmd = getArg(1);
    const { cmdStateBeginPhase, cmdStateUpdate } = require('./lib/state.cjs');
    switch (subCmd) {
      case 'begin-phase':
        cmdStateBeginPhase(CWD, getFlag('phase'), getFlag('name'), getFlag('plans'), rawFlag);
        break;
      case 'update':
        cmdStateUpdate(CWD, getArg(2), getArg(3), rawFlag);
        break;
      default:
        process.stderr.write(`Unknown state subcommand: ${subCmd}\n`);
        process.exit(1);
    }
    break;
  }

  // ── Utilities ───────────────────────────────────────────────────────────────
  case 'commit': {
    const { cmdCommit } = require('./lib/commands.cjs');
    const noVerify = args.includes('--no-verify');
    cmdCommit(CWD, getArg(1), getFilesList(), rawFlag, noVerify);
    break;
  }
  case 'mir-audit': {
    checkSetup();
    const { cmdMirAudit } = require('./lib/commands.cjs');
    cmdMirAudit(CWD, rawFlag);
    break;
  }
  case 'slug': {
    const { cmdGenerateSlug } = require('./lib/commands.cjs');
    cmdGenerateSlug(getArg(1), rawFlag);
    break;
  }
  case 'timestamp': {
    const { cmdCurrentTimestamp } = require('./lib/commands.cjs');
    cmdCurrentTimestamp(getArg(1), rawFlag);
    break;
  }
  case 'verify-path': {
    const { cmdVerifyPathExists } = require('./lib/commands.cjs');
    cmdVerifyPathExists(CWD, getArg(1), rawFlag);
    break;
  }

  // ── Unknown ─────────────────────────────────────────────────────────────────
  default:
    process.stderr.write(`[MarkOS] Unknown command: '${command}'\n`);
    process.stderr.write('Run markos-tools without arguments for usage.\n');
    process.exit(1);
}

// ─── Execution ───────────────────────────────────────────────────────────────

(async () => {
  // Commands that require vector providers to be configured
  const vectorCommands = ['init', 'mir-audit'];
  if (vectorCommands.includes(command)) {
    await bootstrapVectorStores();
  }
})();
