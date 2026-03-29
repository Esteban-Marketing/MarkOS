# Phase 29 Research Notes

## Code Reality Snapshot (2026-03-28)

1. ITM Linear templates and catalogs exist under `.agent/markos/templates/LINEAR-TASKS/`, but no runtime Linear API client is implemented.
2. Winners catalogs exist across `.markos-local/MSP/*/WINNERS/_CATALOG.md`, but there is no write endpoint for campaign outcomes.
3. Interview question loop is currently open-ended when fields remain Yellow/Red.

## Runtime Constraints

- Hosted mode does not guarantee local filesystem writes.
- Existing response contracts use explicit stateful outcomes (`success`, `warning`, `degraded`, `failure`).
- Compatibility paths remain active in v2.2.

## Test Strategy

- Endpoint tests for `/linear/sync` happy path and missing-secret path.
- Endpoint tests for `/campaign/result` append behavior and classification tagging.
- Backend/frontend tests for question cap and auto-proceed sequencing.
