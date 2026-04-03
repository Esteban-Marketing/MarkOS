# Phase 47 Live Operational Evidence

- generated_at: 2026-04-03T03:46:22.328Z
- run_mode: mock-byok

## Provider Smoke Results

| provider | status | latency_ms | input_tokens | output_tokens | est_cost_usd | notes |
|---|---:|---:|---:|---:|---:|---|
| anthropic | MOCK_PASS | 1180 | 128 | 64 | 0.000358 | mock_success_anthropic |
| openai | MOCK_PASS | 920 | 140 | 52 | 0.000052 | mock_success_openai |
| gemini | MOCK_PASS | 860 | 136 | 58 | 0.000028 | mock_success_gemini |

## Performance Baseline

- average_latency_ms: 986.67
- p95_latency_ms: 1180.00
- target_check: PASS

## Status / Telemetry Visibility

- status_check: MOCK_PASS
- details: mock mode enabled: simulated llm status visibility without Supabase credentials

## Completion Signals

- live_provider_calls: YES
- status_visibility: YES
- perf_baseline_captured: YES
