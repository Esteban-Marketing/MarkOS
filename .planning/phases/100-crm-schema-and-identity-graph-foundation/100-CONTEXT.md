# Phase 100 Context

## Milestone
v3.8.0 — Revenue CRM and Customer Intelligence Core

## Phase Goal
Establish the canonical CRM data model and the identity-graph foundation for contacts, companies, accounts, customers, deals, tasks, and activities.

## Why This Phase Exists
Every later CRM surface depends on one tenant-safe, auditable source of truth. This phase creates that foundation before tracking, workspace views, outbound execution, and AI layers are added.

## Key Scope
- canonical CRM entities and relationships
- custom-field and metadata model
- merge-safe identity lineage and review controls
- audit history and tenant-bound access rules

## Guardrails
- extend existing Supabase and governance patterns instead of replatforming
- preserve v3.7.0 provenance and approval-safe guarantees
- fail closed on ambiguous identity merges or tenant scope

## Done Looks Like
The repo has one stable CRM schema and identity contract that later phases can build on without redefining record truth.