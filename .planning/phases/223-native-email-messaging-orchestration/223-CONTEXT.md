# Phase 223 - Native Email and Messaging Orchestration (Context)

**Status:** Seeded for future discuss/research  
**Purpose:** Starting context only; not implementation truth.

## Canonical Inputs

- `obsidian/work/incoming/19-EMAIL-ENGINE.md`
- `obsidian/work/incoming/21-MESSAGING-ENGINE.md`
- `obsidian/work/incoming/26-LAUNCH-ENGINE.md`
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`

## Existing Substrate To Inspect

- Existing outbound-provider and webhook patterns.
- Current task, approval, evidence, and audit infrastructure.
- Connector recovery work from Phase 210.
- Pricing-sensitive copy controls from Phase 205.

## Must Stay True

- No shadow send path outside governed approvals and audit.
- Consent and suppression rules are shared across channels.
- Channel events must enrich CRM, CDP, analytics, and learning.
- Provider choices remain replaceable.

## Research Questions

- What providers and communication primitives already exist?
- What delivery, bounce, reply, or unsubscribe state is already captured?
- What should be campaign-oriented vs thread/conversation-oriented?
- How should high-risk channel mutations be approved and observed?
