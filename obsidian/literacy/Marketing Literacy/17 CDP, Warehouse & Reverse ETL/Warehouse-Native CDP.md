---
date: 2026-04-16
description: "Warehouse-native CDP — operate on Snowflake/BigQuery/Databricks/Redshift truth without copying data into a packaged CDP. Composable stack."
tags:
  - literacy
  - cdp
  - data-warehouse
  - composable
  - frontier
---

# Warehouse-Native CDP

> Instead of copying customer data into a packaged CDP (Segment, mParticle, Tealium), operate directly on the existing data warehouse. The CDP becomes a thin activation + governance layer over Snowflake / BigQuery / Databricks / Redshift / Fabric.

## Why the shift

- **No data copy** — single source of truth; no sync lag, no duplicate billing for storage.
- **Governance inside the warehouse** — RLS, column masking, lineage (dbt, Unity Catalog, Snowflake Horizon, BigQuery Dataplex).
- **Analytics + activation on the same tables** — BI, ML, and marketing activation share models.
- **Cost** — warehouse compute is cheaper than packaged CDP seat licenses at enterprise scale.
- **Composability** — swap tools (reverse ETL, analytics, experimentation) without migrating customer data.

## Canonical stack (2026)

| Layer | Tools |
|---|---|
| **Warehouse** | Snowflake · BigQuery · Databricks Lakehouse · Redshift · Microsoft Fabric · ClickHouse Cloud |
| **Modeling** | dbt · SQLMesh · Coalesce |
| **Ingestion** | Fivetran · Airbyte · Stitch · native CDC |
| **Reverse ETL / Activation** | Hightouch · Census · RudderStack · Polytomic · Grouparoo |
| **Identity resolution** | Hightouch Match Booster · Snowflake ID Graph · LiveRamp · native SQL match rules |
| **Governance** | Immuta · Collibra · Atlan · Alation · Unity Catalog · Horizon |
| **Experimentation** | Eppo · Statsig · GrowthBook · Split.io — warehouse-native modes |
| **Measurement** | Recast, Mutinex, Meridian (run on warehouse) |
| **Semantic layer** | Cube · MetricFlow (dbt) · AtScale · Malloy |

## Data model

- **Unified customer table** (person + account + household).
- **Event fact table** (append-only) — canonical event schema (e.g. Segment spec, Avo spec, custom).
- **Identity stitching** — deterministic match keys (email, phone, user_id) + optional probabilistic match.
- **Audience definitions** as SQL/dbt models — versioned in Git.
- **Consent columns** on the customer table — activation layer enforces.

## Activation patterns

- Reverse ETL syncs audience SQL → ad platforms, ESPs, CRMs on schedule or streaming.
- Server-side Conversions API (Meta, Google, TikTok, LinkedIn) fed from the warehouse.
- In-warehouse DSP integrations (Snowflake's Snowplow + Data Clean Rooms + Native App store).

## Pitfalls

- **Governance debt** — pushing PII into the warehouse without masking + RLS is worse than a packaged CDP.
- **Latency** — reverse ETL introduces minutes-to-hours delay; not ideal for real-time personalization.
- **DIY identity** — rolling your own identity graph is hard; use vendor components where they exist.
- **Consent propagation** — activation layer must read + honour per-record consent flags.
- **Over-indexing on cost savings** — packaged CDPs still shine for fast SMB implementations.

## Related

- [[CDP · Data Warehouse · Reverse ETL]] · [[Data Clean Rooms]] · [[Identity Resolution 2026]] · [[Cookie Deprecation Status 2026]] · [[Google Consent Mode v2]] · [[Unified Measurement]]
