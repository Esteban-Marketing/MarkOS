# Folders

## Top-Level Maintained Directories

### `api/`

Purpose: hosted wrappers for serverless deployment paths.
Refresh trigger: add/remove wrapper files or auth behavior changes.

### `bin/`

Purpose: user-facing install/update/admin CLIs.
Refresh trigger: new CLI command or changed invocation contract.

### `onboarding/`

Purpose: onboarding UI and backend runtime.
Refresh trigger: route changes, handler ownership shifts, or new sublayers.

### `.agent/`

Purpose: protocol and GSD engines, tools, skills, and templates.
Refresh trigger: new bin tools, workflow files, or protocol path changes.

### `.planning/`

Purpose: canonical planning artifacts, roadmap/state, and this codebase map.
Refresh trigger: milestone/phase hierarchy changes or planning conventions shift.

### `RESEARCH/`

Purpose: market and strategy research artifacts.
Refresh trigger: new research domains or relocation of intelligence files.

### `scripts/`

Purpose: reserved utility area; currently empty.
Refresh trigger: first maintained script addition.

### `test/`

Purpose: automated verification suites.
Refresh trigger: new suite files or major test ownership changes.

## High-Churn Nested Directories

### `onboarding/backend/agents/`

LLM orchestration, provider adapters, and telemetry operations.

### `onboarding/backend/parsers/`

Source document parsers for ingest and extraction.

### `onboarding/backend/prompts/`

Prompt modules for extraction, enrichment, questioning, and creative suggestions.

### `onboarding/backend/extractors/`, `enrichers/`, `confidences/`, `scrapers/`

Specialized extraction and enrichment surfaces used by handler routes.

### `.agent/get-shit-done/bin/lib/` and `.agent/markos/bin/lib/`

Command internals for planning and protocol operations.
