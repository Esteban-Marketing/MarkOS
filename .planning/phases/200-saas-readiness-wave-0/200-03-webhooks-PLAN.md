---
phase: 200-saas-readiness-wave-0
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/70_markos_webhook_subscriptions.sql
  - lib/markos/webhooks/engine.ts
  - lib/markos/webhooks/signing.ts
  - lib/markos/webhooks/delivery.ts
  - api/webhooks/subscribe.js
  - api/webhooks/unsubscribe.js
  - api/webhooks/list.js
  - api/webhooks/test-fire.js
  - contracts/F-72-webhook-subscription-v1.yaml
  - contracts/F-73-webhook-delivery-v1.yaml
  - test/webhooks/engine.test.js
  - test/webhooks/signing.test.js
  - test/webhooks/delivery.test.js
autonomous: true
must_haves:
  truths:
    - "markos_webhook_subscriptions and markos_webhook_deliveries tables exist with tenant_id RLS"
    - "engine.ts exports subscribe, unsubscribe, listSubscriptions scoped per tenant"
    - "signing.ts exports signPayload(secret, body) returning HMAC-SHA256 hex with timestamp header"
    - "delivery.ts enqueues delivery via Vercel Queues with retry backoff up to 24 tries"
    - "api/webhooks/test-fire.js sends sample event and records delivery row"
    - "Event namespace covers approval.*, campaign.*, execution.*, incident.*, consent.*"
    - "F-72 and F-73 YAML contracts added and include in OpenAPI merge from 200-01"
  artifacts:
    - path: "lib/markos/webhooks/engine.ts"
      provides: "Webhook subscription engine"
      exports: ["subscribe", "unsubscribe", "listSubscriptions"]
    - path: "lib/markos/webhooks/signing.ts"
      provides: "HMAC-SHA256 payload signing"
      exports: ["signPayload", "verifySignature"]
    - path: "lib/markos/webhooks/delivery.ts"
      provides: "Queue-backed delivery with retry"
      exports: ["enqueueDelivery", "processDelivery"]
---

<objective>
Add a tenant-scoped webhook subscription + delivery primitive with HMAC signing and durable
retry via Vercel Queues. Emit canonical events (approval / campaign / execution / incident /
consent) so integrators can wire SaaS automations without polling.
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@.planning/phases/200-saas-readiness-wave-0/DISCUSS.md
@contracts/
</context>

<tasks>

<task type="auto">
  <name>Task 1: Schema migration</name>
  <files>supabase/migrations/70_markos_webhook_subscriptions.sql</files>
  <action>
Create tables markos_webhook_subscriptions (id, tenant_id, url, secret, events text[], active,
created_at) and markos_webhook_deliveries (id, subscription_id, event, payload jsonb,
attempt, status, response_code, last_error, next_retry_at, created_at). Add tenant_id RLS
policies matching existing markos_* table conventions.
  </action>
  <verify>supabase db reset applies migration; RLS policies present</verify>
</task>

<task type="auto">
  <name>Task 2: Engine + signing</name>
  <files>lib/markos/webhooks/engine.ts, lib/markos/webhooks/signing.ts</files>
  <action>
Implement subscribe/unsubscribe/list returning typed rows. signPayload returns
sha256=<hex> and timestamp; verifySignature checks both with constant-time comparison.
  </action>
  <verify>test/webhooks/engine.test.js and signing.test.js pass</verify>
</task>

<task type="auto">
  <name>Task 3: Delivery + queue</name>
  <files>lib/markos/webhooks/delivery.ts</files>
  <action>
enqueueDelivery writes a delivery row and pushes to Vercel Queues. processDelivery is the
queue handler: POST to URL with signed body, record response, schedule exponential backoff
retry up to 24 attempts (caps at 24h). Mark status: delivered / failed / retrying.
  </action>
  <verify>test/webhooks/delivery.test.js passes with mocked fetch + queue</verify>
</task>

<task type="auto">
  <name>Task 4: HTTP endpoints</name>
  <files>api/webhooks/subscribe.js, api/webhooks/unsubscribe.js, api/webhooks/list.js, api/webhooks/test-fire.js</files>
  <action>
Thin Vercel Function handlers calling engine.ts. Auth via existing tenant-auth middleware.
test-fire.js takes subscription_id + event name, enqueues synthetic delivery.
  </action>
  <verify>integration test subscribes, test-fires, receives signed callback within 5s</verify>
</task>

<task type="auto">
  <name>Task 5: Contracts</name>
  <files>contracts/F-72-webhook-subscription-v1.yaml, contracts/F-73-webhook-delivery-v1.yaml</files>
  <action>
Author F-72 (subscription CRUD) and F-73 (delivery lifecycle + retry semantics) YAML
contracts matching existing F-NN format.
  </action>
  <verify>contracts pass existing contract-schema validator</verify>
</task>

</tasks>

<success_criteria>
- [ ] Migration applies clean
- [ ] Subscribe + test-fire → signed callback verified
- [ ] Retry backoff exercised in tests
- [ ] F-72 + F-73 contracts merged into OpenAPI
</success_criteria>
