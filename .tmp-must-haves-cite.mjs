// For each 224-NN-PLAN.md, prepend one new truth bullet at the top of must_haves.truths
// that cites the UI-SPEC fold block. Idempotent.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'c:/Users/User PC/Documents/GitHub/MarkOS/.planning/phases/224-conversion-launch-workspace';
const cites = {
  '224-01-PLAN.md': '"Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>): NO_UI; ships substrate consumed by 15 block components + 2 renderers + 2 form sub + public route (Plan 03) + 9 operator surfaces + 2 P208 PATCHes (Plan 07); cite UI-SPEC parent_doctrine_chain (lines 27-41, 13 parent UI-SPECs) + Plan Scope Classification + §Cross-Surface AC ranges architecture-lock + helper-canon + RLS-13-tables + migration-slot-pre-allocation."',
  '224-02-PLAN.md': '"Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>): NO_UI; ships emit() 7-sink + ConsentState DB trigger (D-67) + purpose-built rate-limit (D-68) + public form submit; cite UI-SPEC §emit() + §ConsentState double-gate + §Sensitive Credential UI Binding Layer 6 + B-9 NEW (provider secrets never in UI/MCP/audit) + §Cross-Surface AC range XC-emit-fan-out + XC-consent-state-trigger + XC-rate-limit-primitive."',
  '224-03-PLAN.md': '"Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>): IN_SCOPE (PUBLIC); ships 15 block components (B1-B15 per §Surface Inventory) + 2 renderers (R1-R2) + 2 form sub (FF1-FF2) + public route (PR1) + 1 Storybook story PublicPageRender ≥30 snapshots; cite UI-SPEC §Surface Inventory B1-B15/R1-R2/FF1-FF2/PR1 + §Cross-Surface AC ranges XC-binding-resolver-runtime + XC-d69-freshness-cache-hit + XC-d72-classifier-greenfield + XC-isr-cache-tag + XC-banned-lexicon-zero-match-public + XC-pii-redacted-public + §D-15 Extracted Component Reuse Manifest + §sentinel discipline + §Approval Inbox Handoff Chain Extension (37th + 38th chips)."',
  '224-04-PLAN.md': '"Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>): NO_UI; ships launch governance core (gates + outcomes + D-65/RH9 readiness DB trigger + 4 evaluators + waiver + state machine + polymorphic FK + D-71/RM5 outcome fail-closed); cite UI-SPEC §Cross-Surface AC ranges XC-d65-readiness-trigger + XC-4-gate-evaluators + XC-d71-outcome-fail-closed + XC-polymorphic-fk + XC-state-machine + XC-waiver-rbac-buildapprovalpkg + §Approval Inbox Handoff Chain Extension (41st chip gate_waiver_approval substrate)."',
  '224-05-PLAN.md': '"Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>): NO_UI; ships A/B experiments + D-70 SHA-256-truncated sticky-hash (drops xxhash-wasm per RM4) + traffic_split immutability post-activation (DB trigger + API guard, Pitfall 5) + emit-time variant capture; cite UI-SPEC §Cross-Surface AC ranges XC-d70-sha256-hash-deterministic + XC-d70-no-xxhash-dep + XC-pitfall5-traffic-split-immutability + XC-experiment-variant-capture-at-emit + translation gate XC-future_phase_225_attribution_journey_analytics opened."',
  '224-06-PLAN.md': '"Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>): NO_UI; ships runbook executor + reverse-rollback + D-66/RH9 execute DB trigger + AgentRun-bridged step executor (D-37) + 4 cron handlers at api/cron/*.js per D-49 + Pitfall 6 reverse-runbook + ISR invalidation on rollback (Pitfall 3); cite UI-SPEC §Cross-Surface AC ranges XC-d66-runbook-execute-trigger + XC-d37-agentrun-hard-fail + XC-pitfall6-reverse-rollback + XC-pitfall3-isr-invalidation-on-rollback + XC-4-cron-d49-paths + §Approval Inbox Handoff Chain Extension (39th + 40th + 42nd chip substrate)."',
  '224-07-PLAN.md': '"Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>): IN_SCOPE (OPERATOR); ships 9 operator surfaces under app/(markos)/conversion + app/(markos)/launches (PERMITTED carve-out per D-45 + D-64) + 2 P208 PATCHes + 6 MCP tools .cjs per D-43 + D-63 + 7 remaining legacy *.js + F-132..F-146 graduate active per D-62 + 4 Chromatic stories ≥34 snapshots + closeout regression suite + manual checkpoint:human-verify per RL1 + Phase 226 W1 model + END-OF-v4.2.0-Wave-3 chip count = 42; cite UI-SPEC §Surface Inventory operator surfaces + §Cross-Surface AC ranges XC-9-operator-surfaces + XC-2-p208-patches + XC-6-mcp-tools-cjs + XC-7-legacy-js-apis + XC-d62-openapi-parity + XC-d56-slot-collision + XC-rls-13-tables-suite + XC-p221-p222-p223-regression + XC-existing-marketing-routes-regression + XC-architecture-lock-final-scan + XC-chromatic-≥34-operator-snapshots + XC-axe-playwright-reuse + XC-end-of-v420-wave-3-chip-count-42 + §Approval Inbox Handoff Chain Extension (37th-42nd verbatim)."',
};

const ANCHOR = '  truths:\n';
let ok = 0, skipped = 0, errored = 0;
for (const [fname, citeBullet] of Object.entries(cites)) {
  const fp = path.join(ROOT, fname);
  let body = fs.readFileSync(fp, 'utf8');
  if (body.includes('Per 224-UI-SPEC.md fold (this plan §<ui_spec_fold>')) {
    console.log('[skip] ' + fname + ' already cites UI-SPEC fold');
    skipped++;
    continue;
  }
  const idx = body.indexOf(ANCHOR);
  if (idx === -1) {
    console.error('[ERR] ' + fname + ' no `  truths:` anchor');
    errored++;
    continue;
  }
  const insertAt = idx + ANCHOR.length;
  const newLine = '    - ' + citeBullet + '\n';
  body = body.slice(0, insertAt) + newLine + body.slice(insertAt);
  fs.writeFileSync(fp, body, 'utf8');
  console.log('[ok]   ' + fname + ' must_haves citation added');
  ok++;
}
console.log('Done. ok=' + ok + ' skipped=' + skipped + ' errored=' + errored);
