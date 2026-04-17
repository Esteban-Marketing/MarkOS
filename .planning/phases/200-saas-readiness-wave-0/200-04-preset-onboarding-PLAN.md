---
phase: 200-saas-readiness-wave-0
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/install.cjs
  - bin/lib/presets/b2b-saas.json
  - bin/lib/presets/dtc.json
  - bin/lib/presets/agency.json
  - bin/lib/presets/local-services.json
  - bin/lib/presets/solopreneur.json
  - .agent/markos/templates/presets/b2b-saas.json
  - .agent/markos/templates/presets/dtc.json
  - .agent/markos/templates/presets/agency.json
  - .agent/markos/templates/presets/local-services.json
  - .agent/markos/templates/presets/solopreneur.json
  - test/onboarding-preset.test.js
autonomous: true
must_haves:
  truths:
    - "bin/install.cjs accepts --preset=<bucket> where bucket in {b2b-saas, dtc, agency, local-services, solopreneur}"
    - "Each preset JSON contains seed MIR, MSP, brand-pack placeholders, recommended literacy nodes"
    - ".agent/markos/templates/presets/ mirrors the bin/lib/presets/ files exactly"
    - "Without --preset, falls back to existing guided-interview flow unchanged"
    - "test/onboarding-preset.test.js asserts TTFD < 90s for at least one preset bucket"
    - "npx markos init --preset=b2b-saas produces a running instance seeded with preset data"
  artifacts:
    - path: "bin/install.cjs"
      provides: "Installer with --preset flag"
---

<objective>
Cut first-session friction from guided-interview to <90s by shipping 5 curated preset
buckets. `npx markos init --preset=<bucket>` loads seed MIR/MSP/brand-pack + literacy
recommendations so a user is drafting within a minute and a half.
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@bin/install.cjs
@onboarding/onboarding-config.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Preset JSONs</name>
  <files>bin/lib/presets/*.json, .agent/markos/templates/presets/*.json</files>
  <action>
Author 5 presets. Each contains:
  - mir_seed: pain points, audience archetypes, success criteria
  - msp_seed: 3-5 motion templates
  - brand_pack_placeholder: tone/voice defaults
  - literacy_nodes: recommended Shared + vertical overlay slugs
Mirror identical content into .agent/markos/templates/presets/.
  </action>
  <verify>jq . on every preset passes; schemas align</verify>
</task>

<task type="auto">
  <name>Task 2: Wire installer flag</name>
  <files>bin/install.cjs</files>
  <action>
Add --preset parser. When set, skip interactive questions, load preset JSON, call existing
seed pipeline (onboarding/backend/handlers.cjs seed path) with preset data. When absent,
keep current guided interview unchanged.
  </action>
  <verify>npx markos init --preset=b2b-saas completes non-interactively and seeds data</verify>
</task>

<task type="auto">
  <name>Task 3: TTFD test</name>
  <files>test/onboarding-preset.test.js</files>
  <action>
Test spawns installer with --preset=solopreneur against a temp data dir, measures wall time
from start to first draft artifact on disk, asserts < 90s. Run as node:test.
  </action>
  <verify>node --test test/onboarding-preset.test.js passes</verify>
</task>

</tasks>

<success_criteria>
- [ ] 5 preset files in both mirror locations
- [ ] Installer honors --preset
- [ ] TTFD under 90s verified
- [ ] Fallback to guided interview untouched
</success_criteria>
