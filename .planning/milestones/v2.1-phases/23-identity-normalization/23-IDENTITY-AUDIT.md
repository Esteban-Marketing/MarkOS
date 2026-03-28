# Phase 23 Identity Audit

## Classification Rules

- `canonical-public`: should present as MarkOS now
- `compatibility-critical`: legacy MGSD-era surface that must keep working in v2.1
- `historical-only`: kept only for milestone history or lineage
- `future-migration-target`: intentionally deferred to later rename or namespace phases

## Inventory

| Surface Type | Examples | Classification | Phase 23 Action |
|--------------|----------|----------------|-----------------|
| Public package identity | `package.json` name/description, README install commands, CHANGELOG header | `canonical-public` | Keep MarkOS-first |
| Installer and updater UX | `bin/install.cjs`, `bin/update.cjs` banners and prompts | `canonical-public` with compatibility notes | Keep MarkOS-first, label legacy files as compatibility surfaces |
| Onboarding UI copy | `onboarding/index.html`, `onboarding/onboarding.js` titles and completion messaging | `canonical-public` | Convert to MarkOS-first |
| Browser storage keys | `mgsd-onboarding-draft`, `mgsd_privacy_dismissed` | `compatibility-critical` | Write canonical `markos_*` keys, read legacy fallback |
| Local state paths | `.mgsd-local/`, `.mgsd-project.json`, `.mgsd-install-manifest.json` | `compatibility-critical` | Keep paths, document contract |
| Protocol engine path | `.agent/marketing-get-shit-done/`, `MGSD-INDEX.md`, `mgsd-*` agent IDs | `compatibility-critical` | Keep for now, document as legacy protocol layout |
| Telemetry opt-in | `MGSD_TELEMETRY` | `compatibility-critical` | Support `MARKOS_TELEMETRY` first, fallback to legacy env var |
| Chroma namespaces | `mgsd-{slug}-{section}`, `mgsd-{slug}-drafts`, `mgsd-{slug}-meta` | `compatibility-critical` | Keep prefix, codify as legacy namespace contract |
| Protocol-lore references to MGSD as product name | purpose text and architecture descriptions | `canonical-public` where operator-facing, otherwise `historical-only` | Update key docs to distinguish product identity from protocol lineage |
| Full repo rename work | `.agent/markos/`, `.markos-local/`, `MARKOS-*` token registry, `markos-*` namespaces | `future-migration-target` | Defer to later migration phases |

## Immediate Phase 23 Targets

- README, CHANGELOG, installer/update messaging, onboarding title and completion copy
- Telemetry env-var contract and browser storage key compatibility logic
- Key operator docs: `.protocol-lore/CONVENTIONS.md` and `.protocol-lore/ARCHITECTURE.md`
- Guardrails in `test/protocol.test.js`

## Deferred Migration Targets

- Rename `.agent/marketing-get-shit-done/` to `.agent/markos/`
- Rename `.mgsd-local/`, `.mgsd-project.json`, and `.mgsd-install-manifest.json`
- Migrate `mgsd-*` Chroma collection names to a canonical MarkOS-aware prefix
- Rename `mgsd-*` agent IDs, workflow commands, and `MGSD-*` token registry entries

## Outcome

Phase 23 treats MarkOS as the authoritative product identity now, while every remaining MGSD-era identifier is either explicitly compatibility-critical, historical-only, or deliberately deferred.