#!/usr/bin/env bash
# Deep-index a single markdown (or PDF) file with PageIndex LLM reasoning.
# Usage: scripts/pageindex/index-file.sh obsidian/brain/Patterns.md
# Output lands in obsidian/.pageindex/<relative>.json
set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "usage: $0 <path-to-.md-or-.pdf>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${OPENAI_API_KEY:-}" && ! -f tools/pageindex/.env ]]; then
  echo "[pageindex] OPENAI_API_KEY not set and tools/pageindex/.env missing." >&2
  echo "           Create tools/pageindex/.env with OPENAI_API_KEY=..." >&2
  exit 2
fi

OUT_DIR="obsidian/.pageindex/deep"
mkdir -p "$OUT_DIR"

cd tools/pageindex
case "$SRC" in
  *.md)  python3 run_pageindex.py --md_path  "../../$SRC" ;;
  *.pdf) python3 run_pageindex.py --pdf_path "../../$SRC" ;;
  *) echo "unsupported extension" >&2; exit 3 ;;
esac

BASE="$(basename "$SRC")"
RESULT="results/${BASE%.*}_structure.json"
if [[ -f "$RESULT" ]]; then
  DEST="../../$OUT_DIR/${BASE%.*}.json"
  cp "$RESULT" "$DEST"
  echo "[pageindex] deep index → $DEST"
fi
