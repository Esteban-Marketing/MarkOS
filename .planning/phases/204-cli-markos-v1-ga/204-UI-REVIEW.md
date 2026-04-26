---
phase: 204
slug: cli-markos-v1-ga
domain: cli-terminal-ux
audited: 2026-04-25
auditor: gsd-ui-auditor
baseline: 204-UI-SPEC.md (locked design contract, draft 2026-04-25)
screenshots: not-captured (CLI phase — terminal output reviewed via source)
overall_score: 17/24
auditor_confidence: high
---

# Phase 204 — UI Review (CLI `markos` v1 GA)

**Audited:** 2026-04-25
**Baseline:** `204-UI-SPEC.md` (just-locked design contract; CLI-domain adaptation of the standard 6-pillar UX rubric)
**Domain:** CLI terminal UX (no web frontend; screenshots N/A)
**Source under audit:** `bin/lib/cli/*.cjs` (8 primitives) + `bin/commands/*.cjs` (10 command files; `generate` lives at `bin/generate.cjs`).

This audit validates the as-built CLI against the contract codified in
`204-UI-SPEC.md`. The UI-SPEC was written *after* implementation and is best
read as a forward-locked contract rather than a back-pressure spec — so the
audit's job is to (a) confirm tokens match, (b) close the 3 audit gaps the
checker flagged, and (c) flag systemic gaps the spec papered over.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Caveman voice + error envelope honored; pricing-placeholder grep enforces correctly via `doctor`; minor terseness drift in success lines (`✓ Logged in (profile: …)` is too long). |
| 2. Visuals | 2/4 | UTF-8 box chars used in 5 places (`errors.cjs`, `whoami`, `status`, `doctor`, init banner) with **zero ASCII fallback detection**; no spinner primitive; no progress bar primitive. Audit Gaps #1 + #2 are OPEN. |
| 3. Color | 4/4 | ANSI palette token-for-token matches UI-SPEC; `shouldUseColor()` + `NO_COLOR` honored; status dual-encoded everywhere (icon + word + color); no forbidden BLUE/MAGENTA/256-color codes. |
| 4. Typography | 3/4 | Monospace roles + casing rules matched (SCREAMING_SNAKE error codes; lowercase hints; UPPERCASE `WDJB-MJHT` user_code). Width breakpoints (<60 / 60–100 / >100 cols) **not implemented** — `renderTable` ignores `process.stdout.columns`. Audit Gap #5 OPEN. |
| 5. Spacing | 4/4 | `pad-cell=2` (output.cjs:92); `pad-eof` final-`\n` consistently emitted; banner pad (1 blank above/below) honored; no tabs anywhere; no trailing whitespace. |
| 6. Experience Design | 1/4 | Five systemic gaps: (a) audit trail (D-04) NOT wired in any command — zero `emitAuditSafe`/`enqueueAuditStaging` calls under `bin/commands/`; (b) no spinner primitive — every command's stated "spinner: …" loading-state copy in UI-SPEC §Loading/Empty/Error matrix is **vapor**; (c) success lines like `Run submitted: …`, `Pulled N entries`, `Pushed N entries`, `Deleted env key …`, `Aborted.` go to **stdout** instead of stderr (violates §Streams contract — corrupts piped JSON consumers); (d) no `pricing_engine_context` or `{{MARKOS_PRICING_ENGINE_PENDING}}` surfacing in `markos status` plan-tier copy (only the `doctor` check enforces it on docs); (e) login success message is on stdout but the spec puts results-only on stdout with progress on stderr — login is interactive, the success line is more progress than result. |

**Overall: 17 / 24**

---

## Top 5 Priority Fixes

1. **Wire audit trail into every command** *(EXP-DESIGN, P0, ~3h)* — D-04 in `204-CONTEXT.md` mandates `every command writes audit row`. Grep of `bin/commands/` for `emitAuditSafe|enqueueAuditStaging|audit_log` returns **zero matches**. The primitive exists (`lib/markos/cli/env.cjs:79` shows the canonical pattern: `enqueueAuditStaging(client, entry)`), but commands call HTTP endpoints whose server-side audit writes are out of CLI scope. Fix: add a CLI-side `bin/lib/cli/audit.cjs` primitive that posts a minimal `{command, args_redacted, profile, exit_code}` row to a tenant audit endpoint after each command, OR explicitly accept the design that "all CLI audit writes happen server-side at the API layer" and update D-04's wording in CONTEXT.md to reflect that. Right now the contract is unverifiable.

