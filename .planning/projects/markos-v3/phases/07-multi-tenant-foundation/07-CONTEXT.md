# Phase 07 Context: Multi-tenant Foundation

## Goal

Establish strict tenant boundaries, identity contracts, and role-based authorization as the base of MarkOS v3.

## Requirements

TEN-01, TEN-02, TEN-03, TEN-04, IAM-01, IAM-02

## In scope

- tenant_id model standardization
- RLS policies
- tenant context middleware
- RBAC baseline roles and checks
- security events for denied cross-tenant operations

## Out of scope

- white-label rendering and custom domains
- agent orchestration details
- billing and metering implementation

## Must be true

1. Cross-tenant access is denied by policy and test.
2. Tenant context is enforced in API and job handlers.
3. Role permissions are deterministic and test-covered.
