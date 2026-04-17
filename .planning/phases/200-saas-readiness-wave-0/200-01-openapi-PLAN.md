---
phase: 200-saas-readiness-wave-0
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/openapi/build-openapi.cjs
  - contracts/openapi.json
  - api/openapi.js
  - .github/workflows/openapi-ci.yml
  - package.json
autonomous: true
must_haves:
  truths:
    - "scripts/openapi/build-openapi.cjs walks contracts/F-*.yaml and emits merged OpenAPI 3.1 doc"
    - "contracts/openapi.json is committed and openapi.yaml artifact produced by build script"
    - "api/openapi.js serves merged doc as JSON and YAML via appropriate content negotiation"
    - "npm run openapi:build succeeds exit 0 and regenerates contracts/openapi.json deterministically"
    - "All 39 F-NN flow contracts present under paths or components in merged doc"
    - ".github/workflows/openapi-ci.yml runs Spectral lint on PRs touching contracts/ or scripts/openapi/"
  artifacts:
    - path: "scripts/openapi/build-openapi.cjs"
      provides: "OpenAPI merge build script"
      exports: ["buildOpenApiDoc"]
    - path: "contracts/openapi.json"
      provides: "Committed merged OpenAPI 3.1 document"
    - path: "api/openapi.js"
      provides: "Public HTTP endpoint serving merged OpenAPI doc (JSON + YAML)"
    - path: ".github/workflows/openapi-ci.yml"
      provides: "Spectral lint CI workflow"
---

<objective>
Ship a public, versioned OpenAPI 3.1 document that merges all `contracts/F-*.yaml` flows into
one canonical doc, served at `api/openapi.(json|yaml)` and validated by Spectral in CI.

This unlocks plans 200-02 (CLI reads OpenAPI), 200-06 (MCP references schemas), and 200-07
(SDK auto-gen from this doc). Without it the rest of the wave is blocked.
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@.planning/phases/200-saas-readiness-wave-0/DISCUSS.md
@.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md
@contracts/
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build OpenAPI merge script</name>
  <files>scripts/openapi/build-openapi.cjs, package.json</files>
  <action>
Create scripts/openapi/build-openapi.cjs that reads every contracts/F-*.yaml, extracts
paths/components/tags, merges into a single OpenAPI 3.1 document, and writes
contracts/openapi.json + contracts/openapi.yaml. Add package.json script "openapi:build".
Use js-yaml for parsing, preserve all 39 F-NN entries.
  </action>
  <verify>npm run openapi:build then jq .info.version contracts/openapi.json returns version; jq '.paths | length' > 0</verify>
</task>

<task type="auto">
  <name>Task 2: Serve merged doc from api/openapi.js</name>
  <files>api/openapi.js</files>
  <action>
Add Vercel Function endpoint at api/openapi.js that serves contracts/openapi.json as JSON by
default, and YAML when Accept header is application/yaml or ?format=yaml is present. Cache
headers: public, max-age=300.
  </action>
  <verify>node api/openapi.js served via Fluid Compute returns 200 with correct content-type for both formats</verify>
</task>

<task type="auto">
  <name>Task 3: Add Spectral CI workflow</name>
  <files>.github/workflows/openapi-ci.yml, .spectral.yaml</files>
  <action>
Create .github/workflows/openapi-ci.yml that runs on PRs touching contracts/** or scripts/openapi/**.
Steps: checkout, setup-node, npm ci, npm run openapi:build, npx @stoplight/spectral-cli lint
contracts/openapi.json --ruleset .spectral.yaml. Fail on error-severity issues.
  </action>
  <verify>act or local spectral lint on contracts/openapi.json returns exit 0</verify>
</task>

<task type="auto">
  <name>Task 4: Smoke test</name>
  <files>test/openapi/openapi-build.test.js</files>
  <action>
Add node:test file asserting buildOpenApiDoc() returns a valid 3.1 shape, contains all F-NN
flow IDs found in contracts/, and openapi.json differs only in whitespace across re-runs
(determinism).
  </action>
  <verify>node --test test/openapi/openapi-build.test.js passes</verify>
</task>

</tasks>

<success_criteria>
- [ ] contracts/openapi.json committed with all 39 F-NN flows
- [ ] api/openapi.js serves both JSON and YAML
- [ ] Spectral CI workflow green on build
- [ ] npm run openapi:build is deterministic
- [ ] Smoke test passes
</success_criteria>
