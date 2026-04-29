# Staging Smokes (Phase 201.1 D-108)

8 v4.0.0-release-gate smokes. Closes review concern H2.

## Scripts

| # | File | Description | Status (v4.0.0-alpha) |
|---|------|-------------|----------------------|
| 01 | 01-wildcard-dns.cjs | Wildcard DNS + Vercel Domains BYOD | dry: scaffolded, live: STUB |
| 02 | 02-magic-link-delivery.cjs | Magic-link delivery + click | dry: scaffolded, live: STUB |
| 03 | 03-botid-live.cjs | BotID live token | dry: scaffolded, live: STUB |
| 04 | 04-gdpr-export-retrieve.cjs | GDPR export retrieve + expiry | dry: scaffolded, live: STUB |
| 05 | 05-passkey-virtual-authenticator.cjs | WebAuthn virtual-authenticator | dry: scaffolded, live: STUB |
| 06 | 06-middleware-load-baseline.cjs | k6 100 RPS x 60s | dry: scaffolded, live: STUB |
| 07 | 07-30day-purge-cron.cjs | 30-day purge time-traveled | dry: scaffolded, live: STUB |
| 08 | 08-cookie-samesite.cjs | Cookie SameSite cross-subdomain | dry: scaffolded, live: STUB |

## Modes

- `--mode dry` (default): mocked, runs locally and in CI for free; passes trivially. Proves scaffold integrity.
- `--mode live`: requires STAGING_* env (Supabase, Vercel, BotID, R2). Live bodies are STUBS in v4.0.0-alpha; fill in during v4.0.0-release prep.

## Run

```bash
npm run smokes:staging          # dry mode
npm run smokes:staging:live     # live mode (skips STUBs with exit code 78)
```

## CI gate

- `.github/workflows/staging-smokes.yml` runs on `workflow_dispatch` + `push: tags: 'v4.0.0-*'`.
- NOT a per-PR gate.
- v4.0.0 release blocked if any smoke returns `{ ok: false, skipped: false }`.

## Filling in live mode

Each script's `runLive(opts)` function is the only thing to change. Reference materials:

- 01: Vercel Domains API; node-fetch DNS resolver; LetsEncrypt cert verifier.
- 02: Resend/SendGrid + a real test inbox (e.g., Mailosaur free tier).
- 03: BotID client SDK + server verify endpoint (STAGING_BOTID_CLIENT_ID, STAGING_BOTID_SECRET).
- 04: existing lib/markos/tenant/gdpr-export.cjs + curl on the signed URL.
- 05: Playwright virtual-authenticator (https://playwright.dev/docs/api/class-cdpsession).
- 06: k6 (or autocannon) wrapped via child_process.spawn.
- 07: insert a row with deleted_at = now() - 31d, hit the cron endpoint, assert deletion.
- 08: Playwright with .markos.dev cookie test against a real tenant + apex login.
