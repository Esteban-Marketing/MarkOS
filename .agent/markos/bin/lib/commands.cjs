/**
 * Commands — Standalone utility commands for MGSD
 */

const fs = require('fs');
const path = require('path');
const { output, error, planningPaths, findPhaseInternal, normalizePhaseName, toPosixPath, execGit, isGitIgnored, loadConfig, safeReadFile, mgsdPaths, checkMirGates } = require('./core.cjs');
const { sanitizeForPrompt } = require('./security.cjs');

function cmdCommit(cwd, message, files, raw, noVerify) {
  if (!message) error('commit message required');

  message = sanitizeForPrompt(message);
  const config = loadConfig(cwd);

  if (!config.commit_docs) {
    output({ committed: false, hash: null, reason: 'skipped_commit_docs_false' }, raw, 'skipped');
    return;
  }

  if (isGitIgnored(cwd, '.planning')) {
    output({ committed: false, hash: null, reason: 'skipped_gitignored' }, raw, 'skipped');
    return;
  }

  const filesToStage = files && files.length > 0 ? files : ['.planning/'];
  for (const file of filesToStage) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) {
      execGit(cwd, ['rm', '--cached', '--ignore-unmatch', file]);
    } else {
      execGit(cwd, ['add', file]);
    }
  }

  const commitArgs = ['commit', '-m', message];
  if (noVerify) commitArgs.push('--no-verify');
  const commitResult = execGit(cwd, commitArgs);

  if (commitResult.exitCode !== 0) {
    if (commitResult.stdout.includes('nothing to commit') || commitResult.stderr.includes('nothing to commit')) {
      output({ committed: false, hash: null, reason: 'nothing_to_commit' }, raw, 'nothing');
      return;
    }
    output({ committed: false, hash: null, reason: 'error', error: commitResult.stderr }, raw, 'error');
    return;
  }

  const hashResult = execGit(cwd, ['rev-parse', '--short', 'HEAD']);
  const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
  output({ committed: true, hash, reason: 'committed' }, raw, hash || 'committed');
}

function cmdMirAudit(cwd, raw) {
  const paths = mgsdPaths(cwd);
  const mirPath = paths.mir;

  if (!fs.existsSync(mirPath)) {
    error('MIR templates not found at ' + mirPath);
  }

  const gates = checkMirGates(mirPath);
  const gaps = [];

  // Scan all MIR files for [FILL] placeholders
  function scanDir(dir, relativePath) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath, relPath);
        } else if (entry.name.endsWith('.md')) {
          const content = safeReadFile(fullPath);
          if (content) {
            const fills = (content.match(/\[FILL\]/g) || []).length;
            const templates = (content.match(/\{\{[^}]+\}\}/g) || []).length;
            if (fills > 0 || templates > 0) {
              gaps.push({
                file: toPosixPath(relPath),
                fill_count: fills,
                template_count: templates,
                priority: fills > 5 ? 'HIGH' : fills > 0 ? 'MEDIUM' : 'LOW',
              });
            }
          }
        }
      }
    } catch { /* dir may not exist */ }
  }

  scanDir(mirPath, 'MIR');

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  output({
    gate1: gates.gate1,
    gate2: gates.gate2,
    gaps,
    total_gaps: gaps.length,
    total_fills: gaps.reduce((sum, g) => sum + g.fill_count, 0),
  }, raw);
}

function cmdGenerateSlug(text, raw) {
  if (!text) error('text required for slug generation');
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  output({ slug }, raw, slug);
}

function cmdCurrentTimestamp(format, raw) {
  const now = new Date();
  let result;
  switch (format) {
    case 'date': result = now.toISOString().split('T')[0]; break;
    case 'filename': result = now.toISOString().replace(/:/g, '-').replace(/\..+/, ''); break;
    default: result = now.toISOString(); break;
  }
  output({ timestamp: result }, raw, result);
}

function cmdVerifyPathExists(cwd, targetPath, raw) {
  if (!targetPath) error('path required');
  if (targetPath.includes('\0')) error('path contains null bytes');

  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
  try {
    const stats = fs.statSync(fullPath);
    const type = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other';
    output({ exists: true, type }, raw, 'true');
  } catch {
    output({ exists: false, type: null }, raw, 'false');
  }
}

module.exports = { cmdCommit, cmdMirAudit, cmdGenerateSlug, cmdCurrentTimestamp, cmdVerifyPathExists };
