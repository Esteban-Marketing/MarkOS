---
phase: 200-saas-readiness-wave-0
plan: 07
type: execute
wave: 2
depends_on: [200-01]
files_modified:
  - .github/workflows/sdk-publish.yml
  - sdk/typescript/package.json
  - sdk/typescript/openapi-ts.config.ts
  - sdk/typescript/src/index.ts
  - sdk/python/pyproject.toml
  - sdk/python/markos/__init__.py
  - sdk/python/openapi-config.yaml
  - scripts/sdk/bump-semver.cjs
autonomous: true
must_haves:
  truths:
    - "sdk/typescript/ generates typed client via openapi-typescript + openapi-fetch from contracts/openapi.json"
    - "sdk/python/ generates client via openapi-python-client from contracts/openapi.json"
    - "Semver of each SDK tracks OpenAPI info.version"
    - ".github/workflows/sdk-publish.yml runs on change to contracts/openapi.json and publishes @markos/sdk (npm) + markos (pypi) on tag"
    - "Dry-run publish succeeds in CI without actually publishing"
    - "Smoke-install in blank Next.js repo compiles and types resolve"
  artifacts:
    - path: "sdk/typescript/package.json"
      provides: "@markos/sdk npm package"
    - path: "sdk/python/pyproject.toml"
      provides: "markos pypi package"
    - path: ".github/workflows/sdk-publish.yml"
      provides: "SDK auto-publish workflow"
---

<objective>
Auto-generate and publish typed SDKs (TypeScript + Python) from the merged OpenAPI doc so
customers never hand-write bindings. Version tracks OpenAPI info.version; CI publishes on
contract version bump.
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@contracts/openapi.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: TypeScript SDK scaffold</name>
  <files>sdk/typescript/package.json, sdk/typescript/openapi-ts.config.ts, sdk/typescript/src/index.ts</files>
  <action>
Scaffold @markos/sdk. openapi-ts.config.ts reads ../../contracts/openapi.json and emits
types + fetch client. src/index.ts re-exports a configured client factory.
  </action>
  <verify>cd sdk/typescript && npm run generate && tsc --noEmit succeeds</verify>
</task>

<task type="auto">
  <name>Task 2: Python SDK scaffold</name>
  <files>sdk/python/pyproject.toml, sdk/python/openapi-config.yaml, sdk/python/markos/__init__.py</files>
  <action>
Scaffold markos pypi package. Config points openapi-python-client at ../../contracts/openapi.json.
__init__.py re-exports the generated Client.
  </action>
  <verify>cd sdk/python && openapi-python-client generate --config openapi-config.yaml produces a working client; python -c "import markos" exits 0</verify>
</task>

<task type="auto">
  <name>Task 3: Semver bump + publish workflow</name>
  <files>scripts/sdk/bump-semver.cjs, .github/workflows/sdk-publish.yml</files>
  <action>
bump-semver.cjs reads contracts/openapi.json info.version and writes both
sdk/typescript/package.json and sdk/python/pyproject.toml. Workflow runs on push affecting
contracts/openapi.json, regenerates, bumps semver, runs npm publish --dry-run and
python -m build && twine upload --repository testpypi on PR; real publish on release tag.
  </action>
  <verify>act or local workflow run completes dry-run publish successfully</verify>
</task>

<task type="auto">
  <name>Task 4: Smoke install</name>
  <files>test/sdk/smoke.test.js</files>
  <action>
Test that npm pack of @markos/sdk installed into a tmp project importing Client builds clean.
  </action>
  <verify>node --test test/sdk/smoke.test.js passes</verify>
</task>

</tasks>

<success_criteria>
- [ ] TS + Python SDK generate from OpenAPI
- [ ] Semver tracks OpenAPI info.version
- [ ] Dry-run publish succeeds in CI
- [ ] Smoke install works
</success_criteria>
