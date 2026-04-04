# Phase 54: Billing, Metering, and Enterprise Governance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `54-CONTEXT.md`.

**Date:** 2026-04-03
**Phase:** 54-billing-metering-and-enterprise-governance
**Mode:** Interactive (user-selected decisions)
**Areas discussed:** billing model, entitlement behavior, billing surface scope, enterprise identity/governance slice

---

## Billing Model

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid billing | Base subscription plus metered overages for tokens, agent runs, and premium features | Yes |
| Pure pass-through usage | Bill near-directly from raw usage records with minimal bundling | |
| Mostly subscription | Track usage for reporting, bill mainly by plan tier with limited overages | |

**User's choice:** Hybrid billing
**Notes:** Best fit for the existing billing and metering spec while preserving invoice-grade reconciliation.

---

## Entitlement and Billing Failure Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Entitlement-safe degradation | Block or degrade restricted actions immediately with clear operator reason codes; preserve core read access | Yes |
| Soft overage first | Allow temporary overage, reconcile later, hard-stop only on severe cases | |
| Manual review hold | Queue restricted actions for operator review instead of automatic enforcement | |

**User's choice:** Entitlement-safe degradation
**Notes:** Keeps billing failures and overages from silently bypassing plan controls.

---

## Billing Surface Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Operator-first | Internal reconciliation and invoice evidence first; tenant usage view minimal | |
| Balanced internal plus tenant view | Ship operator reconciliation and a meaningful tenant usage dashboard in the same phase | Yes |
| Tenant-first transparency | Prioritize customer-facing usage detail over internal operations tooling | |

**User's choice:** Balanced internal plus tenant view
**Notes:** Locks both finance/operator workflows and tenant-facing transparency into Phase 54 scope.

---

## Enterprise Identity and Governance Slice

| Option | Description | Selected |
|--------|-------------|----------|
| SSO/SAML plus role mapping and audit evidence | Federated login, external-to-canonical role mapping, access-review evidence; heavier provisioning deferred | Yes |
| SSO plus full provisioning | Include provisioning/deprovisioning automation and broader identity lifecycle | |
| Compliance evidence first | Focus more on audit/export/retention controls with lighter federation | |

**User's choice:** SSO/SAML plus role mapping and audit evidence
**Notes:** Keeps identity scope strong enough for enterprise governance without collapsing the phase into full identity lifecycle automation.

---

## the agent's Discretion

- Planner may choose exact storage/job architecture for the billing pipeline.
- Planner may choose batching cadence and provider integration strategy if ledger consistency is preserved.

## Deferred Ideas

- Full provisioning automation beyond initial federation and deterministic role mapping.
- Separate privacy-lifecycle product surfaces beyond evidence/reporting requirements.
