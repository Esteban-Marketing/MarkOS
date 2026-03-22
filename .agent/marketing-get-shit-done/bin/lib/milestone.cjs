/**
 * milestone.cjs — Milestone management for MGSD
 * Handles archiving, closing, and listing marketing milestones
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Archive phase directories for a given milestone version
 * @param {string} projectRoot - root of planning directory
 * @param {string} version - milestone version (e.g., '1.0')
 * @returns {{archived: string[], skipped: string[]}}
 */
function archiveMilestone(projectRoot, version) {
  const phasesDir = path.join(projectRoot, '.planning', 'phases');
  const archiveDir = path.join(projectRoot, '.planning', 'milestones', `v${version}-phases`);
  const roadmapPath = path.join(projectRoot, '.planning', 'ROADMAP.md');

  if (!fs.existsSync(phasesDir)) return { archived: [], skipped: [] };
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

  const roadmapContent = fs.existsSync(roadmapPath) ? fs.readFileSync(roadmapPath, 'utf8') : '';
  const completedPhases = [];

  // Find phase numbers marked complete [x] in ROADMAP
  const phaseMatches = roadmapContent.matchAll(/#{1,3}\s+Phase\s+(\d+(?:\.\d+)?)[:\s]/g);
  for (const match of phaseMatches) {
    const phaseNum = match[1];
    // Check if this phase section contains [x] for all three checkboxes
    const sectionStart = match.index;
    const sectionEnd = roadmapContent.indexOf('\n###', sectionStart + 1);
    const section = sectionEnd > -1 
      ? roadmapContent.slice(sectionStart, sectionEnd)
      : roadmapContent.slice(sectionStart);
    if ((section.match(/\[x\]/gi) || []).length >= 2) {
      completedPhases.push(phaseNum);
    }
  }

  const archived = [];
  const skipped = [];

  const phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dir of phaseDirs) {
    const phaseNum = dir.replace(/^0*/, '').split('-')[0];
    if (completedPhases.includes(phaseNum)) {
      const src = path.join(phasesDir, dir);
      const dest = path.join(archiveDir, dir);
      fs.renameSync(src, dest);
      archived.push(dir);
    } else {
      skipped.push(dir);
    }
  }

  return { archived, skipped };
}

/**
 * Close a milestone in ROADMAP.md — wrap section in <details> block
 * @param {string} projectRoot
 * @param {string} version
 * @param {string} milestoneName
 * @returns {{success: boolean, roadmapPath: string}}
 */
function closeMilestone(projectRoot, version, milestoneName) {
  const roadmapPath = path.join(projectRoot, '.planning', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) return { success: false, roadmapPath };

  let content = fs.readFileSync(roadmapPath, 'utf8');
  const date = new Date().toISOString().split('T')[0];

  // Find the milestone heading and wrap completed phases
  const milestoneHeading = new RegExp(`## v${version.replace('.', '\\.')}[^\n]*\n`);
  const match = content.match(milestoneHeading);
  if (!match) return { success: false, roadmapPath };

  const start = match.index;
  // Find the next milestone heading or end of file
  const nextMilestone = content.indexOf('\n## v', start + 1);
  const end = nextMilestone > -1 ? nextMilestone : content.length;

  const section = content.slice(start, end);
  const wrapped = `<details>\n<summary>v${version} — ${milestoneName} (Completed ${date})</summary>\n\n${section.trim()}\n\n</details>\n`;

  content = content.slice(0, start) + wrapped + content.slice(end);
  fs.writeFileSync(roadmapPath, content, 'utf8');

  return { success: true, roadmapPath };
}

/**
 * List all archived milestones
 * @param {string} projectRoot
 * @returns {string[]} list of milestone version strings
 */
function listMilestones(projectRoot) {
  const milestonesDir = path.join(projectRoot, '.planning', 'milestones');
  if (!fs.existsSync(milestonesDir)) return [];

  return fs.readdirSync(milestonesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.match(/^v[\d.]+-phases$/))
    .map(d => d.name.replace('-phases', ''));
}

module.exports = { archiveMilestone, closeMilestone, listMilestones };
