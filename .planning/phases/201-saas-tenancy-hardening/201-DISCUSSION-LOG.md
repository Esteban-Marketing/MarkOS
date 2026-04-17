# Phase 201: SaaS Tenancy Hardening — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 201-saas-tenancy-hardening
**Areas discussed:** Signup + verification · Org ↔ tenant model · Subdomain routing · Lifecycle + audit log

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Signup + verification | Auth method, verify strategy, BotID placement, session | ✓ |
| Org ↔ tenant model | New `markos_orgs` vs flag, cardinality, billing location, invite scope | ✓ |
| Subdomain routing | DNS strategy, fallback, reserved-slug policy, BYOD | ✓ |
| Lifecycle + audit log | Offboarding cadence, GDPR export, audit consolidation, tamper detection | ✓ |

**Selected all 4 areas.**

---

## Signup + verification

### Auth method

| Option | Description | Selected |
|--------|-------------|----------|
| Magic-link primary + passkey opt-in | Friction-free, no password DB, passkey on 2nd login | ✓ |
| Password + passkey + magic-link all equal | Max flexibility, max UI surface | |
| Passkey-first, magic-link fallback | Developer-native signal, magic-link fallback | |

### Verify

| Option | Description | Selected |
|--------|-------------|----------|
| Double opt-in email only | Standard + reuses magic-link infra | ✓ |
| Email + optional SMS second factor | Adds Twilio dep | |
| Email-only, no explicit verify | Implicit via magic-link click | |

### BotID placement

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-submit on signup form | Token required before POST | ✓ |
| On-submit via hidden token | Submit through, BotID validates server-side | |
| Post-verify (after email click) | Only gate post-verification | |

### Session policy

| Option | Description | Selected |
|--------|-------------|----------|
| 30-day rolling + multi-device allowed | Rolls on use, revoke via /settings/sessions | ✓ |
| 7-day absolute + single-device | Hard expiry + kick old session | |
| Indefinite + explicit logout only | Fails QA threat gate | |

---

## Org ↔ tenant model

### Org model

| Option | Description | Selected |
|--------|-------------|----------|
| New `markos_orgs` + `markos_tenants` FK | Clean billing + members split; matches Slack/Linear | ✓ |
| Flag `is_org_root` on `markos_tenants` | No new table; conflates concerns | |
| Skip org layer (tenant = org = billing) | Cheapest; rules out agencies | |

### Cardinality

| Option | Description | Selected |
|--------|-------------|----------|
| Solo = 1:1; B2B/agency = 1 org → N tenants | Matches ICP mix | ✓ |
| Strict 1:1 always | Kills multi-brand | |
| Strict 1:N mandatory | Friction for solopreneurs | |

### Billing location

| Option | Description | Selected |
|--------|-------------|----------|
| Org-level billing + pooled seat quota | Single subscription at org | ✓ |
| Tenant-level billing | Confusing for agencies | |
| Hybrid (billing at org, quotas per-tenant) | More UI + policy code | |

### Invite flow

| Option | Description | Selected |
|--------|-------------|----------|
| Invite to tenant; org membership derived | Reuses existing membership shape | ✓ |
| Invite to org first, then grant tenant | Two-step; heavier | |
| SSO auto-provision only | Enterprise phase material | |

---

## Subdomain routing

### DNS strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Wildcard DNS + Vercel Routing Middleware | Zero per-signup DNS work | ✓ |
| Per-tenant DNS records via Vercel API | More DNS moving parts | |
| Path-based only `/t/<slug>` | Contradicts phase goal | |

### Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Bare = marketing; unclaimed = 404 + claim CTA | Clean story | ✓ |
| Redirect bare + unclaimed to `/app` | Loses claim opportunity | |
| Path fallback coexists with subdomain | Double-surface canonicalization drift | |

### Reserved slug policy

| Option | Description | Selected |
|--------|-------------|----------|
| Hard-coded blocklist + profanity + integrations | Covers typosquatting + phishing | ✓ |
| Minimal blocklist (system names only) | Invites trademark issues | |
| Manual review queue for every request | Kills TTFD promise | |

### BYOD scope

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to 201.1 follow-up | Phase 201 locks first-party | |
| Minimal BYOD this phase | CNAME + SSL + verification UI | |
| **Full BYOD parity this phase** (vanity login + branded chrome) | Selected — user pulled into scope | ✓ |

**User notes:** Explicitly chose full vanity-login + tenant-branded chrome over the recommended defer.

### BYOD quota (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| 1 domain per org | Tight MVP surface | ✓ |
| 1 domain per tenant (N per org) | Agency story; multiplies work | |
| Unlimited | Abuse risk | |

---

## Lifecycle + audit log

### Offboarding cadence

| Option | Description | Selected |
|--------|-------------|----------|
| 30-day soft-delete → hard-purge, owner-triggered | GDPR + reversibility | ✓ |
| 7-day undo → hard-purge | Aggressive cleanup | |
| Immediate hard-delete with export link | No undo, no safety net | |

### GDPR export shape

| Option | Description | Selected |
|--------|-------------|----------|
| Signed S3/R2 zip + per-domain JSON | Reuses evidence-pack pattern | ✓ |
| Single monolithic JSON file | >100MB on real tenants | |
| Per-table CSV archive | Loses nested fidelity | |

### Audit log consolidation

| Option | Description | Selected |
|--------|-------------|----------|
| Single `markos_audit_log`, append-only, CDC-fed | One query surface + clean write decoupling | ✓ |
| Domain-prefixed tables + VIEW | Reader pays join cost | |
| Direct inserts from each domain | Risks partial writes + hot-path pressure | |

### Tamper detection

| Option | Description | Selected |
|--------|-------------|----------|
| Hash chain per tenant (prev_hash + row_hash) | SOC 2 prep ready | ✓ |
| Trust the DB | Fails SOC 2 evidence | |
| Hash chain + external WORM notarization | Defer notarization to phase 206 | |

---

## Claude's Discretion

- Seat management UI location (`/settings/members` vs `/admin/seats` vs both)
- Audit-log retention window (pending SOC 2 pinning in phase 206)
- Signup rate-limit thresholds (sensible defaults picked in plan)

## Deferred Ideas

- SCIM / SAML auto-provision → enterprise phase post-201
- Agency white-label (N custom domains per org, per-client vanity) → phase 221
- Multi-region residency → phases 222 + 232
- Audit-log WORM notarization → phase 206 SOC 2 Type I
- Second-factor hardening (FIDO2 / TOTP / SMS fallback) → dedicated security phase post-SOC 2
- Seat-quota grace period (vs hard block) → let phase 205 billing decide
