---
gsd_state_version: 1.0
milestone: v4.0.0
milestone_name: SaaS Readiness 1.0
status: Ready to execute
last_updated: "2026-04-29T17:18:48.771Z"
progress:
  total_phases: 17
  completed_phases: 5
  total_plans: 132
  completed_plans: 53
  percent: 40
---

> v4.0.0 "SaaS Readiness 1.0" initialized 2026-04-16 after v3.9.0 closeout and archive.

## Current Position

Phase: 201.1 (saas-tenancy-followups) — EXECUTING
Plan: 4 of 11
Next: `/gsd-verify-work 213.2` to verify Phase 213.2 against UI-SPEC ACs, then `/gsd-discuss-phase 213.3` for the next decimal phase (settings surfaces — Files / Billing / Members / Sessions / Domain / Danger / MCP / Plugins / Webhooks).

## Phase 213.4 Plan Progress

- [x] 213.4-01: polish — Phase 213.3 ui-review F-1/F-2/F-3 fixes (webhooks/[sub_id] filter chip + expand chevron text use --color-primary-text; webhooks .successMeterTrack height 8px parity; members prefers-reduced-motion block parity). Closes UI-SPEC AC P-1..P-4. (2026-04-29)
- [x] 213.4-02: admin/billing surface to DESIGN.md tokens — page.module.css rewritten + page.tsx primitive composition (.c-card + .c-button{,--primary,--secondary,--destructive} + .c-modal write-off + .c-notice c-notice--{state} variant-driven + .c-badge--{warning,info,success} row state) + reconciliation.stories.tsx (Healthy/HoldState/SyncFailure). Closes UI-SPEC AC AB-1..AB-8. (2026-04-29)
- [x] 213.4-03: admin/governance surface to DESIGN.md tokens — page.module.css rewritten (teal border-left stripe eliminated) + page.tsx primitive composition (.c-card + .c-button{,--primary,--destructive} + .c-modal Reject + .c-notice c-notice--{error,success} + .c-badge--{error,success,info} decision column + 4 semantic tables) + governance.stories.tsx (Default/DeniedMapping/ExportReady). Closes UI-SPEC AC AG-1..AG-6. (2026-04-29)
- [x] 213.4-04: operations (root) to DESIGN.md tokens — page.module.css rewritten (dual radial+linear gradients + drop shadow + hover-jiggle eliminated) + page.tsx primitive composition (.c-card + .c-button c-button--primary anchor + .c-notice c-notice--error denied + .c-badge--{success,error} + .c-status-dot--{live,error} dual-signal + .t-label-caps) + operations.stories.tsx (Authorized/Denied). Closes UI-SPEC AC O-1..O-8. (2026-04-29)
- [x] 213.4-05: operations/tasks composite to DESIGN.md tokens (LARGEST surface — 525+1384 LOC) — task-ui.module.css rewritten + page.tsx Tailwind hex eliminated + 5 sub-components className-only update (approval-gate/evidence-panel/step-runner/task-graph/task-store; D-15+D-21 server/client boundaries preserved) + tasks.stories.tsx (QueuedTask/ExecutingTask/CompletedTask/FailedTask/ApprovalRequired). Closes UI-SPEC AC OT-1..OT-12. (2026-04-29)
- [x] 213.4-06: status/webhooks (public Phase 203 substrate) to DESIGN.md tokens — page.module.css rewritten (!important wildcard removed) + page.tsx primitive composition (.c-card + .c-notice c-notice--{success,warning,error} className-driven + .c-status-dot--{live,*,error}; Phase 203 wiring + classifyStatus + statusCopy register PRESERVED VERBATIM per D-20) + NEW page.stories.tsx (Operational/Retrying/Elevated). Closes UI-SPEC AC SW-1..SW-7. (2026-04-29)
- [x] 213.4-07: 404-workspace error hero to DESIGN.md tokens — page.module.css rewritten (gradient eliminated) + page.tsx primitive composition (.c-card--feature hero exception per D-13 + .c-button{,--primary,--tertiary} + .t-label-caps; notFound/force-dynamic/searchParams PRESERVED per D-23) + NEW page.stories.tsx (Available/Reserved). Closes UI-SPEC AC F-1..F-7. (2026-04-29)
- [x] 213.4-08: settings/theme + cross-cutting closure — theme.stories.tsx extended (ColorTokens/SpacingTokens/PrimitiveSampler design diagnostic) + NEW test/ui-a11y/213-4-admin-ops-a11y.test.js (44 tests / 11 AC# mentions) + X-4 deviation fix (task-graph.tsx "unlock" -> "enable") + (pointer: coarse) inheritance verified across 6 new modules + final wave green (142 ui-a11y tests pass + storybook build clean). Closes UI-SPEC AC T-1..T-7 + X-1..X-6. **Wave 1 CLOSED. 213.x milestone wave (213.1+213.2+213.3+213.4) CLOSED — full markos chrome surface in DESIGN.md v1.1.0 canon.** (2026-04-29)

## Phase 213.3 Plan Progress

- [x] 213.3-01: billing surface to DESIGN.md tokens — page.module.css rewritten + page.tsx primitive composition + page.stories.tsx (CSF3 named state stories). Closes UI-SPEC AC B-1..B-N + X-4 (billing slice). (2026-04-29)
- [x] 213.3-02: members surface to DESIGN.md tokens — page.module.css rewritten (210→133 LOC, zero hex) + .meterFill seat bar + .c-notice c-notice--info + .c-modal remove-confirm + MembersPageView extraction + page.stories.tsx (CSF3 5 named state stories: Default/Filled/InvitePending/RoleEdit/Empty). Closes UI-SPEC AC M-1..M-5 + X-4 (members slice). (2026-04-29)
- [x] 213.3-03: sessions surface to DESIGN.md tokens — page.module.css rewritten (133→78 LOC, zero hex) + .c-status-dot--live + [ok] Active now current-session indicator + .c-badge--success [ok] Current badge + .c-modal + .c-backdrop revoke-confirm dialogs (per-session + revoke-all) + SessionsPageView extraction + page.stories.tsx (CSF3 4 named state stories: Default/RevokeConfirm/SingleSession/Empty). sessions-api.test.js stale CSS-lock + copy assertions updated to token-canon (Rule 1). Closes UI-SPEC AC S-1..S-4 + X-4 (sessions slice). (2026-04-29)
- [x] 213.3-04: domain surface to DESIGN.md tokens — page.module.css rewritten (22→54 LOC GROWS, zero hex — highest hex-density surface in wave: 19 hex/22 LOC eliminated) + 4 .c-notice DNS state compositions (success/info/warning/error) + .c-status-dot--live/default/--error modifiers + bracketed-glyph pairing + .c-code-block inside .c-terminal CNAME display + .c-button--destructive Remove domain + .c-button--tertiary Resolve now + DomainPageView extraction + page.stories.tsx (CSF3 5 named state stories: Default/Pending/Verified/RotationGrace/Failed). Closes UI-SPEC AC D-1..D-5 + X-4 (domain slice). (2026-04-29)
- [x] 213.3-06: MCP surface to DESIGN.md tokens — page.module.css rewritten (503→216 LOC, all 61 hex eliminated — largest CSS file in wave) + 3 .c-notice cost-state variants (c-notice--error >=100%, c-notice--warning >=70%, c-notice--info key-rotation) + .c-chip-protocol for tool names/client_id/key prefix + .c-code-inline masked API key [mk_xxx_•1234] + .c-button--icon clipboard SVG + .c-status-dot--live (connected) / .c-status-dot--error (expired session) + bracketed-glyph [ok]/[err] pairing + meterFillClass() state-aware helper + MCPPageView named presentational export (D-15) + page.stories.tsx (CSF3 5 named state stories: Default/KeyRotation/CostMeterWarning/ToolList/Empty) + mcp-settings-ui-a11y.test.js 6 legacy hex assertions patched to token-canon (RESEARCH Pitfall 7). Phase 200+200.1 wiring preserved (4 API routes). Closes UI-SPEC AC MC-1..MC-7 + X-4 (mcp slice). (2026-04-29)
- [x] 213.3-07: plugins surface to DESIGN.md tokens — page-shell.module.css rewritten (329→190 LOC, zero hex, **CRITICAL: linear-gradient(135deg,#0f766e,#155e75) on .brandCard ELIMINATED** — only gradient in entire wave, replaced with flat var(--color-surface-raised) + var(--color-border)) + .c-card c-card--interactive capability rows + .c-chip c-chip--mint [ok] Installed + .c-badge c-badge--warning [warn] Disabled + .c-badge c-badge--info [info] Update available + .c-chip-protocol plugin:slug + .c-button c-button--primary Save + .c-button c-button--destructive Disable + .c-notice c-notice--warning compatibility gate + page.stories.tsx (CSF3 5 named state stories: Default/Installed/Disabled/Updated/Marketplace). Closes UI-SPEC AC P-1..P-5 + X-3 (gradient elimination). (2026-04-29)

## Phase 213.2 Plan Progress

- [x] 213.2-01: /login surface to DESIGN.md tokens — page.module.css rewritten (12→25 LOC, zero hex, only 2px text-underline-offset whitelist) + page.tsx removed `--accent` BYOD inline-style + dead `primary` variable (UI-SPEC L-4 single-mint-signal rule) + new `_components/LoginCard.tsx` `'use client'` subcomponent composes 6 primitives (.c-card--feature, .c-input, .c-field, .c-field__label, .c-field__help, .c-button--primary) preserving `<form method="POST" action="/api/auth/signup">` Phase 200/204 contract + new `_components/LoginCard.stories.tsx` (CSF3 4 named state stories: Default / Filled / Branded / ErrorState) registered as `Auth/LoginCard` in storybook-static/index.json. RESEARCH.md R-2 mitigation: server-component page.tsx + presentational client subcomponent extraction pattern. 61/61 test/auth tests + 34/34 Phase 213.1 a11y suites preserved. Closes UI-SPEC AC#L-1, L-2, L-3, L-4, L-5, X-2 (login slice), X-3 (login slice), X-4 (login slice). (2026-04-28)
- [x] 213.2-02: /signup surface to DESIGN.md tokens — page.module.css rewritten (186→64 LOC, zero hex, only 4px success-border + 2px text-underline-offset whitelist) + page.tsx composition updates with `[ok] Check your inbox.` success copy + 2× `[warn]` glyphs (BotBlocked / RateLimited) + aria-invalid migration + .spinner deletion (.c-button.is-loading::after primitive composes spinner) + new page.stories.tsx (CSF3 7 named state stories: Default / Filled / Loading / Sent / BotBlocked / RateLimited / Error) registered as `Auth/SignupPage` + test/auth/signup.test.js lines 144-155 token-citation block migrated; lines 128-142 wiring assertions preserved. Closes UI-SPEC AC S-1, S-2, S-3, S-4, S-5, S-6, X-2/X-3/X-4 (signup slice). (2026-04-28)
- [x] 213.2-03: /invite/[token] surface to DESIGN.md tokens — page.module.css rewritten (73→43 LOC, zero hex, only 4px error-border whitelist; consumes var(--color-surface), var(--color-error), var(--space-xl/md/sm/xs), var(--w-modal); 12% alpha-tint rgb(248 81 73 / 0.12) on errorMessage per DESIGN.md badge canon) + page.tsx composes .c-card c-card--feature + .c-button c-button--primary + .t-lead utility, reasonCopy() all 7 reason-code keys preserved (server contract per CONTEXT D-19) with [err] glyph prefix on every return (Invite expired / Email mismatch / Invite withdrawn / Invite already accepted / Invite not found / Seat limit reached / Accept failed), success CTA prepends [ok] (`[ok] Accepted. Redirecting…`), subheading drops "You'll" softener, aria-busy 'true'/'false' string ARIA-spec compliance (Rule 1 deviation), buttonLabel hoisted out of nested ternary (Rule 1 lint clean), preserves 'use client' + /api/tenant/invites/accept POST + window.location.href redirect verbatim (Phase 201/202 wiring) + new page.stories.tsx (NEW; CSF3 10 named state stories: Default / Accepting / Success / Error / ErrorEmailMismatch / ErrorWithdrawn / ErrorAlreadyAccepted / ErrorNotFound / ErrorSeatQuota / ErrorAcceptFailed — exceeds X-4 minimum of 4 by 250%) registered as `Auth/InviteAcceptPage` in storybook-static/index.json (10 stories × 2 entries = 20 lookups). 10/10 test/tenancy/invites + 61/61 test/auth + 22/22 213-1-chrome-a11y preserved; pre-existing test/tenant-auth/ui-authorization-negative-path.test.js failure (asserts on app/(markos)/layout.tsx, NOT invite) verified pre-existing via git stash + retest, logged to deferred-items.md per scope-boundary rule. Closes UI-SPEC AC I-1, I-2, I-3, I-4, I-5, X-1 (invite slice), X-2 (invite slice), X-3 (invite slice), X-4 (invite slice). (2026-04-28)
- [x] 213.2-04: /oauth/consent surface to DESIGN.md tokens — page.module.css rewritten + page.tsx composition updates + new `_components/ConsentCard.tsx` `'use client'` subcomponent composing 7 primitives (.c-card--feature, .c-button--primary, .c-button--destructive, .c-chip-protocol, .c-code-inline, .c-field__help, .t-lead) + new `ConsentCard.stories.tsx` (CSF3 9 named state stories: Default / MultiScope / MultiTenant / Loading / Approving / Declined / InvalidExpired / InvalidMissingFields / InvalidRedirectUri) + 4 [err] invalidReason strings on page.tsx (Consent request missing / Consent request expired / Approval failed / Invalid redirect_uri). RESEARCH.md R-4 mitigation: server-component page.tsx + presentational client subcomponent. test/mcp/consent-ui-a11y.test.js preserved. Closes UI-SPEC AC O-1, O-2, O-3, O-4, O-5, X-2 (consent slice), X-3 (consent slice), X-4 (consent slice). (2026-04-28)
- [x] 213.2-05: cross-cutting closure — styles/components.css `(pointer: coarse)` block extended in-place to scope BOTH `.c-button { min-height: var(--h-control-touch); }` (Phase 213.2 extension; RESEARCH.md R-3 mitigation) AND `.c-nav-link { padding-block: 11px; }` (Phase 213.1 carry-forward) — single block, no redeclaration anywhere else (verified across 4 auth modules + layout-shell + RotationGraceBanner + globals.css = 7 candidate files all return 0) + new `test/ui-a11y/213-2-auth-a11y.test.js` (268 LOC; 25 individual `test(...)` blocks; 21 AC#3/9/11/12/13/15 mentions; mirrors Phase 213.1 canonical pattern: 5-line `node:test` opener + `read()` helper + AC# section comments) covering 4 X-4 file-existence + 4 AC#3 primitive composition + 3 AC#9 bracketed-glyph + 1 AC#11/X-1 multi-file + 1 AC#12/X-2 multi-file + 1 AC#13/X-3 multi-file + 3 AC#15 dual-rule + non-redeclaration + 4 X-4 named-state-export + 3 token-consumption + 1 banned-lexicon. 25/25 new tests pass; 22/22 213-1-chrome + 12/12 213-1-light-and-forced-colors + 61/61 auth + 10/10 tenancy/invites + mcp/consent-ui-a11y all green. Storybook build 12.05s clean. 2 pre-existing failures (test/onboarding-server.test.js MODULE_NOT_FOUND + carry-forward of test/tenant-auth/ui-authorization-negative-path.test.js) verified via git stash + logged to deferred-items.md per Rule 5 scope boundary. Closes UI-SPEC AC X-1, X-2, X-3, X-4, X-5 (cross-cutting). **Wave 2 CLOSED.** (2026-04-28)

## Phase 213.1 Plan Progress

- [x] 213.1-01: layout-shell.module.css token rewrite (187→106 LOC) + NavList.tsx client subcomponent + layout-shell.tsx + layout.stories.tsx primitive composition; pre-existing postcss.config.mjs JSDoc terminator bug fixed (Rule 3 deviation) so storybook build is clean. Closes UI-SPEC AC#1, AC#2, AC#3, AC#5, AC#7, AC#8, AC#9, AC#11, AC#12, AC#13, AC#14. (2026-04-28)
- [x] 213.1-02: RotationGraceBanner.module.css token rewrite (109→75 LOC; zero hex; rgb(255 184 0 / 0.12) warn + rgb(248 81 73 / 0.12) T-0 err alpha-tints; .pulseDot→.warningDot rename composing global .c-status-dot primitive; deleted local :focus-visible + prefers-reduced-motion overrides) + RotationGraceBanner.tsx 3× [warn] + 1× [err] bracketed-glyph state coding on <strong> per DESIGN.md "Color blindness" rule + test/webhooks/ui-s4-a11y.test.js rewritten 17/17 pass (per RESEARCH.md correction; layout-shell-banner.test.js stays UNTOUCHED 7/7). Closes UI-SPEC AC#1, AC#2, AC#3, AC#5, AC#6, AC#9, AC#10, AC#10b, AC#11, AC#12, AC#13. (2026-04-28)
- [x] 213.1-03: RotationGraceBanner.stories.tsx (Storybook 8 CSF3, 5 named state stories: Empty / T7Warning / T1Warning / T0Error / MultiWarning) + test/ui-a11y/213-1-chrome-a11y.test.js (22 tests / 22 pass — grep-shape AC#3/8/9/11/12/13/15 + Storybook preview wiring + token consumption + 5 banner story exports) + styles/components.css `@media (pointer: coarse) { .c-nav-link { padding-block: 11px } }` (>=44px touch target on coarse pointers, rule on global primitive so all .c-nav-link consumers inherit) + .storybook/preview.tsx 3-edit surgery (`import "../app/globals.css"` cascade root + ThemeProvider gated behind `parameters.theme === "legacy" | "white-label"` opt-in — RESEARCH.md R2 mitigation). Closes UI-SPEC AC#3, AC#4, AC#9, AC#11, AC#12, AC#13, AC#15. Wave 1 closed. (2026-04-28)

## Phase 204 Plan Progress

- [x] 204-01: CLI dispatch foundation + shared primitives + 2 migrations + test fixtures (2026-04-23)
- [x] 204-02: OAuth device flow — 3 endpoints + F-101 contract + `markos login` command + 31 tests (2026-04-23)
- [x] 204-03: markos keys CRUD — 4 library primitives + 3 endpoints + F-102 + CLI + 31 tests (2026-04-23)
- [x] 204-04: markos whoami — resolveWhoami library + /api/tenant/whoami endpoint + F-105 scaffold + CLI + 17 tests (2026-04-23)
- [x] 204-05: markos init + plan + eval — delegator CLI + dry-run endpoint + local rubric + F-103 + 29 tests (2026-04-23)
- [x] 204-06: markos run + SSE watch — migration 75 + runs lib (5 primitives) + 3 endpoints + CLI + F-103 merged (4 paths) + 40 tests (2026-04-24)
- [x] 204-07: markos env (list/pull/push/delete) — migration 76 (pgcrypto) + env lib (6 exports) + 4 endpoints + CLI + F-104 (4 paths) + 35 tests — **Wave 2 CLOSED** (2026-04-24)
- [x] 204-08: markos status — aggregateStatus library + TS twin + /api/tenant/status + status.cjs CLI with --watch + status run <id> + F-105 completion (5 schemas) + 19 tests — **Wave 3 LEAD** (2026-04-24)
- [x] 204-09: markos doctor — 9-check doctor-checks library + CLI with --check-only CI gate + --fix auto-remediation + applyGitignoreProtections export + 22 tests — **Wave 3 CLOSED; 11/11 CLI commands functional** (2026-04-24)
- [x] 204-10: distribution (Homebrew) — Formula/markos.rb + scripts/distribution/bump-homebrew-formula.cjs + shape test + installation-homebrew.md (2026-04-24)
- [x] 204-11: distribution (Scoop) — bucket/markos.json + scripts/distribution/bump-scoop-manifest.cjs + shape test + installation-scoop.md (2026-04-24)
- [x] 204-12: release CI + docs trio + llms.txt Phase 204 — .github/workflows/release-cli.yml (5-job DAG verify→npm→brew+scoop→smoke) + docs/cli/{errors,environment,commands}.md + public/llms.txt Phase 204 section + errors-map parity test + 15 tests — **Wave 4 CLOSED; Phase 204 SHIPS** (2026-04-24)
- [x] 204-13: v2 compliance guardrails — migration 77 additive (15 v2 columns + back-fill + 3 indexes) + lib/markos/cli/runs.cjs v2-shaped payload writer (buildV2Payload, V2_REQUIRED_FIELDS, deriveIdempotencyKey, STATE_V1_TO_V2_MAP, PRICING_PLACEHOLDER_SENTINEL) + markos status recent_runs v2 projection + markos doctor +3 checks (agentrun_v2_alignment, pricing_placeholder_policy, vault_freshness → 12 total) + F-103 + openapi regen + v2-compliance.test.js (14 tests) — **Phase 204 GA ready for verification** (2026-04-23)

## Planning overlay (2026-04-23 incoming 18-26 commercial-engine routing)

Incoming documents `18` through `26` introduce a larger commercial-system expansion than the existing SaaS Growth Strategy bundle:

- native CRM engine
- native email engine
- CDP identity and audience substrate
- messaging engine for WhatsApp, SMS, and push
- native analytics and attribution layer
- native conversion and launch engines
- sales enablement and deal-execution layer
- ecosystem, partner, affiliate, community, and developer-growth layer

Decision: do not overload Phases 214-220 with these engines. Reserve a new milestone candidate, `v4.2.0 Commercial Engines 1.0`, and seed Phases 221-228 for later GSD discuss and research.

New routing artifact:

- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`

Seeded future phases:

- Phase 221 - CDP identity, audience, and consent substrate
- Phase 222 - CRM timeline and commercial memory workspace
- Phase 223 - Native email and messaging orchestration
- Phase 224 - Conversion and launch workspace
- Phase 225 - Analytics, attribution, and narrative intelligence
- Phase 226 - Sales enablement and deal execution
- Phase 227 - Ecosystem, partner, community, and developer growth
- Phase 228 - Commercial OS integration and future-readiness closure

Preparation status:

- `DISCUSS.md`, `CONTEXT.md`, and `RESEARCH.md` now exist for Phases 221-228.
- `.planning/REQUIREMENTS.md` now carries future requirement families for docs 18-26.
- `.planning/ROADMAP.md` and `.planning/V4.0.0-GSD-PHASE-RESEARCH-READINESS-MATRIX.md` now expose the new lane as a discuss/context/research-ready future bundle.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md` summarizes the code-grounded discuss/research pass.

Guardrail: the execution order does not change. The recommended path remains 204 -> 205 -> 206 -> 207 -> 213 -> 214 -> 220 first. The new commercial-engine lane is prepared now so later GSD discuss/research can move faster and with less ambiguity.

## Planning overlay (2026-04-23 testing environment and phase test matrix)

A cross-phase testing doctrine has now been added for the active and reserved phase set so execution agents inherit explicit business-logic testing duties instead of informal QA expectations.

New artifacts:

- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`

Result:

- `Vitest` is now the planned default for new deterministic business-logic and contract coverage.
- `Playwright` is now the planned default for route and workflow proof.
- `Chromatic` remains the visual regression gate through Storybook.
- Phases 204-228 now have a documented testing contract at planning level.

## Planning overlay (2026-04-23 incoming/vault/GSD coverage verification)

The incoming documents `00` through `17`, vault canon pages, `.planning/REQUIREMENTS.md`, roadmap entries, and phase directories were re-checked at GSD planning level.

Coverage result:

- Active v4.0.0 Phases 204-213 now have discussion/context/research as applicable and atomic plan files.
- Phases 207-213 were the main weakness; they now have 40 new plan files.
- Reserved SaaS Suite Phases 214-217 now have 24 new plan files.
- SaaS Marketing OS Strategy is routed into reserved Phases 218-220 with 18 new plan files, preserving doc 17 as governed future work rather than vague ambition.
- The planning route still points execution to Phase 204 first, then 205, 206, and the operating-loop phases 207-213.

New audit artifact:

- `.planning/V4.0.0-INCOMING-VAULT-GSD-COVERAGE-AUDIT.md`

## Planning overlay (2026-04-23 codebase vs vault deep run)

The repository was scanned across `app/`, `api/`, `bin/`, `components/`, `contracts/`, `docs/`, `lib/`, `onboarding/`, `sdk/`, `scripts/`, `supabase/`, `test/`, `tools/`, `.agent/`, `.planning/`, `obsidian/`, and `RESEARCH/` to compare live implementation surfaces against the current Obsidian vault doctrine.

New artifact:

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`

Decision: no new top-level phase was added. The current `204 -> 220` phase family remains correct, but the deep audit now defines codebase-specific strengthening instructions for CLI, Pricing Engine residue cleanup, AgentRun unification, task/approval migration, evidence normalization, connector operating loops, end-to-end v2 loop proof, and future SaaS/growth boundaries.

## Planning overlay (2026-04-23 discuss/research refresh for 204, 205, 207, 208)

Discuss/context/research artifacts for Phases 204, 205, 207, and 208 were refreshed again using the deep codebase-vault audit as mandatory input.

New artifact:

- `.planning/V4.0.0-DISCUSS-RESEARCH-REFRESH-204-208.md`

Result:

- No new top-level phase was needed.
- Phase 204 is now framed as a compatibility-safe CLI migration, not a greenfield CLI build.
- Phase 205 now explicitly absorbs runtime pricing-residue cleanup in lib/API/UI surfaces.
- Phase 207 now explicitly frames orchestration as unification across existing run-producing domains.
- Phase 208 now explicitly frames the work as migration of the current `(markos)` shell and operations surfaces into the operator cockpit.

## Planning overlay (2026-04-23 GSD research readiness pass)

GSD phase discussion/research has been reviewed again against the incoming documents `00` through `17`, the Obsidian vault canon, and the current app codebase.

New readiness artifact:

- `.planning/V4.0.0-GSD-PHASE-RESEARCH-READINESS-MATRIX.md`

Research updates:

- Added missing `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`.
- Enriched Phase 205 and Phases 207-217 research files with codebase findings, current support, gaps, recommended contracts, implementation path, and tests implied.

Decision: do not execute Phases 207-213 from discussion notes alone. Use the enriched research files and the new atomic plan files as the foundation for execution. The recommended execution sequence remains 204 -> 205 -> 206 -> 207 -> 208 -> 209 -> 210 -> 211 -> 212 -> 213 -> 214-217 -> 218-220.

## Planning overlay (2026-04-22 SaaS Marketing OS Strategy discussion review)

Incoming document `17-SAAS-MARKETING-OS-STRATEGY.md` has been ingested into the vault and reviewed against phases 200 forward.

Canonical planning inputs:

- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`
- `.planning/V4.0.0-PHASE-200-FORWARD-INCOMING-DISCUSSION-REVIEW.md`

Outcome: the current build order does not change. Document 17 is a post-SaaS-Suite growth-system destination map, not permission to expand phases 214-217 into the full SaaS Marketing OS. It introduces future requirements for SaaS growth-mode routing, PLG/PQL, account expansion, ABM, viral/referral, in-app marketing, community, events, PR/reviews, partnerships, developer marketing, experimentation, and revenue alignment.

Required routing updates:

- Phase 204 `doctor --check-only` freshness rules must include document 17 and its vault canon/intake.
- Phase 205 Pricing Engine research must cover future PLG upgrade prompts, referral rewards, affiliate commissions, save offers, pricing-page experiments, G2/Capterra pricing sync, and pricing-sensitive sales/CS copy.
- Phase 206 SOC2 controls must cover future in-app, referral, affiliate, PR, event, partner, review, experiment, ABM, customer-marketing, and developer/community external mutations.
- Phases 207-213 now have seeded CONTEXT/RESEARCH artifacts and need code-level research fill before execution planning.
- Phases 214-217 should preserve extension points for doc 17 but remain SaaS Suite foundation work.

## Planning overlay (2026-04-22 v2 vault/codebase compliance audit)

The codebase was reviewed against the active Obsidian vault doctrine from:

- `obsidian/brain/Marketing Operating System Foundation.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/work/incoming/15-PRICING-ENGINE.md`

Outcome: the app has strong SaaS, tenancy, MCP, webhook, CRM, billing-ledger, and partial AgentRun foundations, but it is not yet 100% compliant with the v2 Marketing Operating System requirements. The gap matrix lives at `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`.

New/updated routing:

- Phase 204 adds `204-13-PLAN.md` for CLI v2 guardrails.
- Phase 205 now has plans `205-01` through `205-08` for Pricing Engine Foundation + Billing Readiness.
- Phase 206 now has plans `206-01` through `206-07` for SOC2 controls that cover AI, pricing, connectors, evidence, learning, and Tenant 0.
- New Phases 207-213 cover AgentRun v2, Human Operating Interface, Evidence/Research, Connector Wow Loop, Content/Social/Revenue Loop, Learning/Literacy, and Tenant 0 compliance validation.

## Planning overlay (2026-04-22 SaaS Suite intake)

Incoming document `16-SAAS-SUITE.md` has been ingested and distilled into `obsidian/brain/SaaS Suite Canon.md` plus `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`.

Outcome: SaaS Suite is a major planned tenant-type feature for `business_type = saas`, but it should not disrupt the current v4.0.0 foundation track. It is reserved as v4.1.0 candidate work through Phases 214-217 after Pricing Engine, AgentRun v2, human approvals, evidence, connector recovery, and SOC2 controls are ready.

Reserved routing:

- Phase 214: SaaS Suite Activation and Subscription Core.
- Phase 215: SaaS Billing, Payments, and Multi-Country Compliance.
- Phase 216: SaaS Health, Churn, Support, and Product Usage Intelligence.
- Phase 217: SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness.

Seeded artifacts:

- `.planning/phases/214-saas-suite-activation-subscription-core/DISCUSS.md`, `214-CONTEXT.md`, `214-RESEARCH.md`.
- `.planning/phases/215-saas-suite-billing-payments-compliance/DISCUSS.md`, `215-CONTEXT.md`, `215-RESEARCH.md`.
- `.planning/phases/216-saas-suite-health-churn-support-usage/DISCUSS.md`, `216-CONTEXT.md`, `216-RESEARCH.md`.
- `.planning/phases/217-saas-suite-revenue-agents-api-ui/DISCUSS.md`, `217-CONTEXT.md`, `217-RESEARCH.md`.
- `.agent/markos/agents/markos-saas-*.md` planned SAS agent definitions.

## Planning overlay (2026-04-22 Pricing Engine intake)

Phase 205 has been re-scoped from static "Billing Self-Serve + BYOK" into **Pricing Engine Foundation + Billing Readiness**. The old monetization model (platform fee + metered AI + BYOK discount) is historical context only. Active pricing policy now lives in `obsidian/brain/Pricing Engine Canon.md`; unresolved public prices, packages, usage inclusion, discounts, and billing copy must use `{{MARKOS_PRICING_ENGINE_PENDING}}` until PricingRecommendation records are generated and approved.

Updated planning entrypoints:

- `.planning/ROADMAP.md` Phase 205
- `.planning/v4.0.0-ROADMAP.md` Phase 205
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/DISCUSS.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `obsidian/work/active/2026-04-22-markos-v2-pricing-engine-intake.md`

## What just happened (2026-04-18, Plan 203-11 close — gap-closure solo Wave)

- **Plan 203-11 shipped** (solo executor, gap-closure for VERIFICATION.md gap #1) —
  Surface 4 rotation-grace banner wired into MarkOS workspace shell. ~121 LoC across
  3 files; zero scope creep. 2 commits (RED + GREEN). Full webhook regression:
  **359 pass + 2 skip, 0 fail** (was 352 + 2; delta = +7 new cases).

  - `app/(markos)/_components/RotationBannerMount.tsx` (NEW, 46 LoC): client
    component (`'use client'`) performing one-shot `useEffect` fetch of
    `/api/tenant/webhooks/rotations/active` on mount; stores result in
    `useState<Rotation[]>`; renders `<RotationGraceBanner rotations={rotations} />`.
    Silent on `!res.ok` (401 pre-auth / 500 transient) and network errors — banner
    self-renders null on empty list, so mount is ambient + zero-cost on pages
    with no active rotations. No user-hideable toggle (UI-SPEC §Surface 4
    security rule: active rotation is a live security-relevant state).

  - `app/(markos)/layout-shell.tsx` (MODIFIED, +4 LoC): one import line +
    JSX mount as first child of `<section className={styles.content}>` above
    `{children}`, per UI-SPEC §Surface 4 Placement (rows 47, 157, 357, 380).
    Scope-minimal edit — NAV_ITEMS, sidebar, `MarkOSAccessDeniedState` untouched.
    `RotationGraceBanner.tsx` UNCHANGED (203-06 pure-display contract preserved).

  - `test/webhooks/layout-shell-banner.test.js` (NEW, 71 LoC): 7 grep-shape
    contract cases mirroring `settings-ui-a11y.test.js` posture. Asserts file
    existence, `import RotationBannerMount` + `<RotationBannerMount />` in
    layout, `'use client'` directive, fetch-URL literal, `<RotationGraceBanner
    rotations={rotations} />` render site, `useEffect` + `useState` hooks, and
    absence of `close`/`dismiss` tokens.

  - **Handoff chain resolved:** 203-06 shipped the banner component and
    explicitly deferred shell-wiring to 203-09; 203-09 added sidebar nav entries
    for MCP + Webhooks but did NOT perform the promised shell mount + fetch;
    203-11 is the surgical closure that handoff missed (~10-20 line fix).

  - Commits: `ec6ca5c` (RED — wiring contract test) · `812124d` (GREEN — mount
    component + layout-shell import + JSX mount).

  - **Decisions:** (1) Split `import RotationGraceBanner from './RotationGraceBanner'`
    from `import type { Rotation } from './RotationGraceBanner'` to satisfy the
    grep-shape test regex that requires the default import as a standalone
    statement (no named imports in same `{}`). TypeScript compiles identically;
    split is grep-only. (2) Mount lives INSIDE `<section className={styles.content}>`
    above `{children}` — reads as a system notice above every route's content
    slot, including routes that render their own inner `<main>` (Surface 1/2).
    (3) Silent `!res.ok` branch returns without touching DOM → no error text
    leaks; mitigates threat T-203-11-01.

  - **VERIFICATION.md impact:** Truth #12 ("Surface 4 rotation grace banner
    is visible to tenant-admins across (markos) routes") status flips from
    **FAILED** → **VERIFIED** on re-run. Phase 203 score 11/12 → 12/12.
    `grep -r "import.*RotationGraceBanner\|import.*RotationBannerMount"
    "app/(markos)"` now yields 3+ hits (was 0).

## Next step

**Phase 203 is gap-free at 11/11 plans.** Re-run phase verification to confirm
the gap closure:

```bash
/gsd-verify-phase 203
```

Expected: 12/12 truths verified, status: verified.

## What just happened (2026-04-18, Plan 203-10 close — parallel Wave 5)

- **Plan 203-10 shipped** (parallel executor, Wave 5 — co-executing with 203-08 + 203-09) —
  Phase-close: Surface 3 public status page + observability primitives (log-drain +
  Sentry + delivery.cjs post-fetch wrapper) + QA-07 load smoke + 5 docs + llms.txt +
  final OpenAPI regen (64 F-NN flows / 97 paths).

  - `lib/markos/webhooks/log-drain.cjs` + `.ts`: `emitLogLine` mirrors 202-05 MCP
    shape with `domain='webhook'` + D-30 fields (req_id, tenant_id, sub_id, delivery_id,
    event_type, delivery_attempt, duration_ms, status, error_code). JSON.stringify
    wrapped in try/catch so emission never throws.

  - `lib/markos/webhooks/sentry.cjs` + `.ts`: `captureToolError` with triple-safety
    (SENTRY_DSN env gate + lazy `@sentry/nextjs` import try/catch + captureException
    try/catch). Tags `{ domain: 'webhook', event_type, sub_id, status: 'error' }`.

  - `lib/markos/webhooks/delivery.cjs`: observability wrapper. Imports recordOutcome +
    classifyOutcome from Plan 203-08's breaker.cjs — SINGLE post-fetch insertion point
    (T-203-10-07 invariant). try/catch/finally wraps fetch(): catch fires captureToolError

    + classifies AbortError/timeout vs network_error; finally runs recordBreakerOutcomeSafe
    (sync + async throw swallow per RESEARCH §Pitfall 2) then emitLogLine. Gate-blocked
    deliveries get a DEDICATED emitLogLine at their own call-site (observeAndHandleGateBlock
    helper). S3776 complexity fix via 4 extracted helpers (Plan 203-07 precedent).

  - `api/webhooks/queues/deliver.js`: Plan 203-01's safe-require stubs replaced with real
    module imports.

  - `api/public/webhooks/status.js`: public GET backing F-99. 60s cache + CORS-open.
    New `aggregatePlatformWide` helper queries the fleet-metrics view with NO tenant_id
    filter — Plan 203-10 does NOT edit Plan 203-09's metrics.cjs. Response emits only
    5 aggregate fields (no tenant_id → T-203-10-01 info-disclosure mitigation).

  - `app/(markos)/status/webhooks/page.tsx` + `.module.css`: Surface 3 STANDALONE (no
    workspace shell). Mirrors invite/[token]/page.tsx posture. All UI-SPEC Surface 3
    locked copy + a11y markers. Hero grid duplicated from Surface 1 (co-location rule).
    Data-attribute state variants (operational/retrying/elevated). Responsive + reduced-motion.

  - `contracts/F-99-webhook-status-v1.yaml`: single GET path + full schema + Stripe/Vercel
    lineage refs. Block-form tags: (ZERO contribution to the 35 deferred tags-missing paths).

  - `scripts/load/webhooks-smoke.mjs`: QA-07 60-concurrent × 60s targeting test-fire.
    Gates p95 ≤ 500ms + error_rate ≤ 0.01. Dry-run when MARKOS_WEBHOOK_SMOKE_BASE_URL
    unset.

  - 5 docs: webhooks.md (Node.js + Python + Go verify + dual-sig) + rotation.md +
    dlq.md + status.md + llms/phase-203-webhooks.md. Every doc cites DISCUSS.md /
    canonical_refs (Dimension 11 — grep ≥3 per file).

  - `public/llms.txt`: Phase 203 section with 5 link entries.

  - `contracts/openapi.{json,yaml}` regenerated: **64 F-NN flows / 97 paths** (up from
    62/91 at Plan 203-07 close). `test/openapi/openapi-build.test.js` + 4 Phase-203
    path assertions (F-96, F-97, F-98, F-99).

  - `.planning/phases/203-webhook-subscription-engine-ga/deferred-items.md`: QA-06
    (Playwright phase-infra deferral) + QA-08 (no webhook LLM surface) added per
    202-10 precedent.

  - 4 new test suites: observability.test.js (12) + public-status.test.js (6) +
    status-page.test.js (8) + ui-s3-a11y.test.js (9) = 35/35 green. Full webhook
    regression **333/336** (2 pre-existing skips + 1 pre-existing 35-tags-missing
    deferred).

  - Commits: `94d5f78` (RED all suites) · `38ca91a` (Task 1a GREEN — log-drain +
    sentry libs + queues/deliver.js swap) · `df60b46` (Task 3 GREEN — smoke + 5 docs

    + F-99 + OpenAPI regen) · `fcab6b2` (Task 1b GREEN — delivery.cjs observability
    wrapper) · `9350cc3` (Task 2 GREEN — public endpoint + Surface 3).

  - **Decisions:** (1) Platform-wide aggregation owned by Plan 203-10 (aggregatePlatformWide
    helper), not by extending 203-09's metrics.cjs — preserves Wave-5 single-owner
    invariant (symmetric with T-203-10-07 for delivery.cjs). (2) S3776 cognitive-complexity
    fix via 4 module-local helpers (recordBreakerOutcomeSafe, deriveLogStatus,
    observeAndHandleGateBlock, checkSsrfReject). (3) Gate-blocked deliveries get a DEDICATED
    emitLogLine call-site — no double emission; 100% dispatch observability. (4) F-99 uses
    block-form tags: → zero Phase-203 contribution to deferred-items 35-tags-missing.
    (5) QA-06 Playwright deferred to cross-phase testing-infra plan per 202-10 precedent;
    QA-08 LLM eval not applicable (no LLM surfaces in webhook domain).

  - **T-203-10-07 invariant verified:** delivery.cjs is the SOLE Wave-5 owner — 203-08's
    `7dba7af` shows breaker.cjs as its only lib change; 203-09's commits ship metrics.cjs

    + api/tenant/webhooks endpoints (delivery.cjs untouched); 203-10 owns `fcab6b2` +
    `9350cc3`. Zero three-way overlap.

## Next step

**Phase 203 closed at 10/10 plans.** Run phase verification:

```bash
/gsd-verify-phase 203
```

All 16 phase decisions (D-01..D-16) delivered across 10 plans. Wave 5 parallel execution
proved the single-owner-per-wave invariant for high-contention files (delivery.cjs +
dispatch-gates.cjs — zero merge conflicts despite 3-agent parallelism).

## What just happened (2026-04-18, Plan 203-08 close — parallel Wave 5)

- **Plan 203-08 shipped** (parallel executor, Wave 5 — co-executing with 203-09 + 203-10) —
  Webhook circuit breaker (D-14 + D-15) + dispatch-gates extended with breaker as FIRST gate.
  Closes the Wave-4 same-file-conflict risk between Plan 203-08 and Plan 203-10 via the
  T-203-08-06 invariant (delivery.cjs un-edited by this plan; recordOutcome + classifyOutcome
  exported as pure primitives for Plan 203-10's observability wrapper to import and invoke).

  - `lib/markos/webhooks/breaker.cjs` + `.ts` dual-export: 4 functions (`recordOutcome`,
    `canDispatch`, `classifyOutcome`, `getBreakerState`) + 3 constants (WINDOW_SIZE=20,
    TRIP_THRESHOLD=0.5, HALF_OPEN_BACKOFF_SEC=[30,60,120,300,600]). D-14 trip threshold
    (>50% strict) + D-15 exponential backoff capped at 600s. 4xx explicitly non-failure
    (subscriber misrouting does not trip breaker). State storage: `cb:webhook:outcomes:
    <sub_id>` LPUSH list trimmed to 20 with 1h TTL; `cb:webhook:state:<sub_id>` JSON blob
    with TTL = backoff + 3600s. Redis-backed (shares @upstash/redis with 202-04 pipeline;
    no new deps). RESEARCH §Pattern 4 verbatim.

  - `lib/markos/webhooks/dispatch-gates.cjs` + `.ts`: EXTENDED additively — breaker gate
    inserted as FIRST gate inside runDispatchGates (before rate-limit). On `state=open`
    returns `{ status: 'breaker_open', retryAfterSec, reason: 'breaker_open', breaker:
    { state, trips, probe_at } }` — short-circuits all downstream gates so Upstash
    rate-limit state is never burned while breaker is tripped. `GateDisposition` TS
    union extended with `GateBreakerOpen`. Half-open state lets exactly ONE probe through;
    on success recordOutcome DELs the state key (recovery to closed), on failure the
    trips counter increments and backoff deepens.

  - Invariant locks (T-203-08-06 mitigation): `grep -c "require.*breaker" lib/markos/
    webhooks/delivery.cjs = 0` AND `grep -c "recordOutcome" lib/markos/webhooks/delivery.
    cjs = 0` AND `grep -c "canDispatch" lib/markos/webhooks/delivery.cjs = 0`. Plan
    203-08 owns ONLY breaker.cjs + dispatch-gates.cjs edits; Plan 203-10 owns
    delivery.cjs edits (observability wrapper that imports breaker's recordOutcome +
    classifyOutcome). Wave-5 same-file conflict mathematically eliminated.

  - Gate order verified: `awk '/canDispatch|checkWebhookRateLimit/{print NR}' lib/markos/
    webhooks/dispatch-gates.cjs` — canDispatch at line 42, checkWebhookRateLimit at line

    57. Breaker is FIRST gate.

  - 2 new test suites: `test/webhooks/breaker.test.js` (23 — 22 behaviors 1a-1v plus
    module-surface invariant) + `test/webhooks/circuit-breaker.test.js` (10 — integration
    2a-2i plus gate-order invariant). Mock redis covers lpush/ltrim/lrange/expire/get/set
    (ex)/del + Date.now injection for probe_at determinism. Test stubs extended:
    mockLimiter in dispatch-gates.test.js + delivery.test.js gained `async get()
    { return null }` (no-op for breaker closed); same object now serves as both Upstash
    limiter stub AND redis stub. 33/33 new tests green.

  - Plan-scope regression: 146/146 green across breaker + circuit-breaker + dispatch-gates
    + delivery + rate-limit + 429-breach + signing + engine + api-endpoints + dlq +
    replay + ssrf-guard (all 203-08 files + pre-existing non-sibling webhook suites).
    Full `test/webhooks/*.test.js` has 27 failures — ALL from parallel Wave-5 siblings
    (api-tenant 203-09, public-status/status-page/ui-s3-a11y/observability/settings-api
    203-10); none caused by 203-08.

  - Commits: `7aa3981` (Task 1 RED) · `432e319` (Task 1 GREEN: breaker library) ·
    `49c2f6a` (Task 2 RED) · `7dba7af` (Task 2 GREEN: dispatch-gates extension).

  - **Decisions:** (1) 4xx treated as 'success' for breaker (D-14 explicit reading
    "5xx or timeout" — client-side misrouting is subscriber's problem; T-203-08-03 accept).
    (2) Unknown HTTP result classified as 'failure' (fail-closed). (3) State key TTL =
    backoff + 3600s pad — second trips within ~1h properly increment instead of resetting.
    (4) recordOutcome('success') while state !== closed DELs the state key (recovery)
    — production guarantee holds because canDispatch blocks dispatches during open state,
    so recordOutcome is only reached from closed or half-open. (5) Test setup: outcomes
    list seeded directly via redis.lpush in counter-increment tests (recording successes
    would trigger recovery mid-setup — doesn't reflect production flow where open state
    blocks all dispatch). (6) mockLimiter.get extended to no-op null instead of a parallel
    redis mock — same pre-built object continues to serve Upstash limiter dep-injection

    + redis dep-injection; zero new test infrastructure.

  - **Downstream unlocks:** Plan 203-09 (dashboard) — `getBreakerState(redis, sub_id)`
    returns the Surface 4 breaker badge data; F-100 BreakerState schema already shipped
    by Plan 203-07. Plan 203-10 (observability + status page) — already landed
    log-drain.cjs + sentry.cjs + queues/deliver.js swap; its delivery.cjs observability
    wrapper can now import `recordOutcome` + `classifyOutcome` from `./breaker.cjs` and
    call them in its finally block around fetch() (this plan did NOT touch delivery.cjs).

## What just happened (2026-04-18, Plan 203-07 close — solo Wave 4)

- **Plan 203-07 shipped** (solo executor, Wave 4) — Per-subscription rate-limit (D-13)
  + dispatch-gates indirection module (T-203-07-06 single-insertion-point invariant).

  - `lib/markos/webhooks/rate-limit.cjs` + `.ts`: `PLAN_TIER_RPS` frozen
    `{ free: 10, team: 60, enterprise: 300 }` (D-13 locked); `resolvePerSubRps`
    with `Math.min(override, ceiling)` (cap-not-raise — never allows override
    to exceed plan ceiling); unknown `plan_tier` falls through to `free`
    (fail-closed per T-203-07-04). `checkWebhookRateLimit(redisOrLimiter,
    { subscription, plan_tier })` builds Upstash `Ratelimit` with
    `slidingWindow(resolved_rps, '1 s')` + prefix `rl:webhook:sub`; per-
    `(sub_id, resolved_rps)` bounded cache at 1024 entries (flipping
    rps_override doesn't require a process restart). Breach returns
    `{ ok: false, reason: 'sub_rps', retry_after, limit, error_429 }`
    with `retry_after` clamped to ≥1. `buildRateLimitedEnvelope` shared
    429 envelope. Shares @upstash/ratelimit + @upstash/redis instance with
    202-04 MCP pipeline — zero new deps (RESEARCH §Standard Stack).

  - `lib/markos/webhooks/dispatch-gates.cjs` + `.ts`: **SINGLE pre-fetch
    indirection module** that Plan 203-08 will EXTEND additively.
    `runDispatchGates({subId, tenantId, eventId, planTier, subscription,
    redis})` → `{status: 'allowed'}` or `{status: 'rate_limited',
    retryAfterSec, limit, reason}`. Explicit `// GATE: breaker (Plan 203-08
    extends here as FIRST gate)` marker above the rate-limit gate.
    Fall-through to `allowed` when `redis === undefined && !UPSTASH_
    REDIS_REST_URL` (Rule 3 fix so 200-03 delivery suite + CI without
    Upstash creds keep working; production consumers pass redis explicitly).
    `handleGateBlock` writes `{status: 'retrying', next_attempt_at,
    updated_at}` — attempt counter NOT set (transient block, not DLQ event;
    24-cap preserved).

  - `lib/markos/webhooks/delivery.cjs`: ONE pre-fetch `runDispatchGates`
    call after subscription lookup, before SSRF re-check + dual-sign +
    fetch. On non-`allowed` → `handleGateBlock` returns early.
    **`checkWebhookRateLimit` NO LONGER imported directly** — dispatch-
    gates is the sole consumer (T-203-07-06 invariant; grep=0 locked).
    `ProcessDeliveryOptions` gains optional `redis` + `planTier`.

  - `api/webhooks/subscribe.js`: `rps_override` body param validation
    at subscribe-time (D-13 enforcement layer 1). Type-check first → 400
    `invalid_rps_override`; then ceiling-check → 400 `rps_override_
    exceeds_plan` with `ceiling` echoed. Extracted `checkSsrfOrReject`

    + `validateRpsOverride` helpers (S3776 cognitive-complexity fix,
    18 → under 15). `engine.cjs::subscribe` now persists `rps_override`
    on the row (null when caller omits).

  - `contracts/F-100-webhook-breaker-v1.yaml`: declarative-only
    (`paths: {}`). Schemas: `RateLimitState` (plan_tier + ceiling_rps +
    effective_rps + override_rps nullable), `BreakerState` (state:
    closed|half-open|open + trips + probe_at + opened_at), `Webhook
    SubscriptionDetail` (reserved shape for Plan 203-09 GET detail).
    3 error envelopes: `rate_limited` 429 + Retry-After, `rps_override_
    exceeds_plan` 400, `invalid_rps_override` 400. All 3 breaker states
    declared so Plan 203-08 extends the same contract.

  - `contracts/openapi.{json,yaml}`: regenerated via
    `scripts/openapi/build-openapi.cjs`: **62 F-NN flows / 91 paths**
    (up from 61/90 at Plan 203-05 close).

  - Tests — 3 new suites + 1 extension: `rate-limit.test.js` (19),
    `429-breach.test.js` (5), `dispatch-gates.test.js` (6),
    `delivery.test.js` +3 (2c gate blocks fetch, 2d gate allowed,
    2f repeated blocks don't burn 24-cap). **33 new tests green.**
    Full webhook regression **227/229 + 2 skips** (up from 199/201).
    200-03 baseline `signing + engine + delivery + api-endpoints` → 41/41.

  - Commits: `5c3ecd6` (Task 1 RED) · `0e3462a` (Task 1 GREEN: rate-limit
    lib + subscribe-time rps_override validation) · `9d5d433` (Task 2 RED)
    · `190742b` (Task 2 GREEN: dispatch-gates + single pre-fetch indirection

    + F-100 + openapi regen).

  - **Decisions:** (1) T-203-07-06 invariant locked via grep acceptance:
    `checkWebhookRateLimit` appears 0 times in delivery.cjs. Plan 203-08
    extends dispatch-gates.cjs, never delivery.cjs — no parallel pre-fetch
    branches. (2) Unknown plan_tier → free (fail-closed) at BOTH resolve
    PerSubRps (lib) AND subscribe.js (handler) — aligned with 202-09
    usage.js pattern. (3) Gate fall-through when no redis + no UPSTASH
    env: preserves 200-03 delivery suite (5 tests never passed redis)
    and CI runs without Upstash credentials; production consumers pass
    redis explicitly via deps. (4) Per-(sub_id, resolved_rps) bounded
    limiter cache (max 1024) handles rps_override flips without process
    restart. (5) F-100 declarative-only (`paths: {}`) — Plan 203-09
    mounts the handler; F-100 pre-declares RateLimitState + BreakerState
    so Plan 203-08 references the same contract. (6) S3776 fix:
    extracted checkSsrfOrReject + validateRpsOverride helpers in
    subscribe.js to keep handleSubscribe under cognitive-complexity 15.

  - **Downstream unlocks:** Plan 203-08 (breaker) extends
    `dispatch-gates.cjs` by inserting the breaker check at the
    `// GATE: breaker` marker as the FIRST gate — zero edits to
    delivery.cjs needed (the architectural point of T-203-07-06). Plan
    203-09 (dashboard) GET `/api/tenant/webhooks/subscriptions/{sub_id}`
    joins F-100's RateLimitState + BreakerState into 200 body for
    UI-SPEC Surface 2 RPS chip + Surface 4 breaker badge. Plan 203-10
    (status page) emits the F-100 429 envelope through log-drain.cjs.

## What just happened (2026-04-18, Plan 203-04 close — parallel Wave 2)

- **Plan 203-04 shipped** (parallel executor, Wave 2 — ran alongside 203-03 + 203-06) —
  Webhook delivery replay path + dual-sign primitive foundation for Plan 203-05.
  Closes D-06 (fresh HMAC + current ts on every replay, NO original sig/ts reuse),
  D-07 (replay only from status='failed'; no auto-retry loops), and RESEARCH §Pitfall 7
  (batch idempotencyKey keyed on 5-min bucket prevents rapid-click double-dispatch).

  - `lib/markos/webhooks/signing.cjs` + `.ts`: new `signPayloadDualSign(v1Secret,
    v2Secret, body, now)` → `{ headers: { X-Markos-Signature-V1, X-Markos-Signature-V2?,
    X-Markos-Timestamp } }`. When v2Secret=null (no rotation active), only V1 +
    Timestamp. When both provided, shared Timestamp across V1+V2. V1 output
    byte-for-byte matches existing `signPayload` (backward compat).

  - `lib/markos/webhooks/replay.cjs` + `.ts`: net-new library. `replaySingle`
    fetches tenant-scoped original, validates D-07 (status='failed'), inserts
    new row `{ id: del_<uuid>, attempt: 0, replayed_from: orig.id, body: orig.body
    raw, status: 'pending' }`, calls `queue.push(newRow.id)`, emits
    `source_domain='webhooks', action='delivery.replay_single'` audit row.
    `replayBatch` dedupes delivery_ids, enforces `BATCH_CAP=100` (T-203-04-03),
    returns `{ batch_id, count, replayed, skipped }`. Per-row skipped collection
    for `not_found | not_failed | cross_tenant_forbidden | cross_subscription`.
    Batch queue.push carries `idempotencyKey: 'replay-{orig_id}-{5min-bucket}'`
    via `IDEMPOTENCY_BUCKET_MS=300_000`.

  - `api/tenant/webhooks/subscriptions/[sub_id]/deliveries/[delivery_id]/replay.js`:
    POST single handler, 202-09 pattern — method gate, x-markos-user-id +
    x-markos-tenant-id headers (401), SELECT subscription.tenant_id (403
    cross_tenant_forbidden), delegate replaySingle, typed-error→HTTP mapper
    (`not_found→404, cross_tenant_forbidden→403, cross_subscription→400,
    not_failed→409, else 500`).

  - `api/tenant/webhooks/subscriptions/[sub_id]/dlq/replay.js`: POST batch
    handler. Body `{ delivery_ids: string[] }`; 400 empty_batch + 400
    batch_too_large (>100) at handler + library (defense-in-depth); returns
    `{ ok, batch_id, count, replayed, skipped }`.

  - `contracts/F-98-webhook-dlq-v1.yaml`: net-new — 2 paths, 5 error envelopes
    (empty_batch/batch_too_large/cross_tenant_forbidden/not_failed/already_replayed),
    block-form tags (not inline) so `parseContractYaml` tokenizes as arrays.

  - `contracts/F-73-webhook-delivery-v1.yaml`: extended `WebhookDelivery` schema
    with `replayed_from` + `dlq_at` + `final_attempt` + `dlq_reason` (migration
    72 columns from Plan 203-02). `outbound_headers:` block documents
    `X-Markos-Signature-V1/V2`, `x-markos-replayed-from`, `x-markos-attempt`.

  - `contracts/openapi.json` + `.yaml` regenerated: 60 flows / 87 paths (up
    from 59/85).

  - 3 test suites: `signing.test.js` extended 8→11 (regression preserved);
    `replay.test.js` (11 new); `replay-idempotency.test.js` (10 new). Plan
    delta: **+32 tests, all green**. Full webhook regression **143 pass + 2
    skip** (up from 124/2). OpenAPI build 15/16 (1 pre-existing inherited from
    Phase 202, documented in `deferred-items.md`).

  - Commits: `d175def` (Task 1 RED) · `a8f071b` (Task 1 GREEN — signing +
    replay library) · `428eff1` (Task 2 RED) · `9104daa` (Task 2 GREEN —
    endpoints + F-98 + F-73 extension + openapi regen).

  - **Decisions:** (1) signPayloadDualSign defensively requires v1Secret but
    allows v2Secret=null — shared Timestamp across V1+V2 lets subscribers
    verify with either secret during the 30-day rotation grace (D-10 → Plan
    203-05). (2) Replay library stores RAW body (no pre-signed blob); signing
    at delivery.cjs dispatch ensures each attempt carries a CURRENT timestamp

    + fresh HMAC (D-06 closes the replay-attack oracle via 300s skew window).
    (3) Batch idempotency uses 5-min bucket = Math.floor(now/300_000) — rapid
    re-clicks inside the window produce the SAME key; Vercel Queues dedupes
    server-side (T-203-04-04, RESEARCH §Pitfall 7). (4) F-98 uses block-form
    `tags:` because the repo's minimal YAML parser keeps inline-array syntax
    as literal strings; 35 pre-existing offending paths logged to
    `deferred-items.md` (scope boundary — out-of-scope for this plan).
    (5) Relative-path depth Rule-3 fix: single-replay handler is 7 components
    deep, not 6 (dlq-replay is 6) — corrected `../` count in 3 require sites.

  - **Downstream unlocks:** Plan 203-05 (rotation) can now wire
    `signPayloadDualSign(v1, v2, body)` at dispatch during grace; the
    primitive + test suite are ready. Plan 203-08 (dashboard) has both
    single and batch replay endpoints to wire into the S2 DLQ tab. Plan
    203-09 (fleet metrics) can distinguish original vs replayed deliveries
    via F-73 `replayed_from` column.

## What just happened (2026-04-18, Plan 203-03 close — parallel Wave 2)

- **Plan 203-03 shipped** (parallel executor, Wave 2 — ran alongside 203-04 + 203-06) —
  DLQ library + daily purge cron. Completes the Wave-2 DLQ substrate every
  downstream plan (203-04 replay, 203-09 dashboard DLQ tab, 203-10 status metrics)
  builds on.

  - `lib/markos/webhooks/dlq.cjs` + `.ts` dual-export: 5 exports
    (`listDLQ`, `countDLQ`, `markFailed`, `markDelivered`, `purgeExpired`) +
    `DLQ_WINDOW_DAYS=7` constant (D-08 locked). `listDLQ` + `countDLQ` THROW if
    `tenant_id` missing (T-203-03-03 defense-in-depth). `.eq('tenant_id', ...)`
    always first filter. `purgeExpired` double-filter
    (`status='failed' AND dlq_at < now-7d`) backed by migration 72's
    `idx_deliveries_dlq_retention` partial index.

  - `api/cron/webhooks-dlq-purge.js` — POST-only handler gated by
    `MARKOS_WEBHOOK_CRON_SECRET` (header OR Bearer); delegates to
    `purgeExpired(supabase)`; returns `{ success, count, duration_ms }`.
    Mirrors Plan 202-01 cleanup.js / 202-10 mcp-kpi-digest.js patterns;
    exports `handle(req, res, deps)` seam for unit tests.

  - `vercel.ts` — 6th cron entry
    `{ path: '/api/cron/webhooks-dlq-purge', schedule: '30 3 * * *' }`
    (daily 03:30 UTC — offset from 02:00 lifecycle-purge + 02:30
    cleanup-unverified-signups). All 5 prior crons + Plan 203-01 queue
    trigger preserved.

  - Audit emit on purge batch: `enqueueAuditStaging(client, { source_domain:
    'webhooks', action: 'dlq.purged', tenant_id: 'system', actor_id:
    'system:cron', actor_role: 'system', payload: { count, older_than: '7d',
    purged_at } })` — fire-and-forget (catch swallows staging failure).
    T-203-03-05 mitigation: audit log retains batch row forever even after
    DLQ rows are hard-deleted.

  - 2 test suites: `test/webhooks/dlq.test.js` (17) +
    `test/webhooks/dlq-purge-cron.test.js` (9) = **26/26 green**. 200-03
    regression (signing + engine + delivery + api-endpoints) **38/38 preserved**.
    Audit hash-chain regression **7/7 preserved** (AUDIT_SOURCE_DOMAINS
    untouched — 200-03 SUMMARY confirms 'webhooks' already at index 6).

  - Commits: `8357fc5` (Task 1 RED) · `ad962d5` (Task 1 GREEN: DLQ library +
    dual-export) · `8881353` (Task 2 RED) · `3f64522` (Task 2 GREEN: cron
    wrapper + vercel.ts 6th cron entry).

  - **Decisions:** (1) `enqueueAuditStaging` is `(client, entry)` — 2-arg
    signature, not the single-object form the plan assumed. `purgeExpired`
    passes the same Supabase client used for the DELETE. (2) `tenant_id:
    'system'` sentinel on cross-tenant system audit rows (markos_audit_log_
    staging is `text NOT NULL` with no FK; `writer.cjs:validateEntry` rejects
    null). Downstream 203-10 can query `tenant_id='system' AND action='dlq.
    purged'` for all batches. (3) POST-only cron (tighter than cleanup.js's
    POST-or-GET) — Vercel crons POST by default. (4) `DLQ_WINDOW_MS` module
    constant shared by read (listDLQ) and write (purgeExpired) paths —
    flipping D-08 edits one constant.

  - **Downstream unlocks:** Plan 203-04 replay iterator (`listDLQ` row set +
    `markFailed` / `markDelivered` transitions) · Plan 203-09 DLQ dashboard
    pane (`listDLQ` + `countDLQ` back the UI) · Plan 203-10 status page
    (purge audit query + p95 duration_ms metric).

## What just happened (2026-04-18, Plan 203-01 close — parallel Wave 1)

- **Plan 203-01 shipped** (parallel executor, Wave 1 — ran alongside 203-02) —
  Supabase + Vercel Queues adapter swap. Closes D-16 durability gate that
  blocked every downstream 203 plan (RESEARCH §Pitfall 1 in-memory data loss
  on Fluid Compute instance turnover).

  - `lib/markos/webhooks/store-supabase.cjs` + `.ts` dual-export:
    `createSupabaseSubscriptionsStore(client)` + `createSupabaseDeliveriesStore(client)`
    shape-verbatim from 203-RESEARCH.md §Code Examples lines 631-719.
    Every cross-tenant query filters `.eq('tenant_id', tenant_id)` FIRST
    (T-203-01-02 mitigation — 5 occurrences). Typed errors prefixed
    `store-supabase.<method>:` (Phase 202 pattern).

  - `lib/markos/webhooks/store.cjs` rewritten with `WEBHOOK_STORE_MODE` switch.
    Memory mode preserves 200-03 singleton behavior verbatim (`_subscriptionsMemo`,
    `_deliveriesMemo`, `_queueMemo`). Supabase mode lazy-constructs
    `createClient(URL, SERVICE_ROLE_KEY, { auth: { persistSession: false },
    db: { schema: 'public' } })` per RESEARCH §Pitfall 6. Rule 3 fix:
    default falls back to memory when `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
    absent, so 200-03 regression suites (api-endpoints.test.js) keep passing
    without any env-var setup.

  - `lib/markos/webhooks/store-vercel-queue.cjs` + `.ts`:
    `createVercelQueueClient({ topic, deps })` with lazy `sendFn = deps.send
    || require('@vercel/queue').send`. `push()` rejects falsy `delivery_id`,
    honors `options.idempotencyKey` pass-through for Plan 203-04.

  - `api/webhooks/queues/deliver.js` — `handleCallback(asyncHandler, {
    visibilityTimeoutSeconds: 120, retry })` push consumer. Delegates to
    `processDelivery(deliveries, subscriptions, delivery_id)` via
    `getWebhookStores()`. `retry` callback returns `{ acknowledge: true }`
    when `deliveryCount > 24` (engine.cjs MAX_ATTEMPTS parity — app-level
    DLQ via `markos_webhook_deliveries.status='failed'`), otherwise
    `{ afterSeconds: min(86400, 5 * 2^min(count, 15)) }`. Safe-require
    shims for `log-drain.cjs` + `sentry.cjs` (Plan 203-10 targets).
    `module.exports.__internals = { asyncHandler, retry, options }` for
    unit tests (Phase 202 plan 202-05 pattern).

  - `vercel.ts`: `functions` block additively registers
    `api/webhooks/queues/deliver.js` with `experimentalTriggers:
    [{ type: 'queue/v2beta', topic: 'markos-webhook-delivery',
    retryAfterSeconds: 60 }]`. All 5 existing `crons` entries preserved
    (audit/drain, lifecycle/purge-cron, cleanup-unverified-signups,
    mcp/session/cleanup, cron/mcp-kpi-digest).

  - `@vercel/queue@^0.1.6` installed via `npm install --save --ignore-scripts`.

  - 4 new test suites: `store-supabase.test.js` (11) + `adapter-supabase.test.js`
    (8) + `adapter-queues.test.js` (4) + `vercel-queue.test.js` (8) — 31
    Wave-1 tests, all green. 200-03 regression (signing + engine + delivery

    + api-endpoints): **35/35 preserved**. Full webhooks suite: **93 pass +
    2 skips**.

  - Commits: `347d5e1` (Task 1 RED) · `088e4e7` (Task 1 GREEN: Supabase
    adapters + mode switch + @vercel/queue install) · `5268b6c` (Task 2 RED)
    · `2d2a529` (Task 2 GREEN: Vercel Queues client + consumer +
    vercel.ts v2beta trigger).

  - **Decisions:** (1) Default-mode fallback to memory when SUPABASE env
    absent (Rule 3 graceful degrade) — preserves 200-03 regression without
    requiring tests to set `WEBHOOK_STORE_MODE=memory`. (2) Safe-require
    shims (try/catch) for `log-drain.cjs` + `sentry.cjs` so consumer
    doesn't crash before Plan 203-10 ships those modules. (3) Expose
    consumer internals via `module.exports.__internals` — keeps
    `handleCallback` as the public export while enabling unit tests.
    (4) Test seed URL changed to `https://example.com/hook` (RFC 2606
    public) so 203-02 SSRF guard falls through to the fetch stub
    deterministically.

  - **Downstream unlocks:** Every `getWebhookStores()` caller (existing 4
    api/webhooks/{subscribe,unsubscribe,list,test-fire}.js endpoints)
    transparently picks up Supabase-backed subscriptions + deliveries +
    Vercel Queues push when `WEBHOOK_STORE_MODE=supabase` — zero caller
    edits required. D-16 gate cleared for Plans 203-03 through 203-10.

## What just happened (2026-04-18, Plan 203-02 close — parallel Wave 1)

- **Plan 203-02 shipped** (parallel executor, Wave 1 — ran alongside 203-01) —
  two-layer SSRF defense + Migration 72 DLQ/rotation schema substrate.

  - `lib/markos/webhooks/ssrf-guard.cjs` + `.ts` dual-export: `assertUrlIsPublic`
    blocks 6 IPv4 CIDRs (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16 cloud
    IMDS, 0/8) + 3 IPv6 prefixes (`::1`, `fc00::/7`, `fe80::/10`) + HTTPS-only.
    `cidrContains` uses 32-bit-mask impl; `lookup` is dep-injectable for tests.

  - `api/webhooks/subscribe.js`: pre-insert guard returns 400
    `{success:false, error: private_ip | https_required | invalid_scheme}`
    (category prefix stripped from `Error('private_ip:loopback')` etc) —
    matches UI-SPEC Surface-1 locked copy.

  - `lib/markos/webhooks/delivery.cjs`: dispatch-time SSRF re-check for
    DNS-rebinding defense. On known-SSRF codes marks delivery FAILED with
    `dlq_reason: ssrf_blocked:<code>` + `dlq_at = now()`, no retry. DNS
    ENOTFOUND and other transient errors fall through to fetch (Rule 3
    fix — preserves 203-01 `https://ex.test/hook` fixture compatibility).

  - `supabase/migrations/72_markos_webhook_dlq_and_rotation.sql` (175 LOC):
    - 5 rotation/override cols on `markos_webhook_subscriptions` (secret_v2,
      grace_started_at, grace_ends_at, rotation_state, rps_override) with
      CHECK constraint guarded by `do $$ ... pg_constraint $$` block.

    - 4 DLQ cols on `markos_webhook_deliveries` (replayed_from self-ref FK,
      dlq_reason, final_attempt, dlq_at) + `idx_deliveries_dlq_retention`
      partial index WHERE status='failed'.

    - `markos_webhook_secret_rotations` ledger table (10 cols, tenant_id FK,
      state CHECK in active|rolled_back|finalized, grace_ends_at) with RLS +
      `rotations_read_via_tenant` policy (tenant-membership gated) +
      `idx_rotations_active` partial index WHERE state='active'.

    - `markos_webhook_fleet_metrics_v1` view — 48h rollup per (tenant_id,
      hour) with total/delivered/failed/retrying counts + avg_latency_ms
      over delivered rows. S1 hero source (D-04).

    - 3 rotation RPC stubs (`start_/rollback_/finalize_expired_webhook_rotation`)
      declared with `raise exception 'body ships in Plan 203-05'` — downstream
      plans reference signatures without waiting on Wave 3.

  - `supabase/migrations/rollback/72_*.rollback.sql` (37 LOC): reverse-order
    drops (functions → view → rotations table + policy + index → delivery
    indexes + FK + 4 cols → subscription constraint + 5 cols). All `if exists`.

  - New suites: `test/webhooks/ssrf-guard.test.js` (19 — 17 plan behaviors +
    BLOCKED_V4 + cidrContains sanity) + `test/webhooks/migration-72.test.js`
    (10 — 8 grep-shape + 2 live-pg skips when TEST_DATABASE_URL unset).
    Full webhook suite: **93/93 green + 2 skips** (no 200-03 or 203-01 regression).

  - Commits: `50e471a` (Task 1 RED) · `67b6ede` (Task 1 GREEN: SSRF lib +
    subscribe + dispatch wiring) · `dab27d8` (Task 2 RED) · `dc2a146` (Task 2
    GREEN: migration 72 + rollback + dispatch fall-through narrowing).

  - **Decisions:** (1) Literal IPs (e.g. `127.0.0.1`) fall through DNS
    short-circuit so errors carry the `:loopback` / `:private` / `:link-local`
    suffix callers rely on. (2) Dispatch-time SSRF only acts on known guard
    codes; DNS ENOTFOUND falls through (unresolvable hosts cannot SSRF).
    (3) Constraint idempotency via `do $$ ... pg_constraint $$` guards (PG's
    `alter table add constraint` has no `if not exists` clause pre-PG17).
    (4) `on delete set null` on `replayed_from` FK preserves replay audit
    trail even after parent deletion.

  - **Downstream unlocks:** 203-03 (DLQ) + 203-04 (Replay) + 203-05 (Rotation
    body-fill) + 203-07 (rps_override) + 203-09 (fleet-metrics view) all now
    have their schema substrate in place.

## Next step

Wave-1 complete. Proceed to Wave 2 (Plans 203-03 + 203-04 + 203-06) per
203-PLAN sequencing (DLQ + replay + rate-limit can run in parallel now
that schema + SSRF substrate is locked).

## What just happened (2026-04-18, Plan 202-10 close)

- **Plan 202-10 shipped** (final plan for Phase 202, Wave 5) — Claude Marketplace launch artifact set.
  - `.claude-plugin/marketplace.json` v1.0.0 → **v2.0.0**: 30-tool listing mirroring TOOL_DEFINITIONS,
    D-24 headline ("MCP-native marketing workbench. 30 tools. Claude-native by design."), D-21 pricing
    tiers (free: 30 read-only + $1/day; paid: all 30 + $100/day), `server.url` now
    `https://markos.dev/api/mcp`, `icon: /mcp-icon.png`, homepage + repository + categories.

  - `public/mcp-icon.png` — real 512x512 PNG (12561 bytes) via `sharp` + SVG source (solid
    teal #0d9488 + centered "MarkOS" wordmark). M3 enforced: no 1x1 fallback; task hard-fails
    if neither sharp nor canvas generator resolves.

  - `scripts/marketplace/`: validate-manifest.mjs (AJV + Anthropic schema URL + structural
    fallback), generate-icon.mjs (sharp-primary + canvas fallback + hard-fail), verify-icon.mjs
    (PNG IHDR dimension gate for CI), generate-tools-doc.mjs (one-shot codegen of docs/mcp-tools.md).

  - 5 docs shipped: `docs/mcp-tools.md` (30 auto-generated sections), `docs/vscode-mcp-setup.md`
    (D-08), `docs/oauth.md` (full PKCE + DCR curl walkthrough with RFC 7636/7591/7009/8414/8707/9728
    refs), `docs/mcp-redteam-checklist.md` (QA-11 manual checklist + D-31 Rolling Releases +
    D-19 observability alert), `docs/llms/phase-202-mcp.md` (LLM-friendly overview + 6 links).

  - `public/llms.txt` appended with `## Phase 202 — MCP Server GA` section (QA-15); Phase 201
    section preserved.

  - `scripts/load/mcp-smoke.mjs` — 60-concurrent × 60s k6-equivalent load harness (QA-07);
    gates p95 ≤ 300ms (D-18) + error_rate ≤ 1%; dry-run when `MARKOS_MCP_BEARER` unset.

  - `scripts/mcp/verify-cost-table.mjs` — manual Anthropic drift check vs MODEL_RATES; dry-run
    when `ANTHROPIC_API_KEY` unset.

  - `scripts/mcp/emit-kpi-digest.mjs` — pure-function module (`computeWeeklyKpi` + `sendDigest`
    with Resend email or console fallback); tracks D-23 (≥ 50 installs in 30 days).

  - `api/cron/mcp-kpi-digest.js` — Vercel cron wrapper, `MARKOS_MCP_CRON_SECRET`-gated
    (Plan 202-01 pattern mirrored).

  - `vercel.ts` — 5th cron entry `{ path: '/api/cron/mcp-kpi-digest', schedule: '0 9 * * 1' }`
    (Monday 9am UTC). Existing 4 crons preserved.

  - `contracts/openapi.json` regenerated: 85 paths / 59 flows (up from 69/51). F-89 OAuth (7 paths)
    + F-95 `/api/tenant/mcp/*` (4 paths) + F-71-v2 `/api/mcp/session` all merged.
    `test/openapi/openapi-build.test.js` extended with 3 Phase-202 path-coverage assertions.

  - 3 LLM eval suites with deterministic `fakeLLM` fixtures (QA-08 eval-as-test, CI-safe):
    plan-campaign-eval (4), draft-message-eval (4), audit-claim-eval (4).

  - 2 manifest/docs test suites: marketplace-manifest.test.js (14), docs-mirror.test.js (10).
    36 net-new assertions — all green. Full Phase 202 MCP regression: **362/362 green**
    (up from 326 at Plan 202-07 close).

  - Commits: `ffdbb60` (Task 1 RED) · `676e9b9` (Task 1 GREEN: marketplace + icon + validator)
    · `2e15c4e` (Task 2 RED) · `2456249` (Task 2 GREEN: 5 docs + llms.txt) · `257e0d9`
    (Task 3 RED) · `ff67ae2` (Task 3 GREEN: load smoke + cost verifier + KPI cron + openapi regen).

  - **Decisions:** (1) `sharp` chosen over `canvas` as primary icon generator — widely deployed
    on Vercel stacks; canvas remains fallback. (2) KPI digest module split: pure-function
    `emit-kpi-digest.mjs` + thin `api/cron/mcp-kpi-digest.js` wrapper — CLI-invocable +
    unit-testable. (3) Dry-run fallback everywhere: all scripts short-circuit with TODO when
    env absent — CI-safe without production secrets. (4) Pre-existing per-operation `tags:`
    missing on 35 openapi paths logged to `deferred-items.md` (scope boundary; plan-10 regen
    actually improved the failure count from 2 to 1).

  - **Phase 202 closes at 10/10 plans.** Claude Marketplace + VS Code cert submissions now
    deliverable. QA-06 (Playwright) deferred per plan 202-10 `<phase_level_notes>` — documented
    for `/gsd-verify-work` to treat as testing-infra-phase work.

## Next step

Run phase verification for 202:

```bash
/gsd-verify-phase 202
```

## What just happened (2026-04-18, earlier — Plan 202-07)

- **Plan 202-07 shipped** (parallel executor, Wave 4) — 20 net-new tool handlers + 4 F-contracts + codegen.
  - `lib/markos/mcp/tools/marketing/` +10 LLM handlers: `remix-draft.cjs` (Sonnet variants),
    `rank-draft-variants.cjs` (Haiku scorer), `brief-to-plan.cjs` (Sonnet expander),
    `generate-channel-copy.cjs` (Sonnet blocks), `expand-claim-evidence.cjs` (Sonnet + canon),
    `clone-persona-voice.cjs` (Sonnet), `generate-subject-lines.cjs` (Haiku 10 candidates),
    `optimize-cta.cjs` (Haiku alternatives), `generate-preview-text.cjs` (Haiku 5 candidates),
    `audit-claim-strict.cjs` (Sonnet forces >=1 evidence).

  - `lib/markos/mcp/tools/crm/` +5 handlers (4 simple reads wrapping `lib/markos/crm/*.cjs`
    + 1 LLM `summarize-deal.cjs` Haiku): list_crm_entities / query_crm_timeline /
    snapshot_pipeline / read_segment / summarize_deal. Every handler tenant-scoped (D-15)
    with graceful-degrade fallback when downstream CRM libs unavailable.

  - `lib/markos/mcp/tools/literacy/` +3 simple reads: `query-canon.cjs` (free-text),
    `explain-archetype.cjs` (pack slug lookup), `walk-taxonomy.cjs` (children/parents/siblings).

  - `lib/markos/mcp/tools/tenancy/` +2 READ-ONLY (D-01): `list-members.cjs`
    (markos_tenant_memberships, RLS migration 51), `query-audit.cjs` (markos_audit_log,
    F-88 read surface, RLS migration 82).

  - 4 F-contracts: **F-90** (18 marketing+execution tools — widened from plan's 11
    to include retained run_neuro_audit + research_audience + rank_execution_queue +
    schedule_post so every descriptor has a schema entry; Rule 2 correctness fix),
    **F-91** (5 crm), **F-92** (5 literacy: 2 retained + 3 new; explain_literacy.input
    anyOf reshaped to mirror properties in each branch for AJV strict compatibility —
    Rule 3 blocking fix), **F-93** (2 tenancy).

  - `scripts/openapi/build-mcp-schemas.mjs`: Node ESM codegen that walks F-90..F-93,
    resolves `$ref: "#/shared/..."` pointers, emits flat `{ tool_id: { input, output } }`
    JSON to `lib/markos/mcp/_generated/tool-schemas.json`. Consumed at `ajv.cjs` module
    load so strict AJV validators exist for all 30 tools at runtime (pipeline step 4a + 9).

  - `lib/markos/mcp/tools/index.cjs`: TOOL_DEFINITIONS expanded 10 → 30 (Phase 200 retained
    2 + Plan 202-06 wave-0 8 + Plan 202-07 net-new 20). listTools / invokeTool / getToolByName
    exports unchanged. **Only `schedule_post` remains mutating** — D-01 tenancy minimal.

  - New test suites: `marketing-net-new` (6) + `crm-net-new` (6) + `literacy-net-new` (4) +
    `tenancy-net-new` (4) = 20 parametric assertions. `test/mcp/server.test.js` +5 Plan-202-07
    tests (length===30, expected ids, mutating invariant, llm cost_model, registry coverage)
    with 3 stale `length===10` updated to `===30` (Rule 1 migration from 10-tool snapshot).

  - **Full MCP regression: 326/326 pass; Phase 201: 7/7 pass; all Plan 202-04/05/06 green.**
  - Commits: `7cc1b49` (Task 1 RED) · `e8f6dd3` (Task 1 GREEN marketing+F-90) · `59d72a7`
    (Task 2 RED) · `fd6d9ce` (Task 2 GREEN crm/literacy/tenancy+F-91..F-93) · `c22c729`
    (Task 3 RED) · `50252d2` (Task 3 GREEN codegen+index.cjs+server.test.js).

  - **Decisions:** (1) F-90 scope widened from 11 → 18 tools so every descriptor has a
    compiled validator at module load (Rule 2 — schemas are correctness requirement).
    (2) F-92 explain_literacy.input anyOf branches now carry properties metadata for
    AJV strictRequired compatibility (Rule 3 — blocking fix; without it, ajv.cjs throws
    at boot and every tools/call fails at pipeline step 9).
    (3) Codegen uses `js-yaml` (pre-existing dep) rather than the plan's specified
    `yaml` package — zero new deps added.

- **Plan 202-09 shipped** (parallel executor, Wave 4) — Surface S1 `/settings/mcp` + 4 tenant APIs.
  - 4 `/api/tenant/mcp/*` handlers: `usage.js` (rolling-24h spend vs cap + reset_at + plan_tier),
    `sessions/list.js` (token_hash NEVER echoed), `sessions/revoke.js` (cross_tenant_forbidden
    guard + `revokeSession` delegate with `reason='user_revoked_via_settings'`),
    `cost-breakdown.js` (markos_audit_log aggregation by `payload.tool_id` over last 24h,
    total_cost_cents desc + calls asc tie-break).

  - Surface S1 `app/(markos)/settings/mcp/page.tsx` + `.module.css`: at-cap `role="alert"`
    banner (#fef3c7/#d97706/#78350f), usage card (h1 "MCP server" Sora 28px + `role="meter"`
    cost meter + reset timer + Refresh), top-tools list (clickable filter chips), sessions
    `<table>` with `<caption>` + scope="col" + per-row Revoke, breakdown `<details>`
    (filterable), revoke confirm native `<dialog>` (destructive #9a3412 filled + neutral
    Cancel), toast `role="status" aria-live="polite"` with 200ms slide-in. 30s auto-refresh
    on usage + sessions; breakdown manual. Every CSS class traces to Phase 201 ancestor
    (sessions/members/danger).

  - `contracts/F-95-mcp-cost-budget-v1.yaml`: 4 paths + 402 `budget_exhausted` -32001 envelope;
    cross-references Plan 202-03 cost-meter for enforcement path.

  - New suites: `test/mcp/mcp-usage-api.test.js` (12 handler cases) +
    `test/mcp/mcp-settings-ui-a11y.test.js` (15 UI grep-shape + token cases).
    27/27 green. Full MCP suite (Wave-1 + Wave-2 + Wave-3 + Wave-4) **277/277 green**.

  - Commits: e679c7b (Task 1 RED) · c3857d8 (Task 1 GREEN + F-95) · 15dc6cc (Task 2 RED) ·
    b6fbe2d (Task 2 GREEN).

  - **Decisions:** (1) Secondary sort by calls ASC on cost-breakdown total-cost tie (higher
    cost-per-call is the more informative signal; dictated by plan's own test).
    (2) `/api/tenant/mcp/sessions/revoke` hardens cross-tenant with SELECT before UPDATE →
    403 cross_tenant_forbidden (T-202-09-01 mitigation). (3) org_id optional on /usage with
    fail-safe to plan_tier='free' (lowest cap) — prevents 401 cascade while preserving
    tenant_id as authoritative scope.

- **Plan 202-05 shipped** (parallel executor, Wave 3) — MCP observability + Bearer envelope ready.
  - `lib/markos/mcp/log-drain.cjs` + `.ts` dual-export: `emitLogLine` D-30 shape
    `{ domain:'mcp', req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents,
    error_code, timestamp }` with null coercion + JSON.stringify-safe round-trip.

  - `lib/markos/mcp/sentry.cjs` + `.ts` dual-export: `captureToolError` + `setupSentryContext`
    with lazy `@sentry/nextjs` import behind `SENTRY_DSN` gate; triple-safety (env-gated,
    try/catch import, try/catch captureException); dep-injectable via `deps.sentry`;
    `_internalResetForTests` for suite isolation.

  - `sentry.server.config.ts` — `Sentry.init({ dsn, tracesSampleRate: 0.1, environment: VERCEL_ENV, release: VERCEL_GIT_COMMIT_SHA })`.
  - `instrumentation.ts` — `register()` hook dynamic-imports sentry.server.config under
    `NEXT_RUNTIME === 'nodejs' && SENTRY_DSN`; `onRequestError` forwards to `captureRequestError`.

  - `next.config.ts` — `withSentryConfig(nextConfig, { org:'markos', project:'markos-web', silent: !CI })`.
  - `lib/markos/mcp/server.cjs`: `SERVER_INFO.version` bumped 1.0.0 → **2.0.0** (marketplace v2
    alignment); added `runToolCallThroughPipeline` (sole dispatch path into Plan 202-04 pipeline)

    + `buildToolRegistryFromDefinitions` adapter. Additive merge with Plan 202-08's
    `listResources/listResourceTemplates/readResource/subscribeResource/unsubscribeResource`.

  - `api/mcp/session.js`: `mcp-req-<uuid>` (D-29) at every entry; `extractBearer` regex;
    `WWW-Authenticate: Bearer resource_metadata="https://markos.dev/.well-known/oauth-protected-resource"`
    on 401 (MCP 2025-06-18 + Marketplace cert); `tools/call` routed through pipeline;
    `capabilities.resources: { subscribe: true, listChanged: false }` advertised at initialize;
    `safeListResources` falls back to `listResourceTemplates()` for marketplace discovery.

  - `lib/markos/mcp/pipeline.cjs`: finally block calls `emitLogLine` (replaces console.log
    placeholder); catch block calls `captureToolError` on thrown exceptions; finally block also
    fires `captureToolError` for `output_schema_violation` (non-throwing server-error path).

  - `package.json`: `@sentry/nextjs ^10.49.0` (latest stable via `npm view`).
  - New suite: `test/mcp/observability.test.js` (9 tests — D-30 shape, null coercion, graceful
    degrade, tags/extra correctness, config-file greps). `server.test.js` extended +8 Plan 202-05
    tests (v2 bump, req_id echo, Bearer gating, WWW-Authenticate, pipeline delegation).

  - **49/49 green** across observability + server + pipeline; Wave-1 regression **106/106**;
    Phase 201 regression **25/25**; full Phase 202 suite **178/178**.

  - Commits: ebb0440 (RED obs) · bd27f6e (GREEN obs + Sentry init + package.json) · 4aecab5
    (RED server ext) · 8279cb5 (GREEN pipeline + server v2 + session Bearer).

  - **Decisions:** (1) Triple-safety on Sentry (DSN env gate + lazy import try/catch + captureException try/catch)
    — captureToolError never throws. (2) req_id is server-generated via randomUUID; client `_meta.req_id` ignored
    (T-202-05-10). (3) Additive parallel-wave composition — sibling 202-06 (list_pain_points) and 202-08
    (resources + notifications/initialized) merged via targeted Edits, not rewrites.

- **Plan 202-02 shipped** (parallel executor, Wave 2) — OAuth 2.1 + PKCE + Surface S2 ready.
  - `lib/markos/mcp/oauth.cjs` + `.ts` dual-export: `AUTH_CODE_TTL_SECONDS=60`,
    `issueAuthorizationCode` (Redis `SET NX EX60` + `randomBytes(32)` hex),
    `consumeAuthorizationCode` (GETDEL one-time), `verifyPKCE` (RFC 7636 length
    gate + `timingSafeEqual`), `generateDCRClient` (`mcp-cli-<hex32>`),
    `isAllowedRedirect` whitelist (https/loopback/vscode.dev/claude.ai).

  - 7 endpoints: `/.well-known/oauth-protected-resource` (RFC 9728),
    `/.well-known/oauth-authorization-server` (RFC 8414 S256-only), `/oauth/register`
    (RFC 7591 DCR), `/oauth/authorize` (302 /login or /oauth/consent),
    `/oauth/authorize/approve` (listTenantsForUser + D-07 tenant-bind +
    `issueAuthorizationCode`), `/oauth/token` (PKCE + RFC 8707 exact-match +
    `createSession` → Bearer 86400s; zero `refresh_token` per D-06), `/oauth/revoke`
    (RFC 7009 anti-probing always-200 for authenticated actor + `revokeSession`).

  - Surface S2 `app/(markos)/oauth/consent/page.tsx` + `.module.css`: Sora 28px
    heading, scope chips, multi-tenant fieldset/legend picker, Approve/Deny, `What
    is MCP?` details, `role="alert"` errors, 44px tap targets, prefers-reduced-motion.

  - `contracts/F-89-mcp-oauth-v1.yaml`: 7 paths + RFC 7636/7591/8414/9728/8707/7009
    references; mirrors F-71 YAML shape.

  - New suites: `test/mcp/oauth.test.js` (47) + `test/mcp/consent-ui-a11y.test.js` (14).
    61/61 green. Wave-1 regression 66/66 green. Phase 201 regression 25/25 green.

  - Commits: b3a6cfa (RED 1+2) · d58d08a (Task 1 GREEN) · 4021bee (Task 2 GREEN)
    · fc9ff52 (Task 3 RED) · c2ab450 (Task 3 GREEN).

  - **Decisions:** (1) Triple-gate S256 enforcement prevents PKCE downgrade at 3
    independent layers. (2) No refresh tokens (D-06) removes leak surface entirely.
    (3) RFC 7009 anti-probing: 401 anon, 200 auth regardless of token validity.

- **Plan 202-01 shipped** (parallel executor) — MCP session substrate ready.
  - Migration 88 (`markos_mcp_sessions`, opaque-token hash + 24h rolling TTL + RLS) + migration 89
    (`markos_mcp_cost_window` + atomic `check_and_charge_mcp_budget` plpgsql fn) with rollbacks.

  - `lib/markos/mcp/sessions.cjs` + `.ts` dual-export: hashToken, createSession (tenant-status guard),
    lookupSession (timingSafeEqual + token_hash strip), touchSession (24h extend), revokeSession
    (audit emit), listSessionsFor{Tenant,User}.

  - `api/mcp/session/cleanup.js` shared-secret cron + `vercel.ts` 4th cron entry at `0 */6 * * *`
    (preserves 201-02 drain · 201-07 purge · 201-03 signup cleanup).

  - Rule 3 blocking fix: `AUDIT_SOURCE_DOMAINS` extended 11 → 12 entries (`mcp`). writer.cjs +
    writer.ts + hash-chain.test.js locked-list regression updated in lockstep.

  - New suites: `test/mcp/session.test.js` (21) + `test/mcp/rls.test.js` (6) +
    `test/mcp/migration-idempotency.test.js` (4). 30/30 green. Phase 201 regression: 25/25 green.

  - Commits: b7ab22e (migrations) · 9e478c8 (audit whitelist) · 118f559 (sessions library) ·
    77e8d10 (cleanup cron).

## What just happened (2026-04-17)

- **Plan 201-08 shipped** — consolidation wave closed.
  - Cross-domain audit emitters wired: webhooks/engine.cjs + api/approve.js + api/submit.js.
  - F-88 tenant-audit-query contract + `api/tenant/audit/list.js` handler (tenant-admin read-only).
  - `contracts/openapi.json` regenerated (51 flows, 69 paths; all 14 phase-201 paths present).
  - 5 docs pages shipped: routing, admin, tenancy-lifecycle, gdpr-export, llms/phase-201-tenancy.
  - `public/llms.txt` appended with "Phase 201 — Tenancy" section (5 entries).
  - `vercel.ts` cron registry: audit/drain, lifecycle/purge-cron, cleanup-unverified-signups.
  - `@vercel/edge-config` ^1.4.3 added; `lib/markos/tenant/slug-cache.{cjs,ts}` read-through in
    middleware + write-through from `lib/markos/orgs/tenants.{cjs,ts}` and
    `switcher.createTenantInOrg`. Fulfils T-201-05-06 Plan 05 threat-model promise.

  - 4 new test suites: `audit-emitter-wiring`, `openapi-merge`, `docs-mirror`, `slug-cache` (21 tests).
  - Full phase-201 suite: **122/122 pass**. Auth + webhooks regression: **60/60 pass**.
  - Commits: 9f9b58e, aae5467, 1b148b3, cf7c84b, dc820e4, e6bcbf2, 3c5a9fd.

## Next step

Run phase verification for 201:

```bash
/gsd-verify-phase 201
```

After verification clears, proceed to Phase 202 per ROADMAP.

---

## Prior position (2026-04-16 · still-relevant context)

Phase: 201 (saas-tenancy-hardening)
Plan: 1 of 8
**Milestone:** v4.0.0 — SaaS Readiness 1.0 — active
**Phase:** 213.5
**Quality Baseline:** 15 gates defined in `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`; inherited by every subsequent phase.

## What just happened (2026-04-16)

- v3.9.0 closure reconciled: phase 110 SUMMARY.md files written for all 4 plans (110-01…110-04), ROADMAP.md checkmarks + milestone status updated to complete, v3.9.0-MILESTONE-AUDIT.md passed.
- v3.9.0 ROADMAP section archived to `.planning/milestones/v3.9.0-ROADMAP.md`.
- v4.0.0 milestone opened with 7 phases (200–206) and 8 atomic plans scoped under phase 200 (wave-0).
- `obsidian/thinking/2026-04-16-markos-saas-roadmap.md` is the authoritative synthesis.

## Next step

Execute remaining plans in phase 200 wave-0 (parallel execution in progress):

**Wave 1 (parallel):** 200-01 (OpenAPI), 200-03 (Webhooks), 200-04 (Presets), 200-05 (llms.txt)

200-01 status: **Files written, awaiting git commit** (git write ops blocked in parallel agent; see SUMMARY.md)

After Wave 1 commits are applied:

- Wave 2: 200-02 (CLI generate), 200-06 (MCP server), 200-07 (SDK CI)
- Wave 3: 200-08 (Claude Marketplace landing)

```bash
/gsd-execute-phase 200
```

## Open questions

None — Q-A / Q-B / Q-C answered on 2026-04-16. See `obsidian/brain/Target ICP.md` + `obsidian/brain/Brand Stance.md` + Nango embedded connector posture.

## Accumulated Context (v4.0.0 theme)

- Mission: public SaaS launch · API-first · MCP-native · agent-marketplace-friendly · Claude Marketplace distribution priority.
- Target ICP: seed-to-A B2B SaaS + modern DTC + solopreneurs (incl. vibe-coders).
- Brand stance: developer-native · AI-first · quietly confident.
- Connector framework: Nango embedded (from phase 210).
- Monetization: superseded by Pricing Engine Canon. Treat platform fee, metered AI, and BYOK discount as historical candidate inputs only; use `{{MARKOS_PRICING_ENGINE_PENDING}}` until approved PricingRecommendation records exist.
- Compliance: SOC 2 Type I 6mo · Type II + ISO 27001 Y2 · HIPAA opt-in.
- Residency: US-East → US + EU → APAC.
- Autonomy: tiered, earn-trust per mutation family.
- Marketplace: plugins + agents with revenue share (70/30); moderated.
- Quality-first day-0 investment ratified — 80% foundations, 20% feature scope for wave-0.

### Roadmap Evolution

- Phase 213.5 inserted after Phase 213 (2026-04-29): marketing claude-landing + demo sandbox to DESIGN.md tokens — closes Phase 200 retroactive UI debt (URGENT). Phase 200-08 shipped marketing landing surfaces (`app/(marketing)/integrations/claude/page.tsx` + `demo/page.tsx`) with orphan class names (`.btn`, `.btn-primary`, `.hero`, `.tool-grid`) = unstyled semantic HTML. 13 tests pass (structure + a11y + voice 100/100) but no visual rendering verified. Customer-facing Claude Marketplace listing → bad first impression. 200-UI-SPEC.md (commits 76406d8 + f0c1006) documents debt: D-01 orphan classes, D-04/D-05 raw error passthrough, 7-size + 3-weight typography exceeds rule (canon tokens but unconsolidated). Phase 213.5 redesigns both surfaces to DESIGN.md v1.1.0 canon (Kernel Black surface, Protocol Mint signal, JetBrains Mono headings, Inter body, `.c-*` primitive composition, bracketed-glyph state coding, no gradients, no drop-shadows, banned-lexicon = 0). Same posture as 213.1–213.4. Mirrors 213.x precedent: discuss → ui-phase → plan → execute → verify → ui-review.
- Phase 204.1 inserted after Phase 204: close 5 fixes + Bonus Gap #3/#4 (decision needed) + winget/apt distribution (URGENT — UI-REVIEW d9ede52: 17/24, P0 audit trail wiring, P1 spinner primitive + stderr stream, P2 ASCII fallback + width breakpoint, mask-rule decision)
- Phases 213.1–213.4 inserted after Phase 213 (2026-04-27): UI Canon Adoption — bridges v4.0.0 → v4.1.0 SaaS Suite. Driven by DESIGN.md (canonical visual contract) landing alongside generated artifacts (`tokens/tokens.json`, `tailwind.config.ts`, `app/tokens.css`, `app/globals.css`, `styles/components.css`, `tokens/index.ts`). Existing 21 `*.module.css` files (4,867 LOC, 704 inline hex matches) implement contradictory design system (light bg `#f8fbfd`, teal `#0d9488`, Sora/Space Grotesk, 28px radii, gradients, drop shadows) that violates DESIGN.md (dark Kernel Black `#0A0E14` / Protocol Mint `#00D9A3` / JetBrains Mono+Inter / 8px grid / borders over shadows / flat). Per CLAUDE.md drift rule, this is a **redesign**, not a port. Each wave: `/gsd-ui-phase` → UI-SPEC.md citing DESIGN.md tokens by name → `/gsd-execute-phase` → `/gsd-ui-review` 6-pillar audit (Pillar 1 Tokens auto-FAILs on any inline hex/px or off-grid value). Wave 1 (213.1): chrome — `app/(markos)/layout-shell.module.css` + `_components/RotationGraceBanner.module.css`. Wave 2 (213.2): auth — `login` + `signup` + `invite/[token]` + `oauth/consent`. Wave 3 (213.3): `settings/*` — billing, members, sessions, domain, danger, mcp, plugins, webhooks (8 files). Wave 4 (213.4): `admin/billing` + `admin/governance` + `operations/*` + `status/webhooks` + `404-workspace`. Acceptance per phase: zero inline hex matches in scoped files, zero off-grid spacing, composes `.c-*` primitives where applicable, WCAG 2.1 AA min/AAA on body+primary, focus rings 2px solid #00D9A3 + 2px offset, prefers-reduced-motion respected.

## Carry-over context from v3.9.0

- Plugin runtime (`lib/markos/packs/pack-loader.cjs`) + pack diagnostics are stable and ready to extend.
- 13-connector set locked: Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · PostHog · Linear · Supabase.
- 7 business-model packs + 4 industry overlays shipped v3.9.0.
- Test baseline: 301 tests · 257 pass · 44 fail — preserved; any regression blocks phase close.

## References

- Roadmap (full): `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- Phase 200: `.planning/phases/200-saas-readiness-wave-0/` (DISCUSS.md · PLAN.md · QUALITY-BASELINE.md)
- Phases 201–206: `.planning/phases/201-*/DISCUSS.md` through `.planning/phases/206-*/DISCUSS.md`
- Canon: `obsidian/brain/MarkOS Canon.md` · `Agent Registry.md` · `Target ICP.md` · `Brand Stance.md`
- Quality gates: `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`
