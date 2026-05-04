# Phase 200 — SaaS Readiness Wave 0 (Plan)

> 0-day shortlist executed as 8 atomic plans. Two-week cadence. See [DISCUSS.md](./DISCUSS.md) for scope. Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`.

## Plan list

| Plan | Title | Effort | Owner agent | Depends on |
|---|---|---|---|---|
| **200-01** | Public OpenAPI 3.1 merge + serve | S | Executor | none |
| **200-02** | CLI `markos generate <brief>` one-shot mode | M | Executor | 200-01 (reads OpenAPI) |
| **200-03** | Webhook subscription primitive | M | Executor | none |
| **200-04** | Presetted onboarding `--preset=<bucket>` | S | Executor | none |
| **200-05** | Public `llms.txt` + markdown doc mirror | S | Executor | none |
| **200-06** | MCP server (10 skills) + Claude Marketplace listing | L | Executor | 200-01 |
| **200-07** | SDK auto-gen CI (TS + Python) | M | Executor | 200-01 |
| **200-08** | Claude Marketplace landing + demo sandbox | M | Executor | 200-06 |

## Wave execution

Parallel waves (GSD terminology):

- **Wave 1 (week 1, parallel)**: 200-01, 200-03, 200-04, 200-05
- **Wave 2 (week 1 late → week 2, serial on 01)**: 200-02, 200-06, 200-07
- **Wave 3 (week 2)**: 200-08

## Per-plan detail

### 200-01 — Public OpenAPI 3.1 merge + serve

**Files**

- `scripts/openapi/build-openapi.cjs` — walks `contracts/F-*.yaml`, merges into one OpenAPI 3.1 doc.
- `contracts/openapi.json` (generated) — committed artifact.
- `api/openapi.js` — serves JSON + YAML.
- `.github/workflows/openapi-ci.yml` — validates with Spectral on PR.
- `package.json` script `"openapi:build"`.

**Verification**

- Spectral lint passes.
- `curl https://localhost/api/openapi.json | jq .info.version` returns version.
- All 39 F-NN flows present in the merged doc.

### 200-02 — CLI `markos generate <brief>`

**Files**

- `bin/generate.cjs` — CLI entry.
- `bin/lib/brief-parser.cjs` — YAML/JSON brief parser.
- Wires to `lib/markos/crm/copilot.ts#buildCopilotGroundingBundle` + `lib/markos/llm/adapter.ts`.

**Usage**

```bash
markos generate ./brief.yaml
markos generate --channel=email --audience=founder-sam --pain=pipeline_velocity --promise="re-fill your pipeline" --brand=markos
```

**Verification**

- Given a YAML brief, produces draft + audit report to stdout.
- Exit code non-zero on audit fail.
- Test in `test/cli-generate.test.js`.

### 200-03 — Webhook subscription primitive

**Files**

- Migration `70_markos_webhook_subscriptions.sql` — tables `markos_webhook_subscriptions`, `markos_webhook_deliveries`.
- `lib/markos/webhooks/engine.ts` — subscribe/unsubscribe/list.
- `lib/markos/webhooks/signing.ts` — HMAC-SHA256 signing.
- `lib/markos/webhooks/delivery.ts` — Vercel Queue-based delivery + retry.
- `api/webhooks/subscribe.js` · `unsubscribe.js` · `list.js` · `test-fire.js`.
- `contracts/F-72-webhook-subscription-v1.yaml` + `F-73-webhook-delivery-v1.yaml`.

**Events (v1)**

- `approval.created` · `approval.resolved` · `approval.rejected`
- `campaign.launched` · `campaign.paused` · `campaign.closed`
- `execution.completed` · `execution.failed`
- `incident.opened` · `incident.resolved`
- `consent.changed` · `consent.revoked`

**Verification**

- Subscribe + test-fire → receive signed callback within 5s.
- Failed delivery retried with exp backoff up to 24 tries.
- Tests in `test/webhooks/*.test.js`.

### 200-04 — Presetted onboarding

**Files**

- `bin/install.cjs` — accept `--preset=<bucket>`.
- `bin/lib/presets/b2b-saas.json` · `dtc.json` · `agency.json` · `local-services.json` · `solopreneur.json` — each preset holds seed MIR/MSP/brand-pack placeholders + recommended literacy nodes.
- `.agent/markos/templates/presets/` mirrors of the above for agent-side reads.
- `test/onboarding-preset.test.js` verifying TTFD (time-to-first-draft) < 90s.

**Verification**

- `npx markos init --preset=b2b-saas` produces a running instance with seed data.
- Without `--preset`, falls back to existing guided-interview mode.

### 200-05 — Public `llms.txt` + markdown doc mirror

**Files**

- `public/llms.txt` — static, curated index.
- `app/(marketing)/docs/[[...slug]]/page.tsx` — existing Next.js docs.
- `app/docs/llms-full.txt/route.ts` — concatenated markdown one-shot endpoint.
- MDX mirror plugin: every HTML doc also published at `.md` URL.
- `public/robots.txt` updated — allow `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`, `CCBot`, `ChatGPT-User`.

