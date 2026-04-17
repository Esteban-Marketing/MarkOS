# Phase 201: SaaS Tenancy Hardening — Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Public signup flow with email verification + BotID · org↔tenant model ·
custom subdomains via Vercel Routing Middleware · tenant lifecycle
(suspend/reactivate/offboard/GDPR export) · unified append-only audit log
with tamper detection · seat management + invite flow.

**In scope:** everything listed above + minimal BYOD custom domain with
vanity login and tenant-branded chrome (1 per org).

**Out of scope (belongs elsewhere):**
- Stripe self-serve billing → phase 205
- Agency white-label (N domains per org, per-client vanity) → phase 221
- Multi-region residency → phases 222 + 232
- SCIM / SAML auto-provision → a later enterprise phase

</domain>

<decisions>
## Implementation Decisions

### Signup + verification
- **D-01:** Primary auth = **magic-link**; **passkey opt-in** prompted on second successful login. No password column in schema.
- **D-02:** Verification = **double opt-in email only**. No SMS second factor in this phase (BotID + magic-link bind already raises cost of bot signup).
- **D-03:** **BotID gate fires pre-submit** on the signup form. Token is required client-side before the POST hits the API; bots can't enqueue to the unverified-users table at all.
- **D-04:** **30-day rolling session**, multi-device allowed by default. Sessions revocable via `/settings/sessions` list.

### Org ↔ tenant model
- **D-05:** Introduce a new `markos_orgs` table. `markos_tenants` gets a non-nullable `org_id` FK. Org owns billing + members; tenants are workspaces nested under an org.
- **D-06:** Default cardinality on signup is **1 org → 1 tenant**. B2B + agency accounts can create additional tenants under the same org via a settings UI.
- **D-07:** **Billing + seat quota at the org level**, pooled across all tenants under that org. (Aligns with phase 205 Stripe work.)
- **D-08:** Invites target a specific tenant + role. If the invitee isn't already in the org, they're auto-added at `readonly` org level on acceptance. Existing `markos_tenant_memberships` shape is reused; new `markos_org_memberships` holds org-level roles + billing admins.

### Subdomain routing
- **D-09:** Wildcard DNS `*.markos.dev` + **Vercel Routing Middleware** (first middleware file in the repo). Middleware extracts the subdomain, resolves slug → tenant_id, attaches tenant context to the request.
- **D-10:** `markos.dev` bare domain = marketing + `/app` logged-in dashboard. Unclaimed `<bogus>.markos.dev` returns 404 with a "Claim this workspace" CTA. No path-based fallback (`/t/<slug>`) to keep URLs canonical.
- **D-11:** Reserved-slug policy is a hard-coded blocklist covering: system names (`www`, `api`, `app`, `admin`, `mcp`, `sdk`, `mail`, `status`, `docs`, `blog`, `help`, `support`, `security`, `about`, `pricing`, `integrations`) + profanity filter + trademark/vendor list (`claude`, `openai`, `anthropic`, etc.) + protected single-character slugs. List lives in `lib/markos/tenant/reserved-slugs.cjs`.
- **D-12:** **BYOD custom domain IS in scope for this phase**, full surface: CNAME + auto-SSL via Vercel Domains API + **vanity login page** + **tenant-branded chrome** on the custom domain. Normal markos chrome stays on the first-party subdomain.
- **D-13:** BYOD quota: **1 custom domain per org** for phase 201. Additional domains per org (agency case) are a 201.1 / 221 follow-up.

### Tenant lifecycle + GDPR
- **D-14:** Offboarding = **30-day soft-delete → hard-purge**, triggered by tenant-admin or org-owner only. Day 0 flips tenant to `status=offboarding` (read-only). Day 30 runs the hard-purge job + delivers the export.
- **D-15:** **GDPR Art. 20 export = signed S3/R2 zip bundle** with per-domain JSON files (`tenant.json`, `members.json`, `crm-*.json`, `audit.json`, `webhooks.json`, `literacy.json`, etc.). Signed URL expires 7 days after generation. Reuses the `lib/markos/governance/evidence-pack.*` pattern.

### Audit log consolidation
- **D-16:** **Single `markos_audit_log`** table, append-only. Columns: `id`, `tenant_id`, `org_id`, `source_domain`, `action`, `actor_id`, `actor_role`, `payload jsonb`, `prev_hash`, `row_hash`, `occurred_at`. Fed by **Supabase CDC** from each domain's operational tables via a worker — domains do not write directly. One cross-domain query surface for SOC 2 + governance.
- **D-17:** **Hash chain per tenant** (`prev_hash` + `row_hash`) for tamper detection. Every row hashes `prev_hash || canonical(payload)`. Any deletion or mutation invalidates every downstream hash in that tenant's chain; detectable via a checker job. Notarization to an external WORM bucket is deferred to phase 206 (SOC 2).

### Claude's Discretion
- **Seat management UI location** — `/settings/members` vs `/admin/seats` vs both. Planner picks based on nav structure.
- **Audit-log retention window** — leave indefinite for now; phase 206 SOC 2 work will pin the exact retention + archive-tier policy.
- **Signup rate-limit thresholds** — pick sensible defaults (e.g. 5 signups/hour/IP before BotID pre-gate, 1 email verification per minute per inbox) and document in plan.

### Folded Todos

None folded — no pending todos matched phase 201.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + project state
- `.planning/ROADMAP.md` §Phase 201 — goal, requirements mapping (API-02, QA-01..15), dependencies
- `.planning/phases/201-saas-tenancy-hardening/DISCUSS.md` — pre-locked decisions (hosting, ICP, brand, connector, quality gates), threat-model focus
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — all 15 quality gates inherited

