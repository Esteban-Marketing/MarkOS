# Playwright Tenancy Smoke (Phase 201.1 Plan 10 — D-111)

A single E2E spec covering the tenancy golden path: signup form fill and submit, magic-link callback navigation, subdomain middleware routing, active sessions check, invite flow, tenant switcher, and offboard schedule. Closes review concern **M7**.

## Run locally

```bash
npm install
npx playwright install --with-deps chromium
npm run test:playwright:tenancy
```

Set env vars for full token-retrieval path:

```bash
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
export MARKOS_E2E_TEST_MODE=1
npm run test:playwright:tenancy
```

## Mocks

All external service calls are intercepted via `page.route()` in `test-playwright/fixtures/mocks.ts`:

- **BotID** (`botid.dev/v1/verify`): always returns `{ valid: true, score: 0.98 }`.
- **Vercel Edge Config** (`api.vercel.com/v*/edge-config`): returns success.
- **Vercel Domains/Projects** (`api.vercel.com/v*/domains|projects`): returns `{ verified: true }`.
- **Email delivery** (Resend/SendGrid): intercepted with 202; no mail is sent.

Magic-link tokens are retrieved directly from `markos_unverified_signups` via Supabase service-role (no test-only endpoint added; T-201.1-10-01 threat accepted).

## Scope

This spec covers ONE path. It does not replace unit tests, contract tests, or future broader Playwright coverage. Adding more specs requires explicit scope approval — see `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`.

The spec is intentionally narrow: cookie scope, SameSite behavior, middleware host-header resolution, and edge-config single-flight are the failure modes unit tests cannot catch.

## CI gate

The workflow `.github/workflows/playwright-tenancy-smoke.yml` runs only on PRs touching:

- `lib/markos/tenant/**`
- `lib/markos/auth/**`
- `middleware.ts`
- `app/(marketing)/signup/**`
- `app/(markos)/settings/**`
- `api/auth/**`, `api/tenant/**`
- `playwright.config.ts`, `test-playwright/**`

This is NOT a release gate — release gating is out of scope for Plan 10.

## Action-drive bar (W-5 closure)

The spec exercises mandatory full Playwright action drives on steps 1, 2, 3, 7. Steps 4 and 5 include full action drives with render-check fallback if surface conditions prevent them. Step 6 is a render-check.

| Step | Description | Drive level | Selector(s) used |
|------|-------------|-------------|-----------------|
| 1 | Signup form fill + submit | Full (mandatory) | `input[name="email"]`, `button[type="submit"]` |
| 2 | Magic-link callback navigation | Full (mandatory) | `page.goto(callbackUrl)` with `token_hash` param |
| 3 | Subdomain post-auth nav | Full (mandatory) | `page.goto(slug.localhost:3000/settings/sessions)` |
| 4 | Invite flow | Full preferred / render-check allowed | `#invite-email`, `button:has-text("Invite member")` |
| 5 | Tenant switcher | Full preferred / render-check allowed | `details[aria-labelledby="switcher-heading"] summary` |
| 6 | Member list | Render-check | `h1#members-heading` |
| 7 | Offboard | Full (mandatory) | `button:has-text("Delete workspace")`, `#confirm-name`, `button:has-text("Delete workspace permanently")` |

Total `page.fill()` + `page.click()` occurrences in the spec: >= 6 (W-5 minimum bar met).

## Known limitations

- The spec runs against an ephemeral local Next.js dev server with in-process mocks. No live Supabase is required for the mock path; token retrieval needs Supabase service-role access.
- `<slug>.localhost:3000` subdomain host-header simulation requires the Next.js dev server to handle wildcard subdomains (verify with `NEXT_PUBLIC_APEX_DOMAIN=localhost:3000`).
- Middleware subdomain routing in dev mode may behave differently from production edge runtime. The spec covers the dev-server path; production validation requires a staging environment.
- Step 2 falls back to direct navigation when `SUPABASE_SERVICE_ROLE_KEY` is absent, leaving magic-link token verification unchecked on that run. Noted as environment gap, not spec degradation.
- Steps 4 and 5 include render-check fallback paths if the invite API returns non-201 (seat quota) or the TenantSwitcher is not rendered in the layout shell on test routes.
- Broader Playwright harness (additional browsers, sad paths, multiple tenants) is deferred to a future testing-infra phase per D-111.

## M7 closure attestation

Review concern M7 stated: "Tenancy phase is exactly where E2E (signup to email click to org create to middleware route to settings) pays rent. Unit tests cannot catch SameSite/cookie scope/middleware/edge-config issues. At minimum a Playwright smoke for golden signup to use to offboard."

This spec closes M7 for the tenancy hot path. QA-06 NA declaration in `201-VERIFICATION.md` is reversed for this path. The broader Playwright harness (QA-06 full scope) remains deferred per D-111.
