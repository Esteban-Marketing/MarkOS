/**
 * Core — Shared utilities, constants, and internal helpers for MGSD
 * Marketing Get Shit Done protocol engine
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync, spawnSync } = require('child_process');

// ─── Constants ───────────────────────────────────────────────────────────────

const MGSD_ROOT_REL = '.agent/marketing-get-shit-done';
const PROTOCOL_PREFIX = 'MGSD';

// ─── Path helpers ────────────────────────────────────────────────────────────

function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

function planningDir(cwd) {
  return path.join(cwd, '.planning');
}

function planningPaths(cwd) {
  const base = path.join(cwd, '.planning');
  return {
    planning: base,
    state: path.join(base, 'STATE.md'),
    roadmap: path.join(base, 'ROADMAP.md'),
    project: path.join(base, 'PROJECT.md'),
    config: path.join(base, 'config.json'),
    phases: path.join(base, 'phases'),
    requirements: path.join(base, 'REQUIREMENTS.md'),
  };
}

function mgsdRoot(cwd) {
  return path.join(cwd, MGSD_ROOT_REL);
}

function mgsdPaths(cwd) {
  const root = mgsdRoot(cwd);
  return {
    root,
    agents: path.join(root, 'agents'),
    bin: path.join(root, 'bin'),
    references: path.join(root, 'references'),
    templates: path.join(root, 'templates'),
    workflows: path.join(root, 'workflows'),
    mir: path.join(root, 'templates', 'MIR'),
    msp: path.join(root, 'templates', 'MSP'),
    version: path.join(root, 'VERSION'),
  };
}

// ─── Output helpers ──────────────────────────────────────────────────────────

function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      const tmpPath = path.join(require('os').tmpdir(), `mgsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}

function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

// ─── File utilities ──────────────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function loadConfig(cwd) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const defaults = {
    model_profile: 'balanced',
    commit_docs: true,
    parallelization: true,
    mir_gate_enforcement: true,
    campaign_approval_flow: true,
    linear_sync: true,
    discipline_activation: {},
  };

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

// ─── Git utilities ───────────────────────────────────────────────────────────

function execGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? '').toString().trim(),
    stderr: (result.stderr ?? '').toString().trim(),
  };
}

function isGitIgnored(cwd, targetPath) {
  try {
    execFileSync('git', ['check-ignore', '-q', '--no-index', '--', targetPath], {
      cwd,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Markdown normalization ─────────────────────────────────────────────────

function normalizeMd(content) {
  if (!content || typeof content !== 'string') return content;
  let text = content.replace(/\r\n/g, '\n');
  // Collapse 3+ blank lines to 2
  text = text.replace(/\n{3,}/g, '\n\n');
  // Ensure file ends with single newline
  text = text.replace(/\n*$/, '\n');
  return text;
}

// ─── Phase utilities ─────────────────────────────────────────────────────────

function normalizePhaseName(phase) {
  const str = String(phase);
  const match = str.match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (match) {
    const padded = match[1].padStart(2, '0');
    const letter = match[2] ? match[2].toUpperCase() : '';
    const decimal = match[3] || '';
    return padded + letter + decimal;
  }
  return str;
}

function comparePhaseNum(a, b) {
  const pa = String(a).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  const pb = String(b).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (!pa || !pb) return String(a).localeCompare(String(b));
  const intDiff = parseInt(pa[1], 10) - parseInt(pb[1], 10);
  if (intDiff !== 0) return intDiff;
  const la = (pa[2] || '').toUpperCase();
  const lb = (pb[2] || '').toUpperCase();
  if (la !== lb) {
    if (!la) return -1;
    if (!lb) return 1;
    return la < lb ? -1 : 1;
  }
  const aDecParts = pa[3] ? pa[3].slice(1).split('.').map(p => parseInt(p, 10)) : [];
  const bDecParts = pb[3] ? pb[3].slice(1).split('.').map(p => parseInt(p, 10)) : [];
  const maxLen = Math.max(aDecParts.length, bDecParts.length);
  if (aDecParts.length === 0 && bDecParts.length > 0) return -1;
  if (bDecParts.length === 0 && aDecParts.length > 0) return 1;
  for (let i = 0; i < maxLen; i++) {
    const av = Number.isFinite(aDecParts[i]) ? aDecParts[i] : 0;
    const bv = Number.isFinite(bDecParts[i]) ? bDecParts[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function findPhaseInternal(cwd, phase) {
  if (!phase) return null;
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const normalized = normalizePhaseName(phase);

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    const match = dirs.find(d => d.startsWith(normalized) || d.toUpperCase().startsWith(normalized.toUpperCase()));
    if (!match) return null;

    const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i) || [null, match, null];
    const phaseNumber = dirMatch ? dirMatch[1] : normalized;
    const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
    const phaseDir = path.join(phasesDir, match);
    const phaseFiles = fs.readdirSync(phaseDir);

    const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
    const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();
    const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
    const hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');

    const completedPlanIds = new Set(summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')));
    const incompletePlans = plans.filter(p => {
      const planId = p.replace('-PLAN.md', '').replace('PLAN.md', '');
      return !completedPlanIds.has(planId);
    });

    return {
      found: true,
      directory: toPosixPath(path.join('.planning/phases', match)),
      phase_number: phaseNumber,
      phase_name: phaseName,
      phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
      plans,
      summaries,
      incomplete_plans: incompletePlans,
      has_research: hasResearch,
      has_context: hasContext,
    };
  } catch {
    return null;
  }
}

// ─── MIR Gate Check ─────────────────────────────────────────────────────────

/**
 * Check MIR gate readiness.
 * Gate 1 (Identity): Core_Strategy files populated
 * Gate 2 (Execution): Tracking + automation files populated
 */
function checkMirGates(mirPath) {
  const gate1Files = [
    'Core_Strategy/01_COMPANY/PROFILE.md',
    'Core_Strategy/02_BRAND/VOICE-TONE.md',
    'Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md',
  ];
  const gate2Files = [
    'Core_Strategy/06_TECH-STACK/TRACKING.md',
    'Core_Strategy/06_TECH-STACK/AUTOMATION.md',
  ];

  function checkGate(files) {
    const results = {};
    let allComplete = true;
    for (const file of files) {
      const fullPath = path.join(mirPath, file);
      const content = safeReadFile(fullPath);
      const hasContent = content && !content.includes('[FILL]') && content.trim().length > 100;
      results[file] = hasContent ? 'complete' : 'incomplete';
      if (!hasContent) allComplete = false;
    }
    return { files: results, ready: allComplete };
  }

  return {
    gate1: checkGate(gate1Files),
    gate2: checkGate(gate2Files),
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  MGSD_ROOT_REL,
  PROTOCOL_PREFIX,
  toPosixPath,
  planningDir,
  planningPaths,
  mgsdRoot,
  mgsdPaths,
  output,
  error,
  safeReadFile,
  loadConfig,
  execGit,
  isGitIgnored,
  normalizeMd,
  normalizePhaseName,
  comparePhaseNum,
  findPhaseInternal,
  checkMirGates,
};
