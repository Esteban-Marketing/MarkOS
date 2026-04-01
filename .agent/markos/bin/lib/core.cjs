/**
 * Core — Shared utilities, constants, and internal helpers for MARKOS
 * MarkOS protocol engine
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync, spawnSync } = require('child_process');

// ─── Constants ───────────────────────────────────────────────────────────────

const MARKOS_ROOT_REL = '.agent/markos';
const LEGACY_MARKOS_ROOT_REL = '.markos';
const PROTOCOL_PREFIX = 'MARKOS';

// ─── Output helpers ──────────────────────────────────────────────────────────
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    process.stdout.write(json);
  }
  process.exit(0);
}

function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

// ─── Path helpers ────────────────────────────────────────────────────────────
/**
 * Converts a Windows or mixed path to POSIX (forward slash) format.
 * @param {string} p - The path to convert.
 * @returns {string}
 */
function toPosixPath(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Returns the absolute path to the .planning directory for the given cwd.
 * @param {string} cwd
 * @returns {string}
 */
function planningDir(cwd) {
  return path.join(cwd, '.planning');
}

/**
 * Returns an object with key planning file paths for the given cwd.
 * @param {string} cwd
 * @returns {object}
 */
function planningPaths(cwd) {
  const dir = planningDir(cwd);
  return {
    planning: dir,
    dir,
    project: path.join(dir, 'PROJECT.md'),
    config: path.join(dir, 'config.json'),
    phases: path.join(dir, 'phases'),
    state: path.join(dir, 'STATE.md'),
    roadmap: path.join(dir, 'ROADMAP.md'),
    requirements: path.join(dir, 'REQUIREMENTS.md'),
  };
}

/**
 * Returns the absolute path to the MarkOS root directory for the given cwd.
 * @param {string} cwd
 * @returns {string}
 */
function markosRoot(cwd) {
  const canonical = path.join(cwd, MARKOS_ROOT_REL);
  const legacy = path.join(cwd, LEGACY_MARKOS_ROOT_REL);
  if (fs.existsSync(canonical)) return canonical;
  if (fs.existsSync(legacy)) return legacy;
  return canonical;
}

/**
 * Returns an object with key MarkOS paths for the given cwd.
 * @param {string} cwd
 * @returns {object}
 */
function markosPaths(cwd) {
  const root = markosRoot(cwd);
  const localMir = path.join(cwd, '.markos-local', 'MIR');
  const planningMir = path.join(cwd, '.planning', 'MIR');
  const templatesMir = path.join(root, 'templates', 'MIR');
  return {
    root,
    bin: path.join(root, 'bin'),
    lib: path.join(root, 'lib'),
    localMir,
    planningMir,
    templatesMir,
    mir: localMir,
  };
}

/**
 * Resolves the active MIR directory for the current repository.
 *
 * Resolution order:
 * 1. `.markos-local/MIR` for approved project-specific content.
 * 2. `.planning/MIR` for scaffolded planning-state content.
 * 3. `.agent/markos/templates/MIR` (or legacy `.markos/templates/MIR`) as a fallback.
 *
 * If none of the candidate directories exist yet, the function returns the first
 * writable project-local path (`.markos-local/MIR`) so callers can create it.
 *
 * @param {string} cwd - The current working directory of the project root.
 * @returns {string} Absolute path to the preferred MIR directory.
 */
function resolveActiveMirPath(cwd) {
  const paths = markosPaths(cwd);
  const candidates = [paths.localMir, paths.planningMir, paths.templatesMir];
  const existing = candidates.find(candidate => fs.existsSync(candidate));
  return existing || paths.localMir;
}

/**
 * Finds and summarizes a phase directory and its plan/completion state.
 *
 * By default, if a phase-level VERIFICATION.md exists and indicates verification passed,
 * the function will clear the incomplete_plans array, treating verification as authoritative.
 *
 * Backward compatibility note:
 * - The clearIncompleteOnVerification parameter was introduced to control this behavior
 *   and now defaults to true.
 * - In earlier versions, verification status did not clear incomplete_plans automatically;
 *   existing callers that did not pass this parameter would always see incomplete_plans
 *   populated based solely on per-plan state.
 * - After upgrading to a version that includes this parameter, callers that rely on
 *   incomplete_plans being populated even when verification has passed must explicitly pass
 *   false to preserve the legacy behavior.

 * @param {string} cwd - The current working directory of the project root.
 * @param {string} phase - The phase number or name to find.
 * @param {boolean} [clearIncompleteOnVerification=true] - When true (default), a passed
 *   VERIFICATION.md will clear incomplete_plans, treating verification as authoritative. Pass
 *   false to retain the per-plan incomplete_plans list regardless of verification status.
 * @returns {object|null} Phase summary object or null if not found.
 */
function findPhaseInternal(cwd, phase, clearIncompleteOnVerification = true) {
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

    // v1.1 Hardening: Detect plan verification status
    const verificationFile = phaseFiles.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
    let verificationPassed = false;
    if (verificationFile) {
      const vContent = safeReadFile(path.join(phaseDir, verificationFile));
      if (hasPassingVerification(vContent)) {
        verificationPassed = true;
      }
    }

    const completedPlanIds = new Set(summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')));
    let incompletePlans = plans.filter(p => {
      const planId = p.replace('-PLAN.md', '').replace('PLAN.md', '');
      return !completedPlanIds.has(planId);
    });

    // Some phases record completion at the phase level via VERIFICATION.md rather
    // than per-plan summaries. If clearIncompleteOnVerification is true and verification passes,
    // treat verification as authoritative and clear incompletePlans.
    if (clearIncompleteOnVerification && verificationPassed) {
      incompletePlans = [];
    }

    // v1.1 Hardening: Deep PROJECT.md check
    const projectPath = path.join(cwd, '.planning', 'PROJECT.md');
    let projectValid = false;
    if (fs.existsSync(projectPath)) {
      const pContent = safeReadFile(projectPath);
      if (pContent && pContent.length > 200 && !pContent.includes('[FILL]')) {
        projectValid = true;
      }
    }

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
      verification_passed: verificationPassed,
      project_valid: projectValid,
    };
  } catch {
    return null;
  }
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

function hasPassingVerification(content) {
  if (!content) return false;

  const passingPatterns = [
    /^status:\s*passed$/mi,
    /^##\s*VERIFICATION PASSED$/mi,
    /^Outcome:\s*\**passed\**\.?$/mi,
    /^Current decision:\s*\**READY_FOR_HUMAN_APPROVAL\**/mi,
    /Phase(?: \d+)? requirements are complete and verified\. Phase can transition\./i,
    /Phase can transition\./i,
    /approved for transition\./i,
  ];

  return passingPatterns.some(pattern => pattern.test(content));
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

/**
 * Legacy variant of findPhaseInternal preserved for backward compatibility.
 *
 * This function intentionally mirrors the behavior of the pre-2024
 * findPhaseInternal implementation so that:
 *   - Older MARKOS runs / plans that rely on the previous phase layout or
 *     semantics continue to work without migration.
 *   - External tooling and integrations that call into the legacy behavior
 *     do not break when the new findPhaseInternal semantics change.
 *
 * Internally this delegates to findPhaseInternal with
 * clearIncompleteOnVerification=false to preserve the legacy semantics
 * around VERIFICATION.md and incomplete_plans.
 */
function findPhaseInternalLegacy(cwd, phase) {
  if (!phase) return null;
  // Preserve legacy behavior by disabling verification-based override
  return findPhaseInternal(cwd, phase, false);
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
    'Core_Strategy/02_BUSINESS/LEAN-CANVAS.md',
    'Core_Strategy/02_BUSINESS/JTBD-MATRIX.md',
  ];
  const gate2Files = [
    'Core_Strategy/06_TECH-STACK/TRACKING.md',
    'Core_Strategy/06_TECH-STACK/AUTOMATION.md',
    'Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md',
    'Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md',
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
  MARKOS_ROOT_REL,
  PROTOCOL_PREFIX,
  toPosixPath,
  planningDir,
  planningPaths,
  markosRoot,
  markosPaths,
  output,
  error,
  safeReadFile,
  loadConfig,
  execGit,
  isGitIgnored,
  normalizeMd,
  normalizePhaseName,
  hasPassingVerification,
  comparePhaseNum,
  findPhaseInternal,
  resolveActiveMirPath,
  /**
   * Legacy API: findPhaseInternalLegacy is exported for backward compatibility with
   * external callers and integrations that depend on the legacy phase summary behavior.
   */
  findPhaseInternalLegacy,
  checkMirGates,
};
