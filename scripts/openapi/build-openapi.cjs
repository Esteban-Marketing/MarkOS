/**
 * build-openapi.cjs
 * Merges all contracts/F-*.yaml flows into a single OpenAPI 3.1 document.
 * Emits contracts/openapi.json + contracts/openapi.yaml.
 *
 * No external dependencies — uses a purpose-built YAML parser for the
 * contract schema subset used by MarkOS F-NN flow files.
 *
 * Usage:
 *   node scripts/openapi/build-openapi.cjs
 *   # or via npm run openapi:build
 *
 * Exports:
 *   buildOpenApiDoc(contractsDir?) → OpenAPI 3.1 document object
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Minimal YAML subset parser — handles the specific patterns in F-NN contracts
// ---------------------------------------------------------------------------

/**
 * Parse a simple MarkOS contract YAML file.
 * Supports:
 *   - top-level scalar strings (quoted or unquoted)
 *   - nested objects (indent-based)
 *   - arrays (- item)
 *   - multi-level nesting used in paths/components
 *
 * NOT a general YAML parser — tailored to the F-NN contract schema.
 */
function parseContractYaml(text) {
  const lines = text.split('\n');
  return parseBlock(lines, 0, -1).value;
}

function parseBlock(lines, startIndex, parentIndent) {
  const result = {};
  let i = startIndex;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();

    // Skip empty lines and comments
    if (!trimmed || trimmed.trimStart().startsWith('#')) {
      i++;
      continue;
    }

    const indent = raw.search(/\S/);

    // If this line is at or below the parent indent, stop (return to parent)
    if (parentIndent >= 0 && indent <= parentIndent) {
      break;
    }

    const stripped = trimmed.trim();

    // --- Array item: "- value" or "- key: value"
    if (stripped.startsWith('- ')) {
      // We're inside a sequence, return and let the array collector handle it
      break;
    }

    // --- Key: value line
    const colonIdx = stripped.indexOf(':');
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = stripped.slice(0, colonIdx).trim();
    let rest = stripped.slice(colonIdx + 1).trim();

    if (!key) {
      i++;
      continue;
    }

    // Look ahead for block value
    let nextNonEmpty = i + 1;
    while (nextNonEmpty < lines.length) {
      const nl = lines[nextNonEmpty];
      if (nl.trim() === '' || nl.trim().startsWith('#')) {
        nextNonEmpty++;
      } else {
        break;
      }
    }

    const nextIndent = nextNonEmpty < lines.length ? lines[nextNonEmpty].search(/\S/) : -1;

    // Check if next content is a nested block or array
    if (rest === '' && nextIndent > indent) {
      const nextTrimmed = nextNonEmpty < lines.length ? lines[nextNonEmpty].trim() : '';

      if (nextTrimmed.startsWith('- ')) {
        // Collect array
        const { items, endIndex } = collectArray(lines, nextNonEmpty, indent);
        result[key] = items;
        i = endIndex;
        continue;
      } else {
        // Collect nested object
        const { value, endIndex } = collectObject(lines, nextNonEmpty, indent);
        result[key] = value;
        i = endIndex;
        continue;
      }
    }

    // Inline value
    result[key] = parseScalar(rest);
    i++;
  }

  return { value: result, endIndex: i };
}

function collectObject(lines, startIndex, parentIndent) {
  const obj = {};
  let i = startIndex;
  const blockIndent = lines[startIndex].search(/\S/);

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();
    if (!trimmed || trimmed.trim().startsWith('#')) {
      i++;
      continue;
    }
    const indent = raw.search(/\S/);
    if (indent < blockIndent) break; // dedent means end of block
    if (indent === parentIndent) break; // back to parent level

    const stripped = trimmed.trim();

    // Array item at this level
    if (stripped.startsWith('- ') && indent === blockIndent) {
      // Actually we're collecting an object — treat as parent level stop
      break;
    }

    const colonIdx = stripped.indexOf(':');
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = stripped.slice(0, colonIdx).trim();
    let rest = stripped.slice(colonIdx + 1).trim();

    // Look ahead
    let nextNonEmpty = i + 1;
    while (nextNonEmpty < lines.length) {
      const nl = lines[nextNonEmpty];
      if (!nl.trim() || nl.trim().startsWith('#')) nextNonEmpty++;
      else break;
    }
    const nextIndent = nextNonEmpty < lines.length ? lines[nextNonEmpty].search(/\S/) : -1;
    const nextTrimmed = nextNonEmpty < lines.length ? lines[nextNonEmpty].trim() : '';

    if (rest === '' && nextIndent > indent) {
      if (nextTrimmed.startsWith('- ')) {
        const { items, endIndex } = collectArray(lines, nextNonEmpty, indent);
        obj[key] = items;
        i = endIndex;
        continue;
      } else {
        const { value, endIndex } = collectObject(lines, nextNonEmpty, indent);
        obj[key] = value;
        i = endIndex;
        continue;
      }
    }

    obj[key] = parseScalar(rest);
    i++;
  }

  return { value: obj, endIndex: i };
}

