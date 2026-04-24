# Folders

## Top-Level Maintained Directories

### `app/`

Purpose: Next.js App Router UI, workspace shell, marketing pages, and route handlers.
Refresh trigger: new page/route group, new operator surface, or route ownership change.

### `api/`

Purpose: hosted serverless endpoints for app/runtime domains.
Refresh trigger: new endpoint family, auth change, or contract coverage change.

### `bin/`

Purpose: package binary, install/update flows, CLI utilities, and vault/literacy helpers.
Refresh trigger: new CLI command, parser change, or distribution-path change.

### `components/`

Purpose: shared UI components, primarily CRM and MarkOS operator surfaces.
Refresh trigger: new reusable component family or cross-route ownership move.

### `contracts/`

Purpose: flow contracts, OpenAPI artifacts, and generated schema surfaces.
Refresh trigger: new `F-*` contract, OpenAPI merge change, or SDK-facing schema change.

### `docs/`

Purpose: human-facing technical docs, phase docs, and public integration docs.
Refresh trigger: new public operator/API/runtime documentation.

### `lib/`

Purpose: shared business logic and domain runtime modules.
Refresh trigger: new domain module, auth boundary change, or cross-surface service extraction.

### `onboarding/`

Purpose: local onboarding app, backend, parsers, prompts, agents, and templates.
Refresh trigger: route changes, ingestion capability changes, or onboarding/runtime repurposing.

### `public/`

Purpose: static public assets and exported text surfaces.
Refresh trigger: new static asset family or route-backed export removal.

### `sdk/`

Purpose: SDK artifacts for external consumers.
Refresh trigger: SDK generation or packaging change.

### `scripts/`

Purpose: repo automation for OpenAPI, vault/PageIndex, release smoke, and phase verification.
Refresh trigger: new build/verification/indexing automation.

### `supabase/`

Purpose: schema, migrations, RLS, and SQL assets.
Refresh trigger: any new migration or schema support file.

### `test/`

Purpose: automated verification, drift detection, contract checks, and regression protection.
Refresh trigger: new suite family or major ownership change.

### `tools/`

Purpose: supporting tools outside the product runtime, including embedded PageIndex sources.
Refresh trigger: new repo-maintained toolchain or auxiliary runtime dependency.

### `.agent/`

Purpose: MarkOS protocol and GSD engines, templates, and agent/skill logic.
Refresh trigger: new protocol surface, template family, or command engine change.

### `.agents/`

Purpose: local skill catalog and helper agent definitions used by Codex/GSD workflows.
Refresh trigger: new local skill or agent package.

### `.planning/`

Purpose: canonical roadmap/state/phases plus codebase and audit artifacts.
Refresh trigger: milestone or planning-asset changes.

### `obsidian/`

Purpose: the living Obsidian mind vault, incoming docs, canon pages, and active synthesis notes.
Refresh trigger: new doctrine intake, canon page move, or PageIndex workflow change.

### `RESEARCH/`

Purpose: project research outputs and operator-facing intelligence artifacts.
Refresh trigger: new research family or relocation of research ownership.

## High-Churn Nested Directories

### `app/(markos)/crm/`, `app/(markos)/settings/`, `app/(markos)/operations/`

Main operator UI growth areas.

### `api/crm/`, `api/tenant/`, `api/mcp/`, `api/webhooks/`

Main hosted API growth areas.

### `lib/markos/billing/`, `crm/`, `mcp/`, `tenant/`, `webhooks/`

Main shared-domain growth areas.

### `onboarding/backend/agents/`, `extractors/`, `parsers/`, `prompts/`

Main onboarding runtime change areas.
