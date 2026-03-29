/**
 * verify.cjs — Verification utilities for MARKOS
 * Checks MIR gate status, tracking setup, and template variables
 */

'use strict';

const fs = require('fs');
const path = require('path');

const FILL_PATTERN = /\[FILL\]|\{\{[A-Z_]+\}\}|\[TBD\]/g;

/**
 * Check MIR gate status for a project
 * @param {string} mirDir - path to MIR directory
 * @returns {{gate1: {status: 'green'|'red', gaps: string[]}, gate2: {status: 'green'|'red', gaps: string[]}}}
 */
function checkMIRGates(mirDir) {
  // Gate 1: Identity files (must be populated)
  const gate1Files = [
    'Core_Strategy/01_COMPANY/PROFILE.md',
    'Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md',
    'Core_Strategy/02_BRAND/BRAND-IDENTITY.md',
    'Core_Strategy/02_BRAND/VOICE-TONE.md',
    'Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md',
    'Market_Audiences/03_MARKET/AUDIENCES.md',
    'Market_Audiences/03_MARKET/POSITIONING.md',
  ];

  // Gate 2: Execution files (should be populated for campaign work)
  const gate2Files = [
    'Core_Strategy/06_TECH-STACK/TRACKING.md',
    'Core_Strategy/06_TECH-STACK/AUTOMATION.md',
    'Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md',
    'Products/04_PRODUCTS/CATALOG.md',
  ];

  function checkFiles(files) {
    const gaps = [];
    for (const file of files) {
      const fullPath = path.join(mirDir, file);
      if (!fs.existsSync(fullPath)) {
        gaps.push(`${file} — file missing`);
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      const fills = content.match(FILL_PATTERN);
      if (fills && fills.length > 0) {
        gaps.push(`${file} — ${fills.length} [FILL] placeholder(s)`);
      }
    }
    return { status: gaps.length === 0 ? 'green' : 'red', gaps };
  }

  return {
    gate1: checkFiles(gate1Files),
    gate2: checkFiles(gate2Files),
  };
}

/**
 * Check tracking setup completeness
 * @param {string} trackingPath - path to TRACKING.md
 * @returns {{complete: boolean, events: string[], gaps: string[]}}
 */
function checkTrackingSetup(trackingPath) {
  if (!fs.existsSync(trackingPath)) {
    return { complete: false, events: [], gaps: ['TRACKING.md file missing'] };
  }

  const content = fs.readFileSync(trackingPath, 'utf8');
  const fills = (content.match(FILL_PATTERN) || []);
  const eventMatches = content.match(/event[:\s]+[`'"]?(\w+)[`'"]?/gi) || [];
  const events = eventMatches.map(m => m.replace(/event[:\s]+[`'"]?/i, '').replace(/[`'"]/g, ''));

  const gaps = [];
  if (fills.length > 0) gaps.push(`${fills.length} unfilled placeholders`);
  if (events.length === 0) gaps.push('No events defined');

  return {
    complete: gaps.length === 0,
    events,
    gaps,
  };
}

/**
 * Scan a file for unresolved template variable tokens
 * @param {string} filePath - path to file to scan
 * @returns {{hasGaps: boolean, tokens: string[], count: number}}
 */
function checkTemplateVariables(filePath) {
  if (!fs.existsSync(filePath)) {
    return { hasGaps: false, tokens: [], count: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const tokens = content.match(FILL_PATTERN) || [];
  const unique = [...new Set(tokens)];

  return {
    hasGaps: tokens.length > 0,
    tokens: unique,
    count: tokens.length,
  };
}

/**
 * Scan an entire directory for template variable tokens
 * @param {string} dir - directory to scan recursively
 * @param {string[]} extensions - file extensions to check (default: ['.md', '.json'])
 * @returns {{files: {path: string, count: number}[], total: number}}
 */
function scanDirectoryForGaps(dir, extensions = ['.md', '.json']) {
  const results = [];

  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        scan(fullPath);
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        const { count } = checkTemplateVariables(fullPath);
        if (count > 0) results.push({ path: fullPath, count });
      }
    }
  }

  scan(dir);
  const total = results.reduce((sum, r) => sum + r.count, 0);
  return { files: results, total };
}

module.exports = { checkMIRGates, checkTrackingSetup, checkTemplateVariables, scanDirectoryForGaps };
