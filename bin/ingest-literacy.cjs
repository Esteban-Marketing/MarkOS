#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const vectorStore = require('../onboarding/backend/vector-store-client.cjs');
const runtime = require('../onboarding/backend/runtime-context.cjs');
const { parseLiteracyFrontmatter, chunkLiteracyFile } = require('../onboarding/backend/literacy-chunker.cjs');

function usage() {
  console.log('Usage: node bin/ingest-literacy.cjs --path <file-or-dir> [--discipline <name>] [--dry-run] [--limit <n>] [--verbose]');
}

function parseArgs(argv) {
  const out = { dryRun: false, verbose: false, limit: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--path') out.path = argv[++i];
    else if (arg === '--discipline') out.discipline = argv[++i];
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--verbose') out.verbose = true;
    else if (arg === '--limit') out.limit = Number(argv[++i] || 0) || null;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error(`Unknown flag: ${arg}`);
  }
  return out;
}

function checksum(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

function collectMarkdownFiles(targetPath) {
  const absolute = path.resolve(process.cwd(), targetPath || 'literacy');
  if (!fs.existsSync(absolute)) throw new Error(`Path does not exist: ${absolute}`);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];

  const files = [];
  const stack = [absolute];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, item.name);
      if (item.isDirectory()) stack.push(next);
      else if (item.isFile() && next.toLowerCase().endsWith('.md')) files.push(next);
    }
  }
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.path) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const secretCheck = runtime.validateRequiredSecrets({
    runtimeMode: 'local',
    operation: 'literacy_ingest_write',
    env: process.env,
  });

  if (!secretCheck.ok && !args.dryRun) {
    throw new Error(secretCheck.error);
  }

  vectorStore.configure(runtime.loadRuntimeConfig(process.env));

  const files = collectMarkdownFiles(args.path);
  const limit = args.limit && args.limit > 0 ? args.limit : files.length;
  const selected = files.slice(0, limit);

  const summary = { files_scanned: selected.length, docs_written: 0, chunks_written: 0, errors: [] };

  for (const filePath of selected) {
    try {
      const markdown = fs.readFileSync(filePath, 'utf8');
      const metadata = parseLiteracyFrontmatter(markdown);
      const REQUIRED_FIELDS = ['doc_id', 'discipline', 'business_model', 'pain_point_tags'];
      for (const field of REQUIRED_FIELDS) {
        const value = metadata[field];
        const missing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        if (missing) {
          if (field === 'pain_point_tags') {
            throw new Error(`MISSING_REQUIRED_FIELD:pain_point_tags in ${filePath}`);
          }
          throw new Error(`MISSING_REQUIRED_FIELD:${field} in ${filePath}`);
        }
      }

      if (args.discipline && String(metadata.discipline || '').toLowerCase() !== String(args.discipline).toLowerCase()) {
        continue;
      }

      const chunks = chunkLiteracyFile(markdown, metadata);
      if (chunks.length === 0) continue;

      if (!args.dryRun && metadata.doc_id) {
        await vectorStore.supersedeLiteracyDoc(metadata.doc_id);
      }

      for (const chunk of chunks) {
        const payload = {
          chunk_id: chunk.chunk_id,
          doc_id: chunk.doc_id,
          discipline: metadata.discipline || args.discipline || 'General',
          sub_discipline: metadata.sub_discipline || null,
          business_model: Array.isArray(metadata.business_model) ? metadata.business_model : [],
          funnel_stage: metadata.funnel_stage || null,
          content_type: chunk.content_type,
          category: metadata.category || 'STANDARDS',
          status: metadata.status || 'canonical',
          evidence_level: metadata.evidence_level || null,
          source_ref: metadata.source_ref || null,
          version: metadata.version || '1.0',
          last_validated: metadata.last_validated || null,
          ttl_days: Number(metadata.ttl_days) || 180,
          retrieval_keywords: Array.isArray(metadata.retrieval_keywords) ? metadata.retrieval_keywords : [],
          pain_point_tags: Array.isArray(metadata.pain_point_tags) ? metadata.pain_point_tags : [],
          agent_use: Array.isArray(metadata.agent_use) ? metadata.agent_use : [],
          chunk_text: chunk.chunk_text,
          checksum_sha256: checksum(chunk.chunk_text),
        };

        if (args.dryRun) {
          summary.chunks_written += 1;
          continue;
        }

        const result = await vectorStore.upsertLiteracyChunk(payload);
        if (result.ok) summary.chunks_written += 1;
        else summary.errors.push({ file: filePath, chunk_id: chunk.chunk_id, error: result.error || 'UNKNOWN_ERROR' });
      }

      summary.docs_written += 1;
      if (args.verbose) {
        console.log(`[ingest-literacy] processed ${path.relative(process.cwd(), filePath)} (${chunks.length} chunks)`);
      }
    } catch (error) {
      summary.errors.push({ file: filePath, error: error.message });
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
