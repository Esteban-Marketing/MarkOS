---
phase: 56-security-and-privacy-evidence-closure
artifact: encryption-evidence
completed: 2026-04-04
verification_status: pass
---

# Phase 56 Encryption Evidence

## SEC-03 Closure Position

SEC-03 closes as an explicit trust-boundary proof artifact rather than as a new cryptography implementation project.

## In-Transit Boundaries

- Supabase transport paths are configured through `SUPABASE_URL` and consumed by `onboarding/backend/vector-store-client.cjs`, which expects HTTPS-backed managed endpoints for tenant data operations.
- Upstash Vector transport paths are configured through `UPSTASH_VECTOR_REST_URL` and consumed by `onboarding/backend/vector-store-client.cjs`, again using managed HTTPS endpoints.
- Enterprise identity flows use external IdP metadata and callback seams in `api/auth/sso/start.js` and `api/auth/sso/callback.js`, with provider identifiers and issuer metadata encoded as HTTPS-based identity boundaries.
- The broader provider inventory and architecture docs bind external processing paths to managed providers rather than ad hoc transport code.

## At-Rest Boundaries

- `lib/markos/llm/encryption.ts` encrypts operator API keys with `aes-256-gcm`, a per-operator AAD boundary, and a vault-derived key from `MARKOS_VAULT_SECRET` before persistence.
- `docs/LLM-BYOK-ARCHITECTURE.md` records that keys are encrypted before storage and never logged in plaintext.
- `docs/OPERATOR-LLM-SETUP.md` makes the vault secret a required configuration dependency, reinforcing that stored operator credentials are encrypted at rest.
- Tenant data persistence for governance, billing, identity, and vector-backed retrieval remains on managed platforms already enumerated through the governance vendor inventory and runtime configuration surfaces.

## Requirement-Facing Evidence Map

- Transport proof: `onboarding/backend/vector-store-client.cjs`, `api/auth/sso/start.js`, `api/auth/sso/callback.js`
- At-rest proof: `lib/markos/llm/encryption.ts`, `docs/LLM-BYOK-ARCHITECTURE.md`, `docs/OPERATOR-LLM-SETUP.md`
- Supporting managed-platform inventory: `api/governance/vendor-inventory.js`

## Scope Boundary

This artifact does not claim custom application-layer encryption for every tenant table. It closes SEC-03 by making the existing managed transport and storage boundaries explicit and by citing the in-repo operator secret encryption seam directly.
