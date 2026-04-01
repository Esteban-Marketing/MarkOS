# Testing

## Test Stack

- Node built-in test runner (`node --test`).
- Primary suite directory: `test/`.

## Ownership Map

- Protocol and documentation integrity: `test/protocol.test.js`.
- Onboarding runtime behavior: `test/onboarding-server.test.js`.
- Vector store behavior: `test/vector-store-client.test.js`.
- Install and update lifecycles: `test/install.test.js`, `test/update.test.js`.
- MIR write behavior: `test/write-mir.test.js`.

## Documentation Drift Checks

Phase 33 adds checks that ensure canonical map paths are present and referenced by summary docs.

## Refresh Triggers

Update this file when:

1. A new test suite file is added or removed.
2. A major behavior area changes ownership.
3. Documentation integrity checks are expanded or retired.