2. **Build the spinner primitive — `bin/lib/cli/spinner.cjs`** *(VISUALS, P1, ~1h)* — UI-SPEC Component 5 + the entire §Loading/Empty/Error State Matrix promise spinners (`⠋ submitting:`, `⠋ polling`, `⠋ fetching keys`, etc.). Glob of `bin/lib/cli/` returns 8 files; spinner is missing. Every command currently submits a request and prints nothing until the response arrives. Implementation: ~30 LOC braille-frame ticker on stderr, gated by `shouldUseColor + isTTY + !shouldUseJson`. Wire into `keys.list`, `whoami`, `env.list/pull/push`, `status`, `run` (pre-SSE submit), `login` (poll loop). Audit Gap #2 is currently OPEN.

3. **Move success messages to stderr (or split result-vs-progress)** *(EXP-DESIGN, P1, ~45min)* — `keys.cjs:246` writes `Key … revoked.` to stdout; `env.cjs:242,306,378` writes "Pulled/Pushed/Deleted" success lines to stdout; `login.cjs:49` writes `✓ Logged in …` to stdout. Per UI-SPEC §Verbosity Tiers + §Streams, **stdout is reserved for command results (table or JSON)**, stderr is for progress + status. A user piping `markos env push --json | jq` is fine because the JSON branch emits structured output, but the human-mode branch writes prose to stdout — the streams aren't symmetric. Fix: move the `\n  Pulled N entries → … \n` style lines to `process.stderr.write` for human mode; keep `renderJson(...)` on stdout. Same for `keys revoke`, `env delete`, `env push`, `login` success.

4. **Add ASCII fallback to box-drawing primitives** *(VISUALS, P2, ~1h)* — UI-SPEC §Token Layer 3 mandates Unicode/ASCII tier with `LANG=C` detection. `errors.cjs:56-58` (`┌── `, `│ `, `└── `), `whoami.cjs:80,86,89`, `status.cjs:178,181,183`, `doctor.cjs:52,70` all hard-code U+2500-range box chars. cmd.exe legacy users on `chcp 437` will see mojibake. Implementation: add `pickGlyphs()` to `output.cjs` returning `{ topLeft, topRight, vert, horiz, … }` based on `process.env.LANG` + `process.platform !== 'win32'`. Audit Gap #1 is currently OPEN.

5. **Implement `<60 col` width breakpoint in `renderTable`** *(TYPOGRAPHY, P2, ~1h)* — UI-SPEC §Typography mandates: "<60 cols (narrow / mobile SSH): drop low-priority columns; multi-line key:value layout instead of table." Current `output.cjs::renderTable` (lines 67-113) computes per-column width from header + cells but never reads `process.stdout.columns`. On a 50-column SSH window the `markos keys list` table (id + name + key_fingerprint + scope + created_at + last_used_at = 6 columns) wraps unreadably. Fix: detect `process.stdout.columns < 60`, switch to vertical key:value rendering (one entity per record, blank line between). Audit Gap #5 is currently OPEN.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**What's right (evidence-cited):**
- Error envelope contract honored in `errors.cjs:39-71` — `{error, message, hint, retry_after_seconds}` shape matches UI-SPEC §Component 4 exactly.
- ERROR_TO_EXIT mapping at `errors.cjs:11-30` is **token-for-token identical** to UI-SPEC §Exit Code Contract. Every code in the matrix (UNAUTHORIZED, NO_TOKEN, TOKEN_EXPIRED → 3; FORBIDDEN, RATE_LIMITED, QUOTA_EXCEEDED → 4; etc.) is present.
- Caveman mode markers detected:
  - `keys.cjs:218`: `Revoke key ${key_id}? This cannot be undone. [y/N] ` — terse, capital N default, no marketing fluff.
  - `env.cjs:350`: `Delete env key "${key}"? This cannot be undone. [y/N] ` — same pattern.
  - `whoami.cjs:111`: `Session expired.` — sentence fragment, imperative.
  - `login.cjs:175`: `Login expired before approval.` — terse, no articles.
- Empty-state strings:
  - `output.cjs:70-73`: `(no rows)` — DIM, terse, period. Matches §Component 2 Empty state.
  - `keys.cjs:125`: `(no API keys)` — close to spec's `(no api keys)` but **case differs**; spec says lowercase.
  - `env.cjs:139`: `(no env entries)` — spec says `(no env vars)`. Minor copy drift.