function collectArray(lines, startIndex, parentIndent) {
  const items = [];
  let i = startIndex;
  const arrayIndent = lines[startIndex].search(/\S/);

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();
    if (!trimmed || trimmed.trim().startsWith('#')) {
      i++;
      continue;
    }
    const indent = raw.search(/\S/);
    if (indent < arrayIndent) break;
    if (indent > arrayIndent) {
      // continuation of a complex item — skip (handled below)
      i++;
      continue;
    }

    const stripped = trimmed.trim();

    if (!stripped.startsWith('- ')) break;

    const itemRaw = stripped.slice(2).trim();

    // Check if item is a scalar or an inline key-value
    if (!itemRaw || itemRaw === '') {
      // Multi-line item
      const nextNonEmpty = findNextNonEmpty(lines, i + 1);
      if (nextNonEmpty >= 0 && lines[nextNonEmpty].search(/\S/) > arrayIndent) {
        const { value, endIndex } = collectObject(lines, nextNonEmpty, arrayIndent);
        items.push(value);
        i = endIndex;
        continue;
      }
      items.push(null);
      i++;
      continue;
    }

    // Inline key: value after -
    const colonIdx = itemRaw.indexOf(':');
    if (colonIdx > 0) {
      const k = itemRaw.slice(0, colonIdx).trim();
      const v = itemRaw.slice(colonIdx + 1).trim();
      // Could be a single-key object
      const itemObj = { [k]: parseScalar(v) };
      // Check for continuation
      const ni = findNextNonEmpty(lines, i + 1);
      if (ni >= 0 && lines[ni].search(/\S/) > arrayIndent) {
        const { value: extra, endIndex } = collectObject(lines, ni, arrayIndent);
        Object.assign(itemObj, extra);
        items.push(itemObj);
        i = endIndex;
        continue;
      }
      items.push(itemObj);
    } else {
      items.push(parseScalar(itemRaw));
    }
    i++;
  }

  return { items, endIndex: i };
}

function findNextNonEmpty(lines, start) {
  for (let j = start; j < lines.length; j++) {
    const t = lines[j].trim();
    if (t && !t.startsWith('#')) return j;
  }
  return -1;
}

function parseScalar(val) {
  if (val === '') return '';
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  // Quoted string
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  // Number
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
  return val;
}

// ---------------------------------------------------------------------------
// Serialize object to YAML (minimal, for output)
// ---------------------------------------------------------------------------

function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return String(obj);
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    // Quote if contains special characters
    if (/[:#\[\]{},\|>&*!%@`'"?]/.test(obj) || obj.includes('\n') || obj === '' ||
        obj === 'true' || obj === 'false' || obj === 'null') {
      return JSON.stringify(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const v = toYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const lines = v.split('\n');
        const first = lines[0];
        const rest = lines.slice(1).join('\n');
        return `${pad}- ${first}${rest ? '\n' + rest : ''}`;
      }
      return `${pad}- ${v}`;
    }).join('\n');
  }
  // Object
  const keys = Object.keys(obj);
  if (keys.length === 0) return '{}';
  return keys.map(k => {
    const v = obj[k];
    const yk = toYaml(k, 0); // key never needs special indent
    if (v === null || v === undefined) return `${pad}${k}: null`;
    if (typeof v === 'object') {
      if (Array.isArray(v)) {
        if (v.length === 0) return `${pad}${k}: []`;
        return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
      }
      if (Object.keys(v).length === 0) return `${pad}${k}: {}`;
      return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
    }
    return `${pad}${k}: ${toYaml(v, 0)}`;
  }).join('\n');
}

