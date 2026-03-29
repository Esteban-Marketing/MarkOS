---
status: testing
phase: 10-scale-and-telemetry
source: 10-01-PLAN.md, 10-02-PLAN.md, 10-VERIFICATION.md
started: 2026-03-25T21:54:00Z
updated: 2026-03-25T21:54:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Cold Start Smoke Test
expected: |
  Start the application from scratch (`node onboarding/backend/server.cjs` or `vercel dev`). Server boots without errors, handles requests without crashing, and endpoints are accessible.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Start the application from scratch (`node onboarding/backend/server.cjs` or `vercel dev`). Server boots without errors, handles requests without crashing, and endpoints are accessible.
result: [pending]

### 2. Multi-Tenant Project Isolation
expected: Submitting a form with a specific `project_slug` isolates vector data (Vector Store) and any file side-effects to that specific tenant environment dynamically, rather than globally in `.markos-local`.
result: [pending]

### 3. Frontend Telemetry Initialization and Events
expected: Loading the UI (`index.html`), clicking through steps, changing the business model, and submitting fires `onboarding_started`, `business_model_selected`, `onboarding_step_completed`, and `onboarding_completed` PostHog events in the browser network tab.
result: [pending]

### 4. Backend Agent Execution Telemetry
expected: When generating AI drafts, the backend wrapper fires `agent_execution_started` and `agent_execution_completed` PostHog events with complete token usage and generation time ms tracked.
result: [pending]

### 5. Telemetry Opt-Out
expected: Defining `MARKOS_TELEMETRY=false` cleanly disables the PostHog backend client and prevents sending the API key to the frontend UI, with zero tracking events fired.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps


