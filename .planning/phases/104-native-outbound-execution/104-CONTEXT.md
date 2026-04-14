# Phase 104 Context

## Milestone
v3.8.0 — Revenue CRM and Customer Intelligence Core

## Phase Goal
Enable governed native outbound across email, SMS, and WhatsApp with consent checks, telemetry capture, and CRM timeline writeback.

## Key Scope
- Resend and Twilio delivery paths
- consent and suppression controls
- template and sequence execution
- delivery and reply telemetry return path

## Guardrails
- no autonomous external sending without approval
- preserve channel-safe compliance semantics
- every outbound event must be traceable on the CRM timeline

## Done Looks Like
Operators can send and track outbound communication safely from the CRM workspace with evidence preserved.