- No emoji in any error path. Grep for `🎉🚀✨🎊👍🔥💡⚡` against `bin/commands/` returns zero. ✓ caveman mode.
- No marketing copy — grep for `Welcome to MarkOS|Welcome!|Get started|Congrats` returns zero. ✓.

**What's wrong:**
- `login.cjs:49`: `✓ Logged in (profile: ${profile}, mode: ${mode})` — spec says `✓ logged in as <tenant_name> (<tenant_id>)`. The implementation surfaces *profile + mode* (auth concern) instead of *tenant identity* (operator concern). Login confirms an identity; users want to see "you are now ten_abc123" not "you used token-paste mode."
- `login.cjs:79`: `Go to: ${envelope.verification_uri}` + `Code:  ${envelope.user_code}` — UI-SPEC Component 8 specifies a **boxed code-display** (`╔═══╗ ║ WDJB-MJHT ║ ╚═══╝`). Current implementation prints two flat lines with two-space indent. The box is missing. Both UTF-8 and ASCII tiers are absent.
- `whoami.cjs:62`: `(session — no API key)` — uses em-dash; some legacy terminals render as `?`. Caveman style would prefer `(session, no api key)` plain.
- Empty-state collection-specific copy mismatches §Copywriting Contract:
  - `keys list` empty: spec wants `(no api keys) + hint 'create one with markos keys create'`. Implementation only emits `(no API keys)` with **no hint**.
  - `env list` empty: spec wants `(no env vars)`. Implementation emits `(no env entries)`.
  - `status` no recent runs: spec wants `(no recent runs)`. Implementation: `status.cjs:230` emits `(none)` inside the panel — wrong copy.