### Existing tenancy primitives
- `supabase/migrations/51_multi_tenant_foundation.sql` — canonical tenant + membership tables, RLS pattern (to be extended, not replaced)
- `supabase/migrations/37_markos_ui_control_plane.sql` — first appearance of `markos_audit_log` usage; planner must reconcile the existing shape with D-16
- `lib/markos/auth/session.ts` — session primitives (base for D-04 rolling-session semantics)
- `lib/markos/tenant/contracts.js` — existing tenant shape contract

### Existing governance / evidence pipeline (D-15 template)
- `lib/markos/governance/evidence-pack.ts` + `.cjs` — dual-export evidence-pack pattern; GDPR export reuses this
- `supabase/migrations/54_governance_evidence.sql` — evidence-pack table conventions

### Neighboring phases' refs
- `obsidian/thinking/2026-04-16-markos-saas-roadmap.md` — authoritative milestone synthesis (cited by STATE.md)
- `obsidian/brain/Target ICP.md` — ICP definition (solopreneurs + B2B SaaS + DTC)
- `obsidian/brain/Brand Stance.md` — developer-native, AI-first, quietly confident
- `obsidian/reference/MarkOS Codebase Atlas.md` — codebase map

### External platform docs (researcher must verify current)
- Vercel Routing Middleware (framework-agnostic product, not Next.js middleware) — https://vercel.com/docs
- Vercel Domains API — wildcard + BYOD + auto-SSL flow
- Vercel BotID — token issuance + server-side verification
- Supabase CDC / Realtime — for D-16 audit-log ingest pipeline
- llmstxt.org + canonical HMAC signing patterns — reused from phase 200

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `markos_tenants` + `markos_tenant_memberships` (migration 51) — extend with `org_id` FK, add new `markos_orgs` + `markos_org_memberships`.
- `lib/markos/auth/session.ts` — base session object; rolling-session refresh logic lands next to it.
- `lib/markos/governance/evidence-pack.*` — dual-export pattern + bundle shape to clone for D-15 GDPR export.
- `markos_audit_log` (migration 37) — existing ad-hoc audit writes; D-16 formalizes schema + hash chain + CDC intake.
- `lib/markos/webhooks/signing.cjs` (phase 200) — HMAC + constant-time verify; reuse for any signed-URL shape.

### Established Patterns
- Dual-export `.ts` + `.cjs` for library code (governance, billing, identity, webhooks) — use for anything under `lib/markos/tenant/`, `lib/markos/audit/`, `lib/markos/orgs/`.
- Membership-via-`markos_tenant_memberships` RLS policy shape — clone for `markos_org_memberships` and for `markos_audit_log`.
- Vercel Function handlers under `api/` with `req.markosAuth` / `req.tenantContext` resolution — use same helper for new signup + BYOD + lifecycle endpoints.
- Contract-first: every new HTTP surface gets an `F-NN-*.yaml` under `contracts/`, merged into `contracts/openapi.json` by phase 200's build script.

### Integration Points
- **First Routing Middleware file** will land at repo root `middleware.ts` — no prior middleware surface in the codebase.
- **Onboarding seed pipeline** (`onboarding/backend/handlers.cjs`, `bin/install.cjs`) — public signup reuses the tenant seed path used by `--preset` onboarding (phase 200-04).
- **Identity graph migration** (`supabase/migrations/100_crm_schema_identity_graph_hardening.sql`, just committed) — org + tenant relationship must reconcile with the identity-graph conventions landed in phase 110.1.

### Creative Options the Architecture Enables
- Subdomain middleware can also carry the tenant-branded chrome gate (D-12) — one middleware resolves both tenant + theme profile.
- CDC-fed audit log (D-16) can piggy-back on Supabase Realtime channels — eliminates a separate queue dep.
- Vanity login page can reuse the onboarding `--preset` skeleton generator — theming is already parameterized by brand-pack.

</code_context>

<specifics>
## Specific Ideas

- "Not the recommended defer" on BYOD — user explicitly pulled full vanity-login + tenant chrome into phase 201. Bounded by the 1-domain-per-org cap (D-13) so scope is still finite.
- Hash-chain-per-tenant (D-17) specifically sized for SOC 2 evidence story in phase 206 — don't simplify it to a global chain.
- Reserved-slug list (D-11) must include integration vendor names (`claude`, `openai`, `anthropic`) — the Claude Marketplace listing from phase 200-08 means typo-squatting + phishing risk is already live.

</specifics>

<deferred>
## Deferred Ideas

- **SCIM / SAML auto-provision** — enterprise phase post-201; don't block 201 on it.
- **Agency white-label (N custom domains per org, per-client vanity chrome)** — phase 221.
- **Multi-region data residency** — phases 222 + 232.
- **Audit-log notarization to external WORM store** — phase 206 SOC 2 Type I.
- **Second-factor hardening (FIDO2, TOTP, SMS fallback)** — revisit in a dedicated security-hardening phase after SOC 2 prep lands.
- **Seat-quota grace period** (vs hard block at cap) — let phase 205 billing decide whether grace is a billing concern instead.

### Reviewed Todos (not folded)
None reviewed — no pending todos matched phase 201 at discuss-time.

</deferred>

---

*Phase: 201-saas-tenancy-hardening*
*Context gathered: 2026-04-17*
