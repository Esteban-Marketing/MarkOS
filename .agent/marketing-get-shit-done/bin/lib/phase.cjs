/**
 * Phase — Phase discovery, plan indexing, and wave grouping for MGSD
 */

const fs = require('fs');
const path = require('path');
const { output, error, planningPaths, findPhaseInternal, normalizePhaseName, comparePhaseNum, toPosixPath } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');

function cmdPhasePlanIndex(cwd, phaseNum, raw) {
  if (!phaseNum) error('phase number required');

  const phaseInfo = findPhaseInternal(cwd, phaseNum);
  if (!phaseInfo || !phaseInfo.found) {
    error(`Phase ${phaseNum} directory not found`);
  }

  const phaseDir = path.join(cwd, phaseInfo.directory);
  const planFiles = phaseInfo.plans;

  const plans = [];
  const waves = {};

  for (const planFile of planFiles) {
    const content = fs.readFileSync(path.join(phaseDir, planFile), 'utf-8');
    const fm = extractFrontmatter(content);

    const planId = planFile.replace('-PLAN.md', '').replace('PLAN.md', phaseInfo.phase_number);
    const wave = fm.wave || 1;
    const autonomous = fm.autonomous !== false;
    const objective = fm.objective || fm.name || planFile;
    const filesModified = fm.files_modified || fm['files-modified'] || [];
    const hasSummary = phaseInfo.summaries.some(s =>
      s.replace('-SUMMARY.md', '') === planId || s === 'SUMMARY.md'
    );

    // Count tasks
    const taskMatches = content.match(/<task[^>]*>/gi);
    const taskCount = taskMatches ? taskMatches.length : 0;

    plans.push({
      id: planId,
      file: planFile,
      wave,
      autonomous,
      objective: typeof objective === 'string' ? objective : String(objective),
      files_modified: Array.isArray(filesModified) ? filesModified : [],
      task_count: taskCount,
      has_summary: hasSummary,
    });

    if (!waves[wave]) waves[wave] = [];
    waves[wave].push(planId);
  }

  const incomplete = plans.filter(p => !p.has_summary);

  output({
    phase: phaseInfo.phase_number,
    plans,
    waves,
    incomplete: incomplete.map(p => p.id),
    has_checkpoints: plans.some(p => !p.autonomous),
  }, raw);
}

function cmdFindPhase(cwd, phaseNum, raw) {
  if (!phaseNum) error('phase number required');

  const result = findPhaseInternal(cwd, phaseNum);
  if (!result) {
    output({ found: false, phase: phaseNum }, raw, 'not_found');
    return;
  }

  output(result, raw, result.directory);
}

function cmdPhaseComplete(cwd, phaseNum, raw) {
  if (!phaseNum) error('phase number required');

  const roadmapPath = planningPaths(cwd).roadmap;
  const statePath = planningPaths(cwd).state;
  const today = new Date().toISOString().split('T')[0];

  // Update ROADMAP.md — mark phase checkbox
  try {
    let roadmap = fs.readFileSync(roadmapPath, 'utf-8');
    const normalized = normalizePhaseName(phaseNum);
    const pattern = new RegExp(`(- \\[ \\].*Phase\\s+${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    roadmap = roadmap.replace(pattern, (match) => match.replace('- [ ]', `- [x]`) + ` ✓ ${today}`);
    fs.writeFileSync(roadmapPath, roadmap, 'utf-8');
  } catch (err) {
    error('Failed to update ROADMAP.md: ' + err.message);
  }

  // Update STATE.md
  try {
    let state = fs.readFileSync(statePath, 'utf-8');
    state = state.replace(/^status:\s*.+$/m, 'status: Phase Complete');
    fs.writeFileSync(statePath, state, 'utf-8');
  } catch { /* STATE.md may not exist */ }

  // Find next phase
  const { cmdRoadmapListPhases } = require('./roadmap.cjs');
  let nextPhase = null;
  let nextPhaseName = null;
  try {
    const roadmap = fs.readFileSync(roadmapPath, 'utf-8');
    const pattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
    let match;
    let foundCurrent = false;
    while ((match = pattern.exec(roadmap)) !== null) {
      if (foundCurrent) {
        nextPhase = match[1];
        nextPhaseName = match[2].trim();
        break;
      }
      if (normalizePhaseName(match[1]) === normalizePhaseName(phaseNum)) {
        foundCurrent = true;
      }
    }
  } catch { /* ok */ }

  const isLast = !nextPhase;

  output({
    completed: true,
    phase: phaseNum,
    date: today,
    next_phase: nextPhase,
    next_phase_name: nextPhaseName,
    is_last_phase: isLast,
  }, raw, `Phase ${phaseNum} complete`);
}

module.exports = { cmdPhasePlanIndex, cmdFindPhase, cmdPhaseComplete };
