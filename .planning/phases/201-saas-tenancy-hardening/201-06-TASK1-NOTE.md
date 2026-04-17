---
phase: 201-saas-tenancy-hardening
plan: "06"
status: partial
task_1: complete
task_2: pending
---

# Plan 201-06 — Task 1 of 2 complete

Not named SUMMARY.md so phase-plan-index keeps 201-06 incomplete.
Next `/gsd:execute-phase 201 --wave 2 --interactive` resumes at Task 2.

## Task 1 shipped

- Migration 86 + rollback (markos_custom_domains extensions, markos_tenant_branding)
- `lib/markos/tenant/vercel-domains-client.{cjs,ts}` — fail-closed fetch wrapper
- `lib/markos/tenant/domains.{cjs,ts}` — add/remove/poll/list with D-13 quota + audit emit
- `lib/markos/tenant/branding.{cjs,ts}` — DEFAULT_BRANDING + get/upsert with hex validation
- 21 tests passing (8 vercel-domains-client, 8 byod, 5 branding)
- 1 commit: `feat(201-06): migration 86 + vercel-domains-client + domains + branding`

## Task 2 pending

- 5 HTTP handlers (`api/settings/custom-domain/{add,remove,status}.js`, `api/settings/tenant-branding.js`, `api/webhooks/vercel-domain.js`)
- `app/(markos)/settings/domain/{page.tsx,page.module.css}` — Surface 3 (domain + vanity toggle + brand chrome)
- `app/(markos)/login/{page.tsx,page.module.css}` — Surface 7 vanity login
- `contracts/F-83-byod-custom-domain-v1.yaml` + `contracts/F-84-tenant-branding-v1.yaml`
- No new tests (Task 2 is HTTP + UI wiring over the tested library surface)
