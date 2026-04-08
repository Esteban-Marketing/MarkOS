# Phase 62 Wave 1 Summary

Wave 1 established the outbound foundation for Phase 62.

- Added outbound contracts at `contracts/F-62-outbound-send-v1.yaml` and `contracts/F-62-outbound-consent-v1.yaml`.
- Added additive schema scaffolding at `supabase/migrations/62_crm_outbound_foundation.sql`.
- Implemented provider adapters at `lib/markos/outbound/providers/base-adapter.ts`, `lib/markos/outbound/providers/resend-adapter.ts`, and `lib/markos/outbound/providers/twilio-adapter.ts`.
- Implemented channel-aware eligibility and opt-out helpers at `lib/markos/outbound/consent.ts`.
- Added the tenant-safe one-off send API at `api/crm/outbound/send.js` and extended CRM mutation/IAM policy coverage for outbound execution.
- Verified Wave 1 with outbound foundation, consent, and tenant-isolation tests.