- `run.cjs:276`: `Run submitted: ${run_id}` — informational, but stdout (see Top Fix #3).

**Pricing placeholder enforcement (Audit Gap #3):**
- Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` IS present in:
  - `bin/lib/cli/doctor-checks.cjs:553,573,594` — the `pricing_placeholder_policy` doctor check correctly enforces it on `docs/{pricing,commands,environment,errors}.md` + `README.md`.
  - `lib/markos/cli/runs.cjs:58` — `PRICING_PLACEHOLDER_SENTINEL` constant exported and used in v2 payload `pricing_engine_context` field per VERIFICATION.md §Cross-Phase Integration.
- Sentinel is **NOT** present in `bin/commands/status.cjs` plan-tier rendering. `status.cjs:189` emits `Plan: ${subscription.plan_tier || '—'}` — when the server returns `plan_tier='pro'`, the CLI prints `Plan: pro` with no pricing-engine handoff context. UI-SPEC §Copywriting Contract `Pricing-sensitive output` explicitly calls out `markos status plan/tier display` as a placeholder consumer. **PARTIAL CLOSURE** — sentinel exists but isn't rendered into status output.

### Pillar 2: Visuals (2/4)

**What's right:**
- 9 components defined in UI-SPEC; 7 are at least partially implemented:
  - Component 2 Table: `output.cjs::renderTable` ✓
  - Component 3 Status Line: `whoami.cjs::renderBox` + `status.cjs::renderBoxPanel` + `doctor.cjs::renderDashboard` ✓
  - Component 4 Error Box: `errors.cjs::formatError` ✓ (3-line shape correct)
  - Component 6 Progress Bar: `status.cjs::progressBar` (lines 136-147) — but **only used inside status panels**, not as a general-purpose primitive
  - Component 7 Confirm Prompt: `keys.cjs::promptYesNo` + `env.cjs::promptYesNo` ✓
  - Component 1 Banner: `doctor.cjs:52` `┌─ markos doctor ─...─┐` ✓ partial (no separate primitive)
- Status icons match §Color Contract (`doctor.cjs:27-32`): `✓` / `⚠` / `✗` / `·` correct UTF-8.
- Color dual-encoding works — `doctor.cjs:57` pairs icon with `paint(icon, colorFor(status))` so removing color leaves the icon.

**What's wrong (Audit Gaps #1 + #2 OPEN):**
- **No `bin/lib/cli/spinner.cjs`** (Component 5). Glob confirms only 8 files in `bin/lib/cli/`: `keychain, config, http, output, errors, open-browser, sse, doctor-checks`. Every "spinner: …" line in UI-SPEC §Loading/Empty/Error State Matrix (16 mentions) is unimplemented. **AUDIT GAP #2: OPEN.**
- **No ASCII fallback for box-drawing**. Grep for `[┌└│─═║]` finds 16 files using these glyphs; none branch on `process.env.LANG` or platform. Specific failure points:
  - `errors.cjs:56` `┌── ` (the very first thing a Windows cmd.exe user sees on any error)
  - `whoami.cjs:80,86,89` whole boxed identity panel
  - `status.cjs:178,181,183` all 4 dashboard panels
  - `doctor.cjs:52,60,70` whole dashboard frame
  - `run.cjs:163` `» ` U+00BB right guillemet
  **AUDIT GAP #1: OPEN.**
- **No `markos init` welcome banner**. `init.cjs` is a thin spawn() wrapper around `bin/install.cjs`; it doesn't emit the spec's `MarkOS doctor`-style banner before delegating. The installer produces its own banner (`bin/cli-runtime.cjs:29-32` uses unicode `━` chars without ASCII fallback either) but that's the install banner, not the init banner.
- **No `markos login` code-display box** (Component 8). Spec mandates a boxed `╔═══╗ ║ WDJB-MJHT ║ ╚═══╝` rendering of the user_code; `login.cjs:79-81` prints flat lines.
- **No `markos keys create` one-time-secret box**. Spec mandates: "shows the raw key ONCE in a code-display box with hint `hint: store this key now…`". `keys.cjs:160-167` prints flat indented lines with a `!` warning prefix — no box, no `hint:` prefix.
- `run.cjs:163` uses `»` (U+00BB) for snapshot icon — not declared in UI-SPEC §Token Layer 3 status icons (which lists `✓` `✗` `⚠` `•` `→`). Out-of-vocab glyph.

### Pillar 3: Color (4/4)

**What's right (evidence-cited):**
- ANSI palette in `output.cjs:25-33` is **token-for-token identical** to UI-SPEC §Token Layer 1. RESET, BOLD, DIM, CYAN, GREEN, YELLOW, RED. No BLUE, no MAGENTA, no BG_*, no 256-color.
- `shouldUseColor()` (`output.cjs:43-48`): correctly checks `process.stdout.isTTY`, `NO_COLOR`, and `--json` / `--format=json`. Implementation matches §Token Layer 2 Suppression Matrix exactly.
- `shouldUseJson()` (`output.cjs:35-41`): non-TTY → JSON ✓; `NO_COLOR` → JSON ✓ (per the suppression matrix's pragmatic call); `--json` → JSON ✓.
- Direct ANSI escape audit: grep for `\x1b\[` against `bin/commands/` returns **only one match**: `status.cjs:398` `'\x1b[2J\x1b[H'` (clear-screen sequence for `--watch`). This is acceptable — clear-screen is not a styling code (it's a cursor/screen control) and there's no token in the ANSI map for it. All semantic color routing goes through `output.cjs::ANSI`. ✓
- 60/30/10 split honored — checked across status panels:
  - 60% terminal-default for body data (subscription value, quota numbers, run IDs)
  - 30% DIM for separators, labels (`status.cjs:202` `labelCell.padEnd(11)` then DIM hint), `'(none)'` empty markers
  - 10% accent: GREEN for `✓`, YELLOW for `⚠`/`t-7`, RED for `✗`/`t-0`/quota-overage
- Color-blind safety: status dual-encoded everywhere checked. `doctor.cjs:57-67` pairs `ICON[c.status]` with color *and* the prefixed icon. `status.cjs:151-153` colorizes rotation stage but the stage string itself remains visible (`t-7`, `t-0`). `run.cjs:160-165` pairs check-mark with color.

**Minor:**
- `run.cjs:188-190`: `run.completed` status colorization uses ternary `status === 'success' ? GREEN : RED` — `cancelled` gets RED, but spec implies `cancelled` should be DIM/skipped color. Tiny issue.

### Pillar 4: Typography (3/4)

**What's right:**
- Error codes SCREAMING_SNAKE_CASE: `INVALID_BRIEF`, `UNAUTHORIZED`, `NETWORK_ERROR`, `QUOTA_EXCEEDED`, etc. Verified by `errors.cjs:11-30` mapping table.
- Hints lowercase: `keys.cjs:79` `'Only tenant owners/admins can manage API keys.'` — sentence-case (close enough; spec says lowercase but is forgiving).
- `markos login` user_code rendered UPPERCASE-DIGITS (server-side format `WDJB-MJHT`, CLI passes through verbatim at `login.cjs:80`).
- Timestamps mostly DIM — `whoami.cjs:57` uses `ANSI.DIM` for labels, ISO 8601 timestamps come from server unchanged.
- Table header CYAN+BOLD: `output.cjs:96-98` `ANSI.BOLD + ANSI.CYAN + text + ANSI.RESET`. Matches §Typography role table.

**What's wrong (Audit Gap #5 OPEN):**
- **Width breakpoints not implemented**. UI-SPEC §Typography mandates 3 tiers based on `process.stdout.columns`:
  - <60 cols: drop low-priority columns, key:value layout
  - 60–100 cols: full table unwrapped
  - >100 cols: full UUIDs + full timestamps
- `output.cjs::renderTable` (lines 67-113) computes widths from header + cell content only. Never reads `process.stdout.columns`. On a 40-col terminal a row like `key_xyz_abc123  cli-deploy-key  sha256:8a2f3b1c  cli  2026-04-23T09:21:00Z  2d ago` will spill past the right edge and either wrap mid-cell (breaks visual alignment) or force horizontal scroll.
- `padCell` (lines 56-60) pads to the *content-derived* width, not the *terminal-relative* width. There's no truncation, no ellipsis, no responsive collapse.
- **AUDIT GAP #5: OPEN.**

**Minor:**
- Inconsistent table separator: `output.cjs:102` uses `-` repeated; `plan.cjs:75` uses `----` literal in row data; `eval.cjs:93` uses `---------`/`-----`. Three different separator conventions for what is conceptually the same component. Spec is silent on this so not a strict violation, but readability suffers.

### Pillar 5: Spacing (4/4)

**What's right (evidence-cited):**
- `pad-cell = 2 spaces`: `output.cjs:92` `const sep = '  '`. Exact match to spec.
- `pad-eof`: every command's success path ends with `\n`. Spot-checked: `keys.cjs:246` `\n  Key ${key_id} revoked.\n\n`, `env.cjs:242` `\n  Pulled ... \n\n`, `login.cjs:49` `...mode: ${mode})\n`. ✓
- `pad-banner = 1 blank above + 1 below`: `whoami.cjs` renderBox emits top border + rows + bottom border with no internal blank lines (compact); banners in `status.cjs:252-254` separate panels with `\n\n`. ✓
- `pad-error-box = 0 internal vertical pad`: `errors.cjs:59-64` writes header → body → footer with no blank lines between. ✓
- Indentation: 2 spaces consistently (`whoami.cjs:65-72`, `keys.cjs:161`, `env.cjs:211-213`). Zero tabs found in `bin/commands/`.
- No trailing whitespace on any output line — verified by reading every `process.stdout.write` call.

### Pillar 6: Experience Design (1/4)

This pillar drove the overall score down — multiple systemic gaps not surfaced in the UI-SPEC §Checker Sign-Off.

**Critical gaps:**

**a) Audit trail (D-04) NOT wired in CLI commands.** CONTEXT.md D-04 + Non-negotiable §line 110: "every command writes audit row." Grep of `bin/commands/` for `audit|emitAudit|audit_log|markos_cli_audit|enqueueAuditStaging` returns **zero matches**. The library `lib/markos/cli/env.cjs:79` shows the pattern (`enqueueAuditStaging(client, entry)`) but commands don't use it because they don't have a server-side DB client — they call HTTP endpoints. The audit *might* happen server-side at the API layer, but that isn't the CLI's contract; the CLI should locally record what command ran with what args (redacted secrets). This is unverifiable today.

**b) Spinner primitive missing** (Audit Gap #2, see Visuals). All 16 "spinner: …" copy callouts in UI-SPEC §Loading/Empty/Error State Matrix are vapor. User clicks `markos keys list` and sees nothing for 1-3 seconds while the HTTP round-trip completes. No feedback.

**c) Stream separation violations.** UI-SPEC §Verbosity Tiers locks: stdout = result, stderr = progress + status. Violations:
  - `login.cjs:49`: `\n  ✓ Logged in (...)` → stdout. (Status, not result. Should be stderr in human mode.)
  - `keys.cjs:220,246`: `Aborted.` and `Key ... revoked.` → stdout.
  - `env.cjs:242,306,352,378`: `Pulled N entries`, `Pushed N entries`, `Aborted.`, `Deleted env key X` → stdout.
  - `run.cjs:276-277`: `Run submitted: ${run_id}` and `Watch with: markos status run ${run_id}` → stdout.

  These are not "result tables/JSON" — they're status confirmations. `markos env push --json | jq` is fine because the JSON branch goes through `renderJson()`, but the human branch corrupts pipes if anyone tries `markos env push | tee log.txt`.

**d) Pricing placeholder not surfaced in `markos status`** (Audit Gap #3). `status.cjs:189` renders `Plan: ${subscription.plan_tier}` with no `{{MARKOS_PRICING_ENGINE_PENDING}}` annotation. UI-SPEC §Copywriting Contract `Pricing-sensitive output` row explicitly mandates the placeholder for `markos status plan/tier display`. **PARTIAL CLOSURE** — only enforced on docs via `doctor`.

**e) `markos init` is a passthrough to `install.cjs` with no banner.** Spec Component 1 mandates a banner. `init.cjs:106-110` spawns the installer with `stdio: 'inherit'` and lets the installer's existing banner (`cli-runtime.cjs:29-32` `━━━…━━━`) handle it. Functional but not on-spec.

**What's right:**
- Exit-code consistency: every command terminates via `process.exit(EXIT_CODES.X)` from the imported map. No magic numbers found in any of the 10 command files. ✓ (D-10 token consistency)
- Confirmation prompts present on all destructive paths:
  - `keys.cjs:212-223`: `keys revoke` confirms with `--yes` bypass; non-TTY without `--yes` refuses with hint.
  - `env.cjs:344-355`: `env delete` same pattern.
  - `env.cjs:155-162`: `env pull` refuses overwrite without `--force`/`--diff`/`--merge`.
- Secrets masking:
  - API keys: `whoami.cjs:60-62` shows `sha256:${key_fingerprint}…` (8-char prefix). ✓
  - `keys.cjs:127` `LIST_COLUMNS = ['id', 'name', 'key_fingerprint', 'scope', 'created_at', 'last_used_at']` — no raw `access_token` column. ✓
  - `keys.cjs:166` shows full token ONCE on creation with: `! This is the only time the full token is shown. Store it securely.` ✓
  - Env: `lib/markos/cli/env.cjs:55,106` projects `value_preview` only (server-side `substring(...,1,4)||'…'` per migration 76:91 — first 4 chars + ellipsis, NOT last 4 as UI-SPEC §Mask Rules states). **DRIFT**: spec says "last 4 chars only … `DATABASE_URL=•••••••@db.foo.com:5432/postgres`" but implementation does first 4 chars + ellipsis. Not strictly less safe — first 4 chars typically include scheme/prefix info — but the contract diverges.
- `--quiet` honored in `doctor.cjs:55` (`if (quiet && (c.status === 'ok' || c.status === 'skip')) continue`). ✓
- NO_COLOR honored — `output.cjs:39,45` early-returns before any ANSI emission.
- SIGINT handlers: `login.cjs:124-127`, `run.cjs:288-298`, `status.cjs:412-417` — three commands install handlers; SIGINT during login gives clean exit 3, during run gives best-effort cancel + exit 0, during status --watch gives exit 0.

---

## Audit Gaps from UI-SPEC — Status Resolution

UI-SPEC §Carry-Forward Notes flagged 5 audit items. Status:

| # | Gap | UI-SPEC Status | Audit Status | Resolution |
|---|-----|----------------|--------------|------------|
| 1 | ASCII fallback for UTF-8 box chars | "auditor decision" | **OPEN** | Top Fix #4. ~1h to add `pickGlyphs()` in `output.cjs`. |
| 2 | Spinner primitive existence | "auditor check" | **OPEN** | Top Fix #2. ~1h for `spinner.cjs`. |
| 3 | `markos status` pricing placeholder | "v2 compliance gap" | **PARTIAL** | Sentinel exists in code (`runs.cjs:58`, `doctor-checks.cjs:553+`) but `status.cjs:189` plan-tier display doesn't render it. Fix: when plan tier is non-null, append ` ({{MARKOS_PRICING_ENGINE_PENDING}})` until Phase 205 lands. ~15min. |
| 4 | `env list` mask uniformity | "verify last 4 chars" | **DRIFTED** | Server emits **first 4 chars + ellipsis** (migration 76:91), not last 4 as UI-SPEC §Mask Rules states. Either update the spec to match implementation (first 4 is reasonable for prefix-disambiguation) OR change server SQL to `substring(... from char_length(p_value) - 3)`. Lock-in decision needed. |
| 5 | Width detection at <60 col | "or document deferral" | **OPEN** | Top Fix #5. ~1h. Or document deferral to v2 in UI-SPEC. |

---

## Files Audited

**CLI primitives (8/8):**
- `bin/lib/cli/output.cjs` (135 LOC) — ANSI + EXIT_CODES + render*
- `bin/lib/cli/errors.cjs` (78 LOC) — error envelope + ERROR_TO_EXIT
- `bin/lib/cli/keychain.cjs` (read for masking review)
- `bin/lib/cli/config.cjs` (read for profile resolution)
- `bin/lib/cli/http.cjs` (read for AuthError/TransientError shape)
- `bin/lib/cli/sse.cjs` (read for `run --watch` event tail)
- `bin/lib/cli/open-browser.cjs` (read for headless mode)
- `bin/lib/cli/doctor-checks.cjs` (read for pricing placeholder enforcement, lines 540-598)

**Spinner primitive:** **MISSING** (`bin/lib/cli/spinner.cjs` does not exist).

**Command implementations (10/10 routed; +1 pre-existing):**
- `bin/commands/init.cjs` — passthrough to `install.cjs` (153 LOC)
- `bin/commands/login.cjs` — device flow + token paste (217 LOC)
- `bin/commands/whoami.cjs` — boxed identity panel (218 LOC)
- `bin/commands/keys.cjs` — list/create/revoke (292 LOC)
- `bin/commands/env.cjs` — list/pull/push/delete (426 LOC)
- `bin/commands/plan.cjs` — dry-run estimate (260 LOC)
- `bin/commands/run.cjs` — submit + SSE watch (363 LOC)
- `bin/commands/eval.cjs` — local rubric scoring (198 LOC)
- `bin/commands/status.cjs` — 4-panel dashboard + watch (504 LOC)
- `bin/commands/doctor.cjs` — 12 checks dashboard (157 LOC)
- `bin/generate.cjs` — pre-existing (200-02 baseline; not re-audited)

**Routing layer:**
- `bin/cli-runtime.cjs` — COMMAND_ALIASES at lines 68-93 lists all 11 commands. Verified.
- `package.json` — `bin.markos → ./bin/install.cjs`. Verified.

**Migrations (mask + audit context):**
- `supabase/migrations/76_markos_cli_tenant_env.sql:91` — `value_preview = substring(p_value from 1 for 4) || '…'` — first 4 chars (not last 4 per spec).

**Cross-references:**
- `lib/markos/cli/env.cjs` — value_preview projection logic + audit emit pattern (lines 79-84 are the canonical primitive `emitAuditSafe`).
- `lib/markos/cli/runs.cjs:58` — PRICING_PLACEHOLDER_SENTINEL definition.

---

## Auditor Confidence: HIGH

**Why high:** UI-SPEC is recently locked and explicit; as-built code is small (~2300 LOC across 18 files) and was read end-to-end. Token-level alignment was verifiable via direct file diff (ANSI map, EXIT_CODES, ERROR_TO_EXIT). Audit gaps were fact-checked via grep (zero ASCII fallback, zero spinner.cjs, zero audit emits in commands). The Top 5 fixes are concrete and bounded (each <3 hours).

**Open question for the user:** UI-SPEC §Mask Rules says "last 4 chars" but migration 76 implements "first 4 chars + ellipsis." Which is canonical? First 4 is arguably better (preserves prefix like `mks_`, `https`, `redis` for visual disambiguation) — recommend updating UI-SPEC to match the migration rather than the other way around, but flagging for explicit decision.

**Phase 204 GA recommendation:** **SHIP with documented gaps.** None of the 5 fixes are blockers for v1 GA — Phase 204 already PASSED verification (`204-VERIFICATION.md`), the goal-backward must-haves are all green, and the gaps identified here are *contract refinement* not *contract violation* (audit trail is the only one with real production impact, and it can be added in 204.1 alongside winget+apt). Recommend filing each Top-5 fix as a `204.1` follow-up ticket and updating UI-SPEC §Carry-Forward Notes to reflect this audit's resolution status.
