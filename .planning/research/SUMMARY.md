# Research Summary: MarkOS

**Domain:** AI-native marketing operating system
**Researched:** 2026-03-28
**Overall confidence:** HIGH

## Executive Summary

MarkOS is already beyond a greenfield scaffold. The repository contains a working Node-based CLI installer and updater, a local onboarding web app, a shared backend handler layer that also powers Vercel API routes, a multi-provider LLM adapter, and a Vector Store-backed draft persistence layer. The GSD and MARKOS protocol structures are both present, and the planning scaffold is populated with PROJECT, REQUIREMENTS, ROADMAP, STATE, MIR, MSP, and research directories.

The current opportunity is not "stand up the framework" from scratch. It is to align the research layer with the real product that now exists. The previous research files were narrowly focused on a rename pass, which made them poor inputs for roadmap creation. The codebase now clearly supports a stronger recommendation: treat MarkOS as a local-first protocol product with optional hosted entrypoints, versioned templates, client-owned override data, and provider-agnostic AI generation.

The stack is pragmatic and intentionally lean. Node 18+ with CommonJS keeps distribution simple for `npx` installs. The onboarding backend uses raw `http` plus shared handlers instead of a heavier web framework. Vector Store provides self-hosted or cloud-addressable vector storage, while OpenAI, Anthropic, Gemini, and Ollama are abstracted behind a single call contract. Tests use Node's built-in runner, which keeps the package lightweight and portable.

The main architectural risk is identity and runtime drift rather than missing infrastructure. The product is branded as MarkOS, but several runtime paths, manifests, collection names, and comments still carry MARKOS naming. In parallel, the repo supports both local server execution and Vercel-style API wrappers, which means filesystem assumptions and provider behavior need to stay synchronized. Those are roadmap-level concerns, not bootstrap blockers.

## Key Findings

**Stack:** Node 18+ CommonJS CLI and onboarding app, Vector Store vector persistence, provider-agnostic LLM integration, zero external test framework.
**Architecture:** Local-first protocol engine with immutable templates, gitignored/local client overrides, shared backend handlers, and optional Vercel deployment surface.
**Critical pitfall:** MarkOS branding sits on top of legacy MARKOS runtime paths and collection names, creating migration risk and operator confusion if left unresolved.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Identity Normalization** - unify MarkOS naming across runtime paths, manifests, local storage, and documentation without breaking existing installs.
   - Addresses: package/runtime consistency, onboarding messaging, operator trust
   - Avoids: migration regressions and hidden path mismatches

2. **Runtime Hardening** - reduce drift between local server mode and Vercel API mode and tighten configuration handling.
   - Addresses: shared handlers, environment-aware persistence, deployment reliability
   - Avoids: environment-specific breakage

3. **Onboarding Quality** - improve extraction, confidence scoring, regeneration, and approval ergonomics.
   - Addresses: source ingestion, draft quality, approval loop fidelity
   - Avoids: weak first-run outcomes that undermine protocol adoption

4. **Memory and Multi-Tenant Operations** - formalize Vector Store namespace strategy, migration safety, and cloud/local operating modes.
   - Addresses: vector isolation, migration compatibility, scale posture
   - Avoids: data invisibility or cross-project leakage

5. **Execution and Telemetry Expansion** - extend post-onboarding execution loops, winner anchoring, and operational reporting.
   - Addresses: prompt execution layer, analytics, long-term product differentiation
   - Avoids: a strong onboarding system with a weak downstream operating loop

**Phase ordering rationale:**
- Identity and runtime consistency should come before deeper platform expansion because both affect every install and every environment.
- Onboarding quality should precede advanced scale work because first-run draft quality is the primary adoption lever.
- Multi-tenant operations and richer execution loops become safer once naming and runtime boundaries are stable.

**Research flags for phases:**
- Phase 1: Needs careful backward-compatibility research because current runtime still depends on MARKOS-named paths.
- Phase 2: Needs deployment-specific validation because filesystem behavior differs between local and Vercel contexts.
- Phase 3: Standard product iteration, but requires prompt-quality fixtures and approval-flow tests.
- Phase 4: Needs deeper Vector Store migration and tenancy research before shipping broad changes.
- Phase 5: Standard extension work once lower-level stability issues are settled.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified from package.json, source files, tests, and official docs |
| Features | HIGH | Verified from README, onboarding code, handlers, and planning/state files |
| Architecture | HIGH | Verified from protocol lore, runtime code, Vercel config, and tests |
| Pitfalls | MEDIUM | Strongly supported by codebase review and test output; some migration impact remains forward-looking |

## Gaps to Address

- Vector Store client initialization emits deprecation warnings during tests and should be validated against the latest client guidance.
- The long-term target for MarkOS path migration remains only partially implemented in runtime comments and manifests.
- Hosted deployment behavior for approve/write paths should be validated against real serverless filesystem constraints, not only local tests.

