# Phase 101 Context

## Milestone
v3.8.0 — Revenue CRM and Customer Intelligence Core

## Phase Goal
Normalize first-party behavioral activity into the CRM ledger and stitch anonymous events to known contacts or accounts with confidence-aware review controls.

## Key Scope
- web and campaign event normalization
- session-to-contact and account stitching
- preserved pre-conversion history
- tenant-safe activity ledger semantics

## Guardrails
- keep PostHog as the signal layer, not the CRM source of truth
- maintain attribution lineage and reviewability
- no silent identity merges

## Done Looks Like
Operators can inspect trustworthy activity timelines and see pre- and post-identification behavior from one CRM record view.