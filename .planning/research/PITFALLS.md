# Domain Pitfalls

**Domain:** AI-native marketing operating system
**Researched:** 2026-03-28

## Critical Pitfalls

### Pitfall 1: Brand Identity Split Between MarkOS and MARKOS Runtime Paths
**What goes wrong:** The product presents itself as MarkOS while runtime files, manifests, local directories, and Vector Store collection names still rely on MARKOS naming.
**Why it happens:** The package and README were rebranded before all internal paths and persistence conventions were migrated.
**Consequences:** Confusing operator experience, brittle migrations, and increased risk of broken updates during future rename work.
**Prevention:** Introduce an explicit compatibility layer and a phased migration plan rather than ad hoc renames.
**Detection:** Search for `markos`, `.markos-`, and `markos` across runtime code and docs before every identity-related release.

### Pitfall 2: Local Runtime and Hosted Runtime Drift
**What goes wrong:** Features work in `server.cjs` locally but behave differently through `api/*.js` wrappers or hosted filesystems.
**Why it happens:** The product supports both a local onboarding server and a serverless entrypoint model.
**Consequences:** Environment-specific failures in submit, approve, or file persistence flows.
**Prevention:** Keep shared logic in handlers, isolate environment checks, and add tests that explicitly exercise both surfaces.
**Detection:** Run onboarding flows in both local and hosted-like contexts before shipping runtime changes.

### Pitfall 3: Fuzzy Draft Merge Can Misplace Approved Content
**What goes wrong:** Approved content is merged into the wrong section or appended as fallback text when template headings drift.
**Why it happens:** `write-mir.cjs` uses header matching and fuzzy normalization rather than strict structural schemas.
**Consequences:** Silent content corruption in client-owned planning files.
**Prevention:** Add fixture-based merge tests for representative template variants and keep heading conventions stable.
**Detection:** Compare approved output files against expected fixtures after changes to templates or merge logic.

### Pitfall 4: Vector Persistence Assumptions Age Faster Than Product Messaging
**What goes wrong:** Vector Store host configuration, namespace rules, or client initialization behavior diverge from the product's docs and tests.
**Why it happens:** Vector infrastructure and SDKs evolve quickly, while local-first tools often pin assumptions for long periods.
**Consequences:** Noisy warnings, degraded portability, or migration surprises when customers move between local and cloud modes.
**Prevention:** Periodically validate Vector Store integration against current docs and add an explicit compatibility note in release planning.
**Detection:** Treat SDK warnings in tests as product signals, not harmless noise.

## Moderate Pitfalls

### Pitfall 1: Provider API Behavior Drift
**What goes wrong:** System and developer instruction semantics, models, or output handling differ across providers and change over time.
**Prevention:** Keep the provider adapter centralized and test stable return shapes rather than provider-specific payload details.

### Pitfall 2: Configuration Spread Across Files and Environment
**What goes wrong:** Effective runtime behavior depends on `.env`, `onboarding-config.json`, serverless environment variables, and persisted slug files.
**Prevention:** Keep config resolution centralized and document precedence clearly.

### Pitfall 3: Installation and Update Safety Can Regress Quietly
**What goes wrong:** File hash manifests, override protection, or conflict prompts stop behaving correctly after unrelated changes.
**Prevention:** Keep install/update tests mandatory for every release candidate.

## Minor Pitfalls

### Pitfall 1: Documentation Drifts Behind Runtime Reality
**What goes wrong:** Research and docs describe an earlier initiative instead of the shipped product.
**Prevention:** Treat `.planning/research` as living operational input and refresh it when the product shape changes materially.

### Pitfall 2: Log Noise Hides Real Problems
**What goes wrong:** Repeated deprecation or fallback logs become normal and mask actionable failures.
**Prevention:** Burn down known warnings and make fallback paths explicit in health reviews.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Identity normalization | Breaking existing installs during path migration | Ship compatibility reads before compatibility removals |
| Runtime hardening | Local and hosted behavior diverge | Test shared handlers in both execution modes |
| Onboarding quality | Merge logic damages client files | Add fixture-heavy write and approve tests |
| Memory and scale | Namespace or migration mistakes hide existing data | Document slug and collection rules before changing them |
| Telemetry and execution | Observability added without clear operator value | Instrument only decisions and failure points that change action |

## Sources

- bin/install.cjs
- bin/update.cjs
- onboarding/backend/server.cjs
- onboarding/backend/handlers.cjs
- onboarding/backend/write-mir.cjs
- onboarding/backend/vector-store-client.cjs
- test/onboarding-server.test.js
- test/update.test.js
- test/protocol.test.js
- https://upstash.com/docs/vector/overall/getstarted
- https://developers.openai.com/api/reference/resources/chat
- https://platform.claude.com/docs/en/api/messages
- https://ai.google.dev/gemini-api/docs/text-generation

