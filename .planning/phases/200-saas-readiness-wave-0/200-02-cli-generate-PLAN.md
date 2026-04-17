---
phase: 200-saas-readiness-wave-0
plan: 02
type: execute
wave: 2
depends_on: [200-01]
files_modified:
  - bin/generate.cjs
  - bin/lib/brief-parser.cjs
  - test/cli-generate.test.js
  - package.json
autonomous: true
must_haves:
  truths:
    - "bin/generate.cjs runnable as markos generate <brief.yaml> and produces draft + audit to stdout"
    - "brief-parser.cjs accepts YAML and JSON briefs and validates required fields (channel, audience, pain, promise, brand)"
    - "CLI supports both --brief=<file> and inline flags --channel=/--audience=/--pain=/--promise=/--brand="
    - "Exit code non-zero when audit stage reports fail"
    - "package.json bin entry wires markos-generate or markos generate subcommand"
  artifacts:
    - path: "bin/generate.cjs"
      provides: "CLI entry for one-shot marketing generation"
      exports: ["run"]
    - path: "bin/lib/brief-parser.cjs"
      provides: "YAML/JSON brief validator and normalizer"
      exports: ["parseBrief", "validateBrief"]
    - path: "test/cli-generate.test.js"
      provides: "CLI smoke + audit-fail exit code test"
---

<objective>
Add a one-shot `markos generate` CLI that accepts a YAML/JSON brief or inline flags, wires
through the existing copilot grounding bundle + LLM adapter, and prints a draft + audit
report. Non-zero exit on audit fail so it composes in CI and scripts.

Reads merged OpenAPI (from 200-01) for any schema-validation of brief → internal request.
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@lib/markos/crm/copilot.ts
@lib/markos/llm/adapter.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Brief parser</name>
  <files>bin/lib/brief-parser.cjs</files>
  <action>
Implement parseBrief(pathOrString) that auto-detects YAML vs JSON, validates required fields
{channel, audience, pain, promise, brand}, returns normalized object. Export validateBrief
returning {ok, errors[]}.
  </action>
  <verify>unit test passes for yaml/json/invalid cases</verify>
</task>

<task type="auto">
  <name>Task 2: CLI entry</name>
  <files>bin/generate.cjs, package.json</files>
  <action>
Build bin/generate.cjs. Parse argv via minimist. Accept --brief=<file> or inline flags.
Call parseBrief, call buildCopilotGroundingBundle from lib/markos/crm/copilot.ts, pass to
LLM adapter, run audit, print draft + audit as JSON. Exit 1 if audit.status === 'fail'.
Wire package.json "bin" entry.
  </action>
  <verify>node bin/generate.cjs --brief=test/fixtures/brief.yaml prints draft; audit-fail fixture exits 1</verify>
</task>

<task type="auto">
  <name>Task 3: Test</name>
  <files>test/cli-generate.test.js, test/fixtures/brief.yaml, test/fixtures/brief-bad.yaml</files>
  <action>
Spawn CLI with good brief → assert stdout has draft + audit, exit 0. Spawn with bad brief → exit 1.
Use child_process.spawnSync.
  </action>
  <verify>node --test test/cli-generate.test.js passes</verify>
</task>

</tasks>

<success_criteria>
- [ ] markos generate works with YAML brief
- [ ] markos generate works with inline flags
- [ ] audit-fail exits non-zero
- [ ] test file green
</success_criteria>
