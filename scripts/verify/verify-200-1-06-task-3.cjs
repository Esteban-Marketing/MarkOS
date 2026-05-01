#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const checks = [];
const engine = read('lib/markos/webhooks/engine.cjs');
const delivery = read('lib/markos/webhooks/delivery.cjs');
const subscribe = read('api/webhooks/subscribe.js');

function check(name, ok, detail) {
  checks.push({ name, ok, detail: ok ? '' : detail });
}

check('engine_imports_secret_vault', /require\('\.\/secret-vault\.cjs'\)|require\("\.\/secret-vault\.cjs"\)/.test(engine), 'engine.cjs missing require(./secret-vault.cjs)');
check('engine_calls_storeSecret', /await\s+storeSecret/.test(engine), 'engine.cjs missing await storeSecret');
check('engine_uses_secret_vault_ref', /secret_vault_ref/.test(engine), 'engine.cjs missing secret_vault_ref');
check('engine_preserves_url_validator', /validateWebhookUrl/.test(engine), 'engine.cjs lost validateWebhookUrl wiring');
check('delivery_imports_secret_vault', /require\('\.\/secret-vault\.cjs'\)|require\("\.\/secret-vault\.cjs"\)/.test(delivery), 'delivery.cjs missing require(./secret-vault.cjs)');
check('delivery_calls_readSecret', /await\s+resolvePrimarySecret|await\s+readSecret/.test(delivery), 'delivery.cjs missing secret-vault read path');
const bareSecretRefs = (delivery.match(/subscription\.secret(?!_vault_ref)\b/g) || []).length;
check('delivery_no_plaintext_read', bareSecretRefs === 0, `delivery.cjs has ${bareSecretRefs} bare subscription.secret references`);
check('delivery_preserves_url_validator', /validateWebhookUrl/.test(delivery), 'delivery.cjs lost validateWebhookUrl wiring');
check('subscribe_returns_show_once', /plaintext_secret_show_once/.test(subscribe), 'subscribe.js missing plaintext_secret_show_once');
check('subscribe_preserves_invalid_url', /invalid_subscriber_url/.test(subscribe), 'subscribe.js lost invalid_subscriber_url surface');

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error('verify-200-1-06-task-3 FAIL:');
  for (const entry of failed) {
    console.error(`  - ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(`verify-200-1-06-task-3 OK: ${checks.length} checks pass`);
