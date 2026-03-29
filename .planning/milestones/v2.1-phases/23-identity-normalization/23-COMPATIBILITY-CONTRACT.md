# Phase 23 Compatibility Contract

## Canonical Identity

- Product name: `MarkOS`
- Primary install/update command: `npx markos install`, `npx markos update`
- Canonical telemetry toggle: `MARKOS_TELEMETRY`
- Canonical browser storage keys: `markos-onboarding-draft`, `markos_privacy_dismissed`

## Compatibility-Only Surfaces

| Surface | Current Behavior | Contract |
|---------|------------------|----------|
| `.agent/markos/` | Runtime protocol root | Supported until the protocol directory migration phase; not the public product name |
| `MARKOS-INDEX.md` | Token registry file on the legacy protocol path | Supported until token registry migration |
| `.markos-local/` | Local approved-state workspace | Canonical persisted client-data path during v2.1; future migration target |
| `.markos-project.json` | Project slug source of truth | Canonical persisted slug file during v2.1; future migration target |
| `.markos-install-manifest.json` | Installer/update manifest | Canonical installer manifest during v2.1; future migration target |
| `MARKOS_TELEMETRY` | Legacy telemetry env var | Read-compatible fallback to `MARKOS_TELEMETRY` |
| `markos-*` browser keys | Older onboarding draft and privacy keys | Read-compatible fallback only |
| `markos-*` Vector Store namespaces | Existing draft, meta, and section collections | Canonical write/read namespace during v2.1 until a dedicated migration phase |
| `markos` CLI alias | Legacy command entrypoint | Keep as backward-compatible alias for one major version |
| `markos-*` protocol agent IDs | Internal protocol naming | Preserve until repo-wide protocol rename work is explicitly scheduled |

## Historical-Only References

- Milestone history describing the original MARKOS protocol
- Existing roadmap phases 17â€“22 that document the deferred rename-only program
- Archived or versioned notes that explain how MarkOS emerged from the MARKOS lineage

## Rules for Future Changes

1. Public UX, install text, onboarding copy, and primary docs must say MarkOS unless they are explicitly documenting compatibility behavior.
2. Compatibility-only identifiers must stay behind labeled fallbacks or clearly named legacy paths.
3. No destructive rename or namespace rewrite should happen without a dedicated migration phase and explicit data-preservation plan.
4. When a compatibility surface becomes safely migratable, tighten tests first, then change the runtime path or namespace.

## Follow-On Phases

- Phase 24 consumes this contract for runtime/path behavior.
- Phase 26 consumes this contract for Vector Store namespace handling.
- The older rename-focused phases remain the place for destructive directory and token migrations.