**Verification**

- `curl markos.dev/llms.txt` returns expected manifest.
- `curl markos.dev/docs/quickstart.md` returns markdown equivalent.
- Screaming Frog crawl confirms AI bots not blocked.

### 200-06 — MCP server + Claude Marketplace listing

**Files**

- `api/mcp/session.js` — Fluid Compute endpoint, SSE stream.
- `api/mcp/tools/[toolName].js` — generic tool dispatch.
- `lib/markos/mcp/server.ts` — MCP server adapter.
- `lib/markos/mcp/tools/*.ts` — 10 initial tool adapters:
  1. `draft_message`
  2. `plan_campaign`
  3. `research_audience`
  4. `run_neuro_audit`
  5. `generate_brief`
  6. `audit_claim`
  7. `list_pain_points`
  8. `rank_execution_queue`
  9. `schedule_post`
  10. `explain_literacy`
- `.claude-plugin/marketplace.json` — Claude Marketplace submission manifest.
- `contracts/F-71-mcp-session-v1.yaml`.
- `test/mcp/*.test.js`.

**Verification**

- Local Claude Desktop connects via custom MCP URL and lists 10 tools.
- Each tool invoked with valid input returns expected output shape.
- Claude Marketplace submission queued.

### 200-07 — SDK auto-gen CI

**Files**

- `.github/workflows/sdk-publish.yml` — on OpenAPI change, generate + publish.
- `sdk/typescript/` — openapi-typescript + openapi-fetch template.
- `sdk/python/` — openapi-python-client template.
- `package.json` for `@markos/sdk` · `pyproject.toml` for `markos`.
- Semver from OpenAPI `info.version`.

**Verification**

- Dry-run publish succeeds in CI.
- Released once contract version bump triggers.
- Smoke-install `@markos/sdk` in a blank Next.js repo works.

### 200-08 — Claude Marketplace landing + demo sandbox

**Files**

- `app/(marketing)/integrations/claude/page.tsx` — dedicated landing.
- `app/(marketing)/integrations/claude/demo/page.tsx` — in-browser MCP playground.
- Marketing copy runs through Canon pipeline (archetype: solopreneur + vibe-coder; pain: content_engagement + pipeline_velocity).

**Verification**

- Page passes UI a11y + security checks.
- Demo sandbox completes a draft-generation loop end-to-end.
- Voice classifier score ≥ 85 on landing copy.

## Cross-plan dependencies graph

```
200-01 ──► 200-02 (reads OpenAPI)
       ├─► 200-06 (MCP ref OpenAPI schemas)
       └─► 200-07 (SDK auto-gen)
200-03 ──► (independent)
200-04 ──► (independent)
200-05 ──► (independent)
200-06 ──► 200-08
```

## Atomic commits expected

- `feat(200-01): add openapi build + public endpoint`
- `feat(200-03): add webhook subscription primitive + F-72/F-73 contracts`
- `feat(200-04): add --preset onboarding for 5 buckets`
- `feat(200-05): publish llms.txt + markdown doc mirror + AI bot allow-list`
- `feat(200-02): add cli markos generate one-shot mode`
- `feat(200-06): add mcp server + 10 tools + F-71`
- `feat(200-07): add sdk auto-gen ci for ts + python`
- `feat(200-08): add claude marketplace landing + demo sandbox`

## Verification gate

- All 8 plans shipped + tested.
- OpenAPI versioned, published, consumed by SDK.
- MCP server callable from Claude Desktop.
- Webhook delivery + signing verified.
- Claude Marketplace submission in review.
- Test baseline maintained (no regressions vs phase 110 baseline: 301 tests, 257 pass, 44 fail).

## Post-phase actions

- `/gsd-verify-work 200` — verification report.
- Open v4.0.0 milestone formally.
- Discuss phase 201 (OpenAPI+SDK GA hardening).

---

## Closeout posture (added by Phase 200.1)

> Added 2026-04-30 by Phase 200.1 plan 11. Phase 200's original verification gate
> ("All 8 plans shipped + tested...") proved insufficient once the 2026-04-27
> review surfaced 7 HIGH and 10 MEDIUM concerns against the inherited 15-gate
> baseline. Phase 200.1 closes those gaps as a delta hardening wave; Phase 200's
> plans 01-08 remain shipped and are not rewritten here.

**Closeout dependency:** v4.0.0 milestone close depends on BOTH Phase 200 and
Phase 200.1. The retroactive verification artifact lives at
[`200-VERIFICATION.md`](./200-VERIFICATION.md) and is generated by Phase 200.1
plan 11.

**Verifier:** `scripts/verify/verify-phase-200.cjs` enforces the dependency map
programmatically. Run `node scripts/verify/verify-phase-200.cjs` to refresh the
generated verifier block and confirm that all in-scope gates either PASS or
match the explicitly documented deferred set from `200.1-CONTEXT.md`.

**HIGH/MEDIUM concern -> 200.1 plan map:** see Section 2 of
[`200-VERIFICATION.md`](./200-VERIFICATION.md).
