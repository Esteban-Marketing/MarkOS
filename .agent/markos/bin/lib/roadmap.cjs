/**
 * Extracts a phase section from the roadmap content given the start index and heading match.
 *
 * @param {string} content - The full ROADMAP.md content.
 * @param {number} sectionStart - The index in content where the phase heading starts.
 * @param {RegExpMatchArray} headingMatch - The match object for the phase heading.
 * @returns {string} The extracted section content for the phase, up to the next phase heading or end of file.
 */
function extractPhaseSection(content, sectionStart, headingMatch) {
  const restContent = content.slice(sectionStart + headingMatch[0].length);
  const nextPhaseMatch = restContent.match(/\n#{2,4}\s*Phase\s+\d/i);
  const sectionEnd = nextPhaseMatch
    ? sectionStart + headingMatch[0].length + nextPhaseMatch.index
    : content.length;
  return content.slice(sectionStart, sectionEnd);
}
/**
 * Roadmap — ROADMAP.md parser and utilities for MARKOS
 */

const fs = require('fs');
const path = require('path');
const core = require('./core.cjs');
const { comparePhaseNum, error, findPhaseInternal, normalizePhaseName, output } = core;
function getRoadmapContent(cwd) {
  const roadmapPath = core.planningPaths
    ? core.planningPaths(cwd).roadmap
    : path.join(cwd, 'ROADMAP.md');
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
  const section = extractPhaseSection(content, sectionStart, match);

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


/**
 * Determines if a phase is completed based on three signals:
 * 1. Checkbox ([x]) before the heading (highest precedence)
 * 2. Status text (e.g., **Status:** Complete)
 * 3. Verification flag from phaseInfo (lowest precedence)
 *
 * Precedence: If any signal is true, the phase is considered completed.
 *
 * @param {Object} params
 * @param {string} params.content - The full ROADMAP.md content.
 * @param {RegExpMatchArray} params.match - The match object for the phase heading.
 * @param {string} params.section - The extracted section content for the phase.
 * @param {string|null} params.sectionStatus - The status string extracted from the section, if any.
 * @param {Object|null} params.phaseInfo - Additional phase metadata, if available.
 */
const PHASE_COMPLETION_CHECKS = [
  // 1. Checkbox ([x]) before heading
  ({ content, match }) => {
    const isChecked = content
      .slice(Math.max(0, match.index - 10), match.index)
      .includes('[x]');
    return isChecked;
  },
  // 2. Status text in the section
  ({ sectionStatus }) =>
    !!sectionStatus &&
    /complete|shipped|approved for transition|ready_for_human_approval/i.test(sectionStatus),
  // 3. Verification flag from phaseInfo
  ({ phaseInfo }) => !!(phaseInfo && phaseInfo.verification_passed),
];

function isPhaseCompleted({ content, match, section, sectionStatus, phaseInfo }) {
  // Any single completion signal is sufficient for the phase to be considered completed.
  return PHASE_COMPLETION_CHECKS.some(check =>
    check({ content, match, section, sectionStatus, phaseInfo })
  );
}

  while ((match = pattern.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseName = match[2].trim();
    const section = extractPhaseSection(content, match.index, match);
    const phaseInfo = findPhaseInternal(cwd, phaseNum);
    const statusMatch = section.match(/^\*\*Status:\*\*\s*(.+)$/mi);
    const sectionStatus = statusMatch ? statusMatch[1].trim() : null;
    const isCompleted = isPhaseCompleted({ content, match, section, sectionStatus, phaseInfo });
    phases.push({
      number: normalizePhaseName(phaseNum),
      name: phaseName,
      completed: isCompleted,
      verification_passed: phaseInfo ? phaseInfo.verification_passed : false,
      incomplete_plans: phaseInfo ? phaseInfo.incomplete_plans.length : null,
    });
  }

  phases.sort((a, b) => comparePhaseNum(a.number, b.number));
  output({ phases, count: phases.length }, raw);
}

module.exports = { getRoadmapContent, cmdRoadmapGetPhase, cmdRoadmapListPhases };