// ---------------------------------------------------------------------------
// Core merge logic
// ---------------------------------------------------------------------------

const OPENAPI_VERSION = '3.1.0';
const DOC_VERSION = '1.0.0';

/**
 * Build the merged OpenAPI 3.1 document from all F-NN contracts.
 *
 * @param {string} [contractsDir] - path to contracts directory (defaults to repo root/contracts)
 * @returns {object} OpenAPI 3.1 document
 */
function buildOpenApiDoc(contractsDir) {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const dir = contractsDir || path.join(repoRoot, 'contracts');

  const files = fs.readdirSync(dir)
    .filter(f => /^F-\d+.*\.yaml$/i.test(f))
    .sort(); // deterministic order

  const flowIds = [];
  const mergedPaths = {};
  const mergedComponents = { schemas: {}, parameters: {}, responses: {}, requestBodies: {}, examples: {}, headers: {}, securitySchemes: {} };
  const mergedTags = [];
  const seenTags = new Set();

  for (const file of files) {
    const filePath = path.join(dir, file);
    const text = fs.readFileSync(filePath, 'utf8');
    const doc = parseContractYaml(text);

    // Extract flow identifier
    const flowId = doc.flow_id || doc.id || path.basename(file, '.yaml');
    flowIds.push({ flowId, file });

    // Collect tag from domain or flow_name
    const domain = doc.domain || 'general';
    const tagName = domain;
    if (!seenTags.has(tagName)) {
      seenTags.add(tagName);
      mergedTags.push({
        name: tagName,
        description: `${tagName} domain flows`
      });
    }

    // Merge paths
    if (doc.paths && typeof doc.paths === 'object') {
      for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
        if (!mergedPaths[pathKey]) {
          mergedPaths[pathKey] = {};
        }
        // Annotate operations with flow metadata
        const annotated = annotatePathItem(pathItem, {
          flowId,
          flowName: doc.flow_name || doc.name || file,
          domain,
          version: doc.version || 'v1',
          tags: [tagName],
        });
        Object.assign(mergedPaths[pathKey], annotated);
      }
    } else {
      // Contract without OpenAPI paths — generate a synthetic path entry
      const syntheticPath = deriveSyntheticPath(doc, file);
      if (syntheticPath) {
        const { pathKey, pathItem } = syntheticPath;
        if (!mergedPaths[pathKey]) {
          mergedPaths[pathKey] = {};
        }
        Object.assign(mergedPaths[pathKey], annotatePathItem(pathItem, {
          flowId,
          flowName: doc.flow_name || doc.name || file,
          domain,
          version: doc.version || 'v1',
          tags: [tagName],
        }));
      }
    }

    // Merge components
    if (doc.components && typeof doc.components === 'object') {
      for (const [sectionKey, sectionValue] of Object.entries(doc.components)) {
        if (!mergedComponents[sectionKey]) {
          mergedComponents[sectionKey] = {};
        }
        if (sectionValue && typeof sectionValue === 'object') {
          Object.assign(mergedComponents[sectionKey], prefixComponentKeys(sectionValue, flowId));
        }
      }
    }
  }

  // Build x-markos-flows index
  const flowsIndex = {};
  for (const { flowId, file } of flowIds) {
    flowsIndex[flowId] = {
      source: `contracts/${file}`,
      description: `MarkOS flow ${flowId}`
    };
  }

  // Clean up empty component sections
  const cleanComponents = {};
  for (const [k, v] of Object.entries(mergedComponents)) {
    if (v && Object.keys(v).length > 0) {
      cleanComponents[k] = v;
    }
  }

  const openApiDoc = {
    openapi: OPENAPI_VERSION,
    info: {
      title: 'MarkOS API',
      version: DOC_VERSION,
      description: 'Merged OpenAPI 3.1 specification for all MarkOS F-NN flow contracts. ' +
        `Generated from ${flowIds.length} flow contracts.`,
      contact: {
        name: 'MarkOS Engineering',
        url: 'https://markos.esteban.marketing'
      },
      license: {
        name: 'MIT'
      }
    },
    'x-markos-flows': flowsIndex,
    tags: mergedTags.sort((a, b) => a.name.localeCompare(b.name)),
    paths: sortObjectKeys(mergedPaths),
    components: cleanComponents
  };

  return openApiDoc;
}

