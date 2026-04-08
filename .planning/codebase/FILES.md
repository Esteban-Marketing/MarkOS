# Files

## Root Files

| File | Purpose |
|---|---|
| `README.md` | Human-facing product and onboarding overview. |
| `TECH-MAP.md` | Architecture orientation summary and component map. |
| `ARCH-DIAGRAM.md` | Visual architecture overview. |
| `package.json` | Package metadata, scripts, and CLI registration. |
| `VERSION` | Canonical package version string. |
| `vercel.json` | Hosted route mapping for `api/` wrappers. |
| `copilot-instructions.md`, `CLAUDE.md`, `GEMINI.md` | Root AI instruction and bootstrap artifacts; `copilot-instructions.md` is the shared project contract and `CLAUDE.md` is the localized project contract. |
| `tokenize.cjs` | Token utility helper. |
| `patch.ps1` | Patch utility script. |

Ownership details for these root instruction surfaces, plus `.github/**`, `.claude/**`, and `.markos-local/**`, live in `.planning/codebase/GSD-CUSTOMIZATION-BOUNDARY.md`.

## Hosted Wrapper Files (`api/`)

`approve.js`, `config.js`, `migrate.js`, `regenerate.js`, `status.js`, `submit.js`, `campaign/result.js`, `linear/sync.js`.

Each wrapper delegates to `onboarding/backend/handlers.cjs`; selected wrappers enforce hosted auth before delegation.

## User CLI Files (`bin/`)

`install.cjs`, `update.cjs`, `ensure-vector.cjs`, `ingest-literacy.cjs`, `literacy-admin.cjs`.

## Onboarding Runtime Files (`onboarding/backend/`)

- Core runtime: `server.cjs`, `handlers.cjs`, `runtime-context.cjs`, `path-constants.cjs`, `utils.cjs`
- Persistence and contracts: `vector-store-client.cjs`, `markosdb-contracts.cjs`, `write-mir.cjs`
- Integrations: `linear-client.cjs`, `literacy-chunker.cjs`
- Agents: `agents/orchestrator.cjs`, `agents/llm-adapter.cjs`, `agents/mir-filler.cjs`, `agents/msp-filler.cjs`, `agents/telemetry.cjs`, `agents/example-resolver.cjs`
- Domain modules: `extractors/schema-extractor.cjs`, `enrichers/competitor-enricher.cjs`, `confidences/confidence-scorer.cjs`, `scrapers/tavily-scraper.cjs`
- Parsers: `parsers/csv-parser.cjs`, `parsers/docx-parser.cjs`, `parsers/pdf-parser.cjs`, `parsers/text-parser.cjs`
- Prompt modules: `prompts/enrichment-prompt.js`, `prompts/extraction-prompt.js`, `prompts/grouping-prompt.js`, `prompts/partial-extraction-prompt.js`, `prompts/spark-prompt.js`

## Protocol and Planning Files

- Protocol map: `.protocol-lore/*.md`
- GSD and MarkOS tools: `.agent/get-shit-done/bin/*`, `.agent/markos/bin/*`
- Planning state and roadmap: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/PROJECT.md`
- Canonical dual-root ownership guide: `.planning/codebase/GSD-CUSTOMIZATION-BOUNDARY.md`

## Test Files (`test/`)

`core-gate.test.js`, `example-resolver.test.js`, `install.test.js`, `literacy-ingest.test.js`, `onboarding-server.test.js`, `protocol.test.js`, `setup.js`, `update.test.js`, `vector-store-client.test.js`, `write-mir.test.js`.

## Refresh Trigger

Update this file when a maintained file is added, removed, renamed, or changes primary ownership.
