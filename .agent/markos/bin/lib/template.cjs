/**
 * template.cjs — Template scaffolding utilities for MGSD
 * Copies MIR/MSP templates and fills placeholder tokens
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATE_BASE = path.join(__dirname, '..', '..', 'templates');

/**
 * Scaffold the full MIR directory structure for a new project
 * @param {string} projectDir - target project directory
 * @returns {{created: string[], skipped: string[]}}
 */
function scaffoldMIR(projectDir) {
  const mirTemplatePath = path.join(TEMPLATE_BASE, 'MIR');
  const mirTargetPath = path.join(projectDir, 'MIR');
  return copyDirectory(mirTemplatePath, mirTargetPath);
}

/**
 * Scaffold the full MSP directory structure for a new project
 * @param {string} projectDir - target project directory
 * @returns {{created: string[], skipped: string[]}}
 */
function scaffoldMSP(projectDir) {
  const mspTemplatePath = path.join(TEMPLATE_BASE, 'MSP');
  const mspTargetPath = path.join(projectDir, 'MSP');
  return copyDirectory(mspTemplatePath, mspTargetPath);
}

/**
 * Fill [FILL], {{VARIABLE}}, and [TBD] tokens in a template string
 * @param {string} templatePath - path to template file
 * @param {Object} vars - key/value pairs to substitute
 * @param {string} [outputPath] - path to write output (if omitted, returns string)
 * @returns {string} populated content
 */
function populateTemplate(templatePath, vars, outputPath) {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  let content = fs.readFileSync(templatePath, 'utf8');

  // Replace {{VAR_NAME}} tokens
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    content = content.replace(pattern, String(value));
  }

  // Replace {key} shorthand tokens
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    content = content.replace(pattern, String(value));
  }

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, content, 'utf8');
  }

  return content;
}

/**
 * List all available template files
 * @param {string} [subdir] - optional subdirectory within templates
 * @returns {string[]} relative paths to template files
 */
function listTemplates(subdir = '') {
  const targetDir = path.join(TEMPLATE_BASE, subdir);
  if (!fs.existsSync(targetDir)) return [];

  const results = [];
  function scan(dir, base) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.join(base, entry.name);
      if (entry.isDirectory()) scan(full, rel);
      else results.push(rel);
    }
  }
  scan(targetDir, subdir);
  return results;
}

// --- Internal helpers ---

function copyDirectory(src, dest) {
  const created = [];
  const skipped = [];

  if (!fs.existsSync(src)) return { created, skipped };
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  function copy(srcDir, destDir) {
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
        copy(srcPath, destPath);
      } else {
        if (fs.existsSync(destPath)) {
          skipped.push(destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
          created.push(destPath);
        }
      }
    }
  }

  copy(src, dest);
  return { created, skipped };
}

module.exports = { scaffoldMIR, scaffoldMSP, populateTemplate, listTemplates };
