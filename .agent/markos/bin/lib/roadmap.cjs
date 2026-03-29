/**
 * Roadmap — ROADMAP.md parser and utilities for MARKOS
 */

const fs = require('fs');
const path = require('path');
const { output, error, planningPaths, normalizePhaseName, comparePhaseNum } = require('./core.cjs');

function getRoadmapContent(cwd) {
  const roadmapPath = planningPaths(cwd).roadmap;
  try {
    return fs.readFileSync(roadmapPath, 'utf-8');
  } catch {
    return null;
  }
}

function cmdRoadmapGetPhase(cwd, phaseNum, raw) {
  if (!phaseNum) error('phase number required');

  const content = getRoadmapContent(cwd);
  if (!content) error('ROADMAP.md not found');

  const normalized = normalizePhaseName(phaseNum);
  const escapedNum = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match: ### Phase 1: Name or ## Phase 01: Name
  const pattern = new RegExp(
    `#{2,4}\\s*Phase\\s+${escapedNum}\\s*:\\s*([^\\n]+)`,
    'i'
  );
  const match = content.match(pattern);

  if (!match) {
    output({ found: false, phase: phaseNum }, raw, 'not_found');
    return;
  }

  const phaseName = match[1].trim();

  // Extract section content until next phase heading or end
  const sectionStart = match.index;
  const restContent = content.slice(sectionStart + match[0].length);
  const nextPhaseMatch = restContent.match(/\n#{2,4}\s*Phase\s+\d/);
  const sectionEnd = nextPhaseMatch
    ? sectionStart + match[0].length + nextPhaseMatch.index
    : content.length;
  const section = content.slice(sectionStart, sectionEnd);

  // Extract goal
  const goalMatch = section.match(/(?:Goal|Objective):\s*(.+)/i);
  const goal = goalMatch ? goalMatch[1].trim() : null;

  // Extract requirement IDs
  const reqMatch = section.match(/(?:Requirements?|REQ):\s*\[([^\]]*)\]/i);
  const reqIds = reqMatch
    ? reqMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    : null;

  output({
    found: true,
    phase_number: normalized,
    phase_name: phaseName,
    goal,
    req_ids: reqIds,
    section: section.trim(),
  }, raw, phaseName);
}

function cmdRoadmapListPhases(cwd, raw) {
  const content = getRoadmapContent(cwd);
  if (!content) error('ROADMAP.md not found');

  const phases = [];
  const pattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseName = match[2].trim();
    const isChecked = content.slice(Math.max(0, match.index - 10), match.index).includes('[x]');
    phases.push({
      number: normalizePhaseName(phaseNum),
      name: phaseName,
      completed: isChecked,
    });
  }

  phases.sort((a, b) => comparePhaseNum(a.number, b.number));
  output({ phases, count: phases.length }, raw);
}

module.exports = { getRoadmapContent, cmdRoadmapGetPhase, cmdRoadmapListPhases };