/**
 * Annotate path item operations with flow metadata (tags, x-flow-id, etc.)
 */
function annotatePathItem(pathItem, meta) {
  if (!pathItem || typeof pathItem !== 'object') return pathItem;
  const annotated = {};
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
  for (const [method, operation] of Object.entries(pathItem)) {
    if (httpMethods.includes(method.toLowerCase()) && operation && typeof operation === 'object') {
      annotated[method] = {
        ...operation,
        tags: operation.tags || meta.tags,
        'x-flow-id': meta.flowId,
        'x-flow-name': meta.flowName,
        'x-domain': meta.domain,
        'x-flow-version': meta.version
      };
    } else {
      annotated[method] = operation;
    }
  }
  return annotated;
}

/**
 * For contracts that don't have explicit OpenAPI paths (custom format),
 * generate a synthetic path entry to represent the flow.
 */
function deriveSyntheticPath(doc, file) {
  // Try to infer path from hosted_path or local_path in x-markos-meta
  const meta = doc['x-markos-meta'] || {};
  const hosted = meta.hosted_path || meta.local_path;
  if (hosted) {
    // Handle pipe-separated paths
    const pathKey = hosted.split('|')[0].trim();
    const method = (meta.method || 'post').toLowerCase();
    return {
      pathKey,
      pathItem: {
        [method]: {
          summary: doc.info ? doc.info.description || doc.flow_name || file : doc.name || file,
          operationId: sanitizeOperationId(doc.flow_name || doc.name || file),
          responses: {
            '200': { description: 'Success' }
          }
        }
      }
    };
  }

  // Generate from flow_name
  const flowName = doc.flow_name || doc.name;
  if (flowName) {
    const pathKey = `/api/${flowName.replace(/_/g, '-')}`;
    return {
      pathKey,
      pathItem: {
        post: {
          summary: (doc.info && doc.info.description) || flowName,
          operationId: sanitizeOperationId(flowName),
          responses: {
            '200': { description: 'Success' }
          }
        }
      }
    };
  }

  return null;
}

function sanitizeOperationId(name) {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Prefix component schema keys with a flow-scoped prefix to avoid collision.
 */
function prefixComponentKeys(obj, flowId) {
  const prefix = flowId.replace(/[^a-zA-Z0-9]/g, '_') + '_';
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    // Only prefix if not already globally unique
    result[prefix + k] = v;
  }
  return result;
}

function sortObjectKeys(obj) {
  const sorted = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = obj[k];
  }
  return sorted;
}

// ---------------------------------------------------------------------------
// CLI entry-point
// ---------------------------------------------------------------------------

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const contractsDir = path.join(repoRoot, 'contracts');
  const outJson = path.join(contractsDir, 'openapi.json');
  const outYaml = path.join(contractsDir, 'openapi.yaml');

  console.log('Building OpenAPI 3.1 document...');

  const doc = buildOpenApiDoc(contractsDir);

  const flowCount = Object.keys(doc['x-markos-flows']).length;
  const pathCount = Object.keys(doc.paths).length;

  // Write JSON (deterministic: stable key order, 2-space indent)
  const jsonOutput = JSON.stringify(doc, null, 2) + '\n';
  fs.writeFileSync(outJson, jsonOutput, 'utf8');
  console.log(`  Written: ${outJson}`);

  // Write YAML
  const yamlOutput = '# MarkOS OpenAPI 3.1 — generated by scripts/openapi/build-openapi.cjs\n' +
    '# Do not edit directly. Run: npm run openapi:build\n\n' +
    toYaml(doc, 0) + '\n';
  fs.writeFileSync(outYaml, yamlOutput, 'utf8');
  console.log(`  Written: ${outYaml}`);

  console.log(`\nDone. ${flowCount} F-NN flows merged into ${pathCount} paths.`);
  console.log(`  info.version: ${doc.info.version}`);
}

// Run when called directly
if (require.main === module) {
  main();
}

module.exports = { buildOpenApiDoc, parseContractYaml, toYaml };
