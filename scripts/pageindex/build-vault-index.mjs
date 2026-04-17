#!/usr/bin/env node
// Build PageIndex-schema skeleton tree for the Obsidian vault.
// Walks obsidian/ folders + .md files, emits hierarchical JSON matching
// PageIndex node schema (title, node_id, start_index, end_index, summary, nodes).
// No LLM required. For deep per-document indexing, run tools/pageindex/run_pageindex.py.

import { readdir, stat, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..');
const VAULT = join(ROOT, 'obsidian');
const OUT_DIR = join(VAULT, '.pageindex');
const OUT_FILE = join(OUT_DIR, 'VAULT-INDEX.json');
const OUT_MD = join(OUT_DIR, 'VAULT-INDEX.md');

const SKIP = new Set(['.obsidian', '.pageindex', '.claude', '.claude-plugin', '.trash']);

let counter = 0;
const nodeId = () => String(++counter).padStart(4, '0');

function parseFrontMatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

function extractHeadings(content, max = 6) {
  const headings = [];
  let inFence = false;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;
    const h = l.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (h) headings.push({ level: h[1].length, title: h[2], line: i + 1 });
    if (headings.length >= max) break;
  }
  return headings;
}

async function indexFile(absPath) {
  const content = await readFile(absPath, 'utf8');
  const fm = parseFrontMatter(content);
  const headings = extractHeadings(content);
  const rel = relative(VAULT, absPath).split(sep).join(posix.sep);
  const title = fm.title || rel.split('/').pop().replace(/\.md$/, '');
  const summary = fm.description || (headings[0]?.title ?? '').slice(0, 240);
  const lineCount = content.split('\n').length;

  const node = {
    title,
    node_id: nodeId(),
    path: rel,
    start_index: 1,
    end_index: lineCount,
    summary,
    tags: fm.tags ? fm.tags.replace(/^[\[\s]+|[\]\s]+$/g, '').split(/[,\s]+/).filter(Boolean) : [],
  };

  if (headings.length) {
    node.nodes = headings.map((h) => ({
      title: h.title,
      node_id: nodeId(),
      start_index: h.line,
      end_index: lineCount,
      summary: `${rel}#${h.title}`,
    }));
  }
  return node;
}

async function indexDir(absDir) {
  const entries = await readdir(absDir);
  const dirNodes = [];
  const fileNodes = [];
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const abs = join(absDir, name);
    const st = await stat(abs);
    if (st.isDirectory()) dirNodes.push(await indexDir(abs));
    else if (st.isFile() && name.endsWith('.md')) fileNodes.push(await indexFile(abs));
  }
  const rel = relative(VAULT, absDir).split(sep).join(posix.sep) || '.';
  return {
    title: rel === '.' ? 'Obsidian Vault (MarkOS Second Brain)' : rel.split('/').pop(),
    node_id: nodeId(),
    path: rel,
    start_index: 0,
    end_index: 0,
    summary: `${fileNodes.length} notes, ${dirNodes.length} subfolders`,
    nodes: [...dirNodes, ...fileNodes],
  };
}

function flatten(node, out = []) {
  out.push({ node_id: node.node_id, title: node.title, path: node.path, summary: node.summary });
  for (const c of node.nodes || []) flatten(c, out);
  return out;
}

function renderMd(root) {
  const lines = [
    '---',
    'date: ' + new Date().toISOString().slice(0, 10),
    'description: PageIndex-schema navigational tree of the vault. Regenerate with npm run vault:index.',
    'tags: [index, moc, pageindex]',
    '---',
    '',
    '# Vault PageIndex',
    '',
    '> Auto-generated. Do not edit by hand. Regenerate with `node scripts/pageindex/build-vault-index.mjs`.',
    '',
  ];
  const walk = (n, depth) => {
    const indent = '  '.repeat(depth);
    if (n.path && n.path.endsWith('.md')) {
      const name = n.title;
      lines.push(`${indent}- [[${n.path.replace(/\.md$/, '')}|${name}]] — ${n.summary || ''}`);
    } else {
      lines.push(`${indent}- **${n.title}/**`);
    }
    for (const c of n.nodes || []) walk(c, depth + 1);
  };
  walk(root, 0);
  return lines.join('\n') + '\n';
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const tree = await indexDir(VAULT);
  await writeFile(OUT_FILE, JSON.stringify(tree, null, 2));
  await writeFile(OUT_MD, renderMd(tree));
  const flat = flatten(tree);
  await writeFile(join(OUT_DIR, 'VAULT-FLAT.json'), JSON.stringify(flat, null, 2));
  console.log(`[pageindex] wrote ${OUT_FILE} (${flat.length} nodes)`);
  console.log(`[pageindex] wrote ${OUT_MD}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
