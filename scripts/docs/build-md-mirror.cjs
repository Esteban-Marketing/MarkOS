/**
 * build-md-mirror.cjs
 *
 * Walks the docs/ directory, collects all .md files in nav order,
 * strips any front-matter, and concatenates them into a single markdown
 * string suitable for LLM ingestion.
 *
 * Usage:
 *   node scripts/docs/build-md-mirror.cjs
 *   node scripts/docs/build-md-mirror.cjs --out public/llms-full.txt
 *
 * Returns the concatenated markdown string (also exported as buildMdMirror()).
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Resolve the project root relative to this script
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Nav order for known doc files. Files not listed appear alphabetically after.
 * Extend this list as new docs are added.
 */
const NAV_ORDER = [
  'quickstart',
  'operator-llm-setup',
  'llm-byok-architecture',
  'crm',
  'execution-queues',
  'attribution',
  'webhooks',
  'mcp',
];

/**
 * Strip YAML/TOML front-matter from a markdown string.
 * @param {string} content
 * @returns {string}
 */
function stripFrontMatter(content) {
  // YAML front-matter: --- ... ---
  const yamlMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (yamlMatch) return content.slice(yamlMatch[0].length).trimStart();

  // TOML front-matter: +++ ... +++
  const tomlMatch = content.match(/^\+\+\+\r?\n[\s\S]*?\r?\n\+\+\+\r?\n?/);
  if (tomlMatch) return content.slice(tomlMatch[0].length).trimStart();

  return content;
}

/**
 * Collect all .md files under a directory recursively.
 * @param {string} dir
 * @returns {string[]} absolute paths
 */
function collectMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Sort files by nav order, then alphabetically for unknowns.
 * @param {string[]} files - absolute paths
 * @param {string} baseDir - directory to derive slugs relative to
 * @returns {string[]} sorted absolute paths
 */
function sortByNavOrder(files, baseDir) {
  return files.slice().sort((a, b) => {
    const slugA = path.basename(a, '.md').toLowerCase();
    const slugB = path.basename(b, '.md').toLowerCase();
    const idxA = NAV_ORDER.indexOf(slugA);
    const idxB = NAV_ORDER.indexOf(slugB);

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return slugA.localeCompare(slugB);
  });
}

/**
 * Build the concatenated markdown mirror of all docs pages.
 * @param {object} [opts]
 * @param {string} [opts.docsDir] - path to docs directory (defaults to PROJECT_ROOT/docs)
 * @returns {string} concatenated markdown
 */
function buildMdMirror(opts = {}) {
  const docsDir = opts.docsDir || path.join(PROJECT_ROOT, 'docs');
  const allFiles = collectMdFiles(docsDir);
  const sorted = sortByNavOrder(allFiles, docsDir);

  if (sorted.length === 0) {
    // Return a minimal stub with project overview when no docs exist yet
    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readme = fs.readFileSync(readmePath, 'utf8');
      return `# MarkOS Documentation\n\n${stripFrontMatter(readme)}\n`;
    }
    return '# MarkOS Documentation\n\nDocumentation coming soon.\n';
  }

  const sections = sorted.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const stripped = stripFrontMatter(raw);
    const slug = path.relative(docsDir, filePath).replace(/\\/g, '/');
    const separator = `\n\n---\n<!-- source: docs/${slug} -->\n\n`;
    return separator + stripped.trimEnd();
  });

  // Prepend a header
  const header = `# MarkOS — Full Documentation\n\n> Concatenated markdown of all MarkOS documentation pages.\n> Source: https://markos.dev/docs  |  Machine-readable: https://markos.dev/docs/llms-full.txt\n`;

  return header + sections.join('\n') + '\n';
}

// CLI usage: node scripts/docs/build-md-mirror.cjs [--out <path>]
if (require.main === module) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outPath = outIdx !== -1 ? args[outIdx + 1] : null;

  const content = buildMdMirror();

  if (outPath) {
    const resolved = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content, 'utf8');
    console.log(`Written ${content.length} bytes to ${resolved}`);
  } else {
    process.stdout.write(content);
  }
}

module.exports = { buildMdMirror, stripFrontMatter, collectMdFiles, sortByNavOrder };
