/**
 * Frontmatter — YAML frontmatter parser for MGSD markdown files
 */

/**
 * Extract YAML frontmatter from markdown content.
 * Returns an object with parsed key-value pairs.
 */
function extractFrontmatter(content) {
  if (!content || typeof content !== 'string') return {};

  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentList = null;

  for (const line of lines) {
    // Key-value pair
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      // Check for inline array: [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        fm[currentKey] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        currentList = null;
      } else if (value === '' || value === '|') {
        // Start of a list or multiline value
        currentList = currentKey;
        fm[currentKey] = [];
      } else {
        // Parse booleans and numbers
        if (value === 'true') fm[currentKey] = true;
        else if (value === 'false') fm[currentKey] = false;
        else if (!isNaN(value) && value !== '') fm[currentKey] = Number(value);
        else fm[currentKey] = value.replace(/^['"]|['"]$/g, '');
        currentList = null;
      }
      continue;
    }

    // List item
    const listMatch = line.match(/^\s+-\s+(.*)/);
    if (listMatch && currentList) {
      fm[currentList].push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
  }

  return fm;
}

/**
 * Build YAML frontmatter string from object.
 */
function buildFrontmatter(obj) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${key}:`);
      for (const [k, v] of Object.entries(value)) {
        lines.push(`  ${k}: ${JSON.stringify(v)}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

module.exports = { extractFrontmatter, buildFrontmatter };
