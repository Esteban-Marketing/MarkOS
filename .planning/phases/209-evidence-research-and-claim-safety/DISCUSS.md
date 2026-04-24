# Phase 209 - Evidence, Research, and Claim Safety (Discussion)

**Date:** 2026-04-22  
**Milestone:** v4.0.0 SaaS Readiness / MarkOS v2 compliance track  
**Depends on:** Phase 207 AgentRun v2 substrate, Phase 208 approval surface  
**Quality baseline applies:** all 15 gates

## Goal

Make EvidenceMap, source quality, research freshness, and claim safety first-class product substrate.

## Current code evidence

- MCP marketing tools include `audit_claim`, `audit_claim_strict`, and `expand_claim_evidence`.
- CRM reporting and governance evidence packs exist in domain-specific form.

## Gap

The code lacks a central EvidenceMap with claim/source linkage, source quality score, freshness, TTL, confidence, known gaps, and approval UI exposure. Research context reuse is not yet a system-level behavior.

## Proposed plan slices

| Slice | Purpose |
|---|---|
| 209-01 | EvidenceMap contract/schema and fresh F-ID allocation |
| 209-02 | Source Quality Score and research tier policy |
| 209-03 | Claim TTL, freshness checks, stale-context behavior, and known gaps |
| 209-04 | Approval UI evidence exposure and unsupported-claim blocking |
| 209-05 | Research context reuse before new research |
| 209-06 | Tests and evals for citation, inference labeling, and hallucination defense |

## Success criteria

- Customer-facing factual claims are supported by evidence or clearly labeled inference.
- Unsupported claims block external dispatch.
- Sources carry quality, timestamp, freshness, and confidence.
- Agents reuse non-stale research context before starting new research.
