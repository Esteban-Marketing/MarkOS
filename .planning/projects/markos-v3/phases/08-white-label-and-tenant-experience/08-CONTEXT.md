# Phase 08 Context: White-label and Tenant Experience

## Goal

Enable tenant-specific branding and custom domains while preserving platform safety and UX consistency.

## Requirements

WL-01, WL-02, WL-03, WL-04

## In scope

- logo and theme token configuration
- branded templates for notifications
- custom domain onboarding and fallback routing
- white-label versioning and rollback

## Out of scope

- agent orchestration and plan lifecycle internals
- billing and compliance controls

## Must be true

1. Tenant branding applies only within tenant scope.
2. Branding failures degrade safely to defaults.
3. Domain onboarding has explicit verification steps and recovery.
