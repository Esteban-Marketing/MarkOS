---
date: 2026-04-16
description: "PageIndex output for the MarkOS vault — vectorless tree index auto-generated from folder hierarchy + note headings."
tags:
  - pageindex
  - index
---

# PageIndex Vault Index

> Auto-generated. Regenerate with `node scripts/pageindex/build-vault-index.mjs` from repo root.

## Artifacts

- `VAULT-INDEX.json` — PageIndex-schema tree (title, node_id, path, start_index, end_index, summary, nodes).
- `VAULT-INDEX.md` — Human-browsable outline of the tree with wikilinks.
- `VAULT-FLAT.json` — Flat list of every node for lookup.
- `deep/` — Per-document deep indexes produced by `scripts/pageindex/index-file.sh` (requires `OPENAI_API_KEY`).

## Regenerate

```bash
node scripts/pageindex/build-vault-index.mjs
```

## Deep-index a single document (LLM-backed)

```bash
# create tools/pageindex/.env with OPENAI_API_KEY=...
scripts/pageindex/index-file.sh obsidian/brain/Patterns.md
```

## Philosophy

PageIndex is **vectorless, reasoning-based RAG**. Over this vault the skeleton tree comes from folder hierarchy + markdown `#` headings (no LLM needed). For dense notes, the deep indexer summarizes each node via LLM and writes a full PageIndex tree.

## Related

- [[Home]]
- [[MarkOS Repo]]
