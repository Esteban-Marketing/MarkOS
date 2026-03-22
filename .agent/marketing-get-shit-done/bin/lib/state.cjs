/**
 * State — STATE.md read/write operations for MGSD
 */

const fs = require('fs');
const path = require('path');
const { output, error, planningPaths, normalizeMd } = require('./core.cjs');

function readState(cwd) {
  const statePath = planningPaths(cwd).state;
  try {
    return fs.readFileSync(statePath, 'utf-8');
  } catch {
    return null;
  }
}

function cmdStateBeginPhase(cwd, phaseNumber, phaseName, planCount, raw) {
  const statePath = planningPaths(cwd).state;
  const today = new Date().toISOString().split('T')[0];

  let content = readState(cwd);
  if (!content) {
    content = `---\nstatus: Active\nmilestone: v1.0\n---\n\n# Project State\n\n`;
  }

  // Update frontmatter fields
  content = content.replace(/^status:\s*.+$/m, 'status: Active');

  // Update or add current phase info in body
  const phaseSection = `\n## Current Phase\n\n**Phase ${phaseNumber}: ${phaseName}**\nStarted: ${today}\nPlans: 0/${planCount} complete\nStatus: In Progress\n`;

  if (content.includes('## Current Phase')) {
    content = content.replace(/## Current Phase[\s\S]*?(?=\n## |\n---|\Z)/, phaseSection.trim());
  } else {
    content += phaseSection;
  }

  fs.writeFileSync(statePath, normalizeMd(content), 'utf-8');
  output({ updated: true, phase: phaseNumber, name: phaseName }, raw, 'updated');
}

function cmdStateUpdate(cwd, field, value, raw) {
  const statePath = planningPaths(cwd).state;
  let content = readState(cwd);
  if (!content) error('STATE.md not found');

  const regex = new RegExp(`^${field}:\\s*.+$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${field}: ${value}`);
  } else {
    // Add after frontmatter
    content = content.replace(/^---\s*$/m, `---\n${field}: ${value}`);
  }

  fs.writeFileSync(statePath, normalizeMd(content), 'utf-8');
  output({ updated: true, field, value }, raw, `${field}=${value}`);
}

module.exports = { readState, cmdStateBeginPhase, cmdStateUpdate };
