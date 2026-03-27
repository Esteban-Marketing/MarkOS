# TESTING-ROADMAP.md — A/B Test Queue & Results

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Inbound/11_CRO/TESTING-ROADMAP.md to customize it safely.


```
status      : empty
last_updated: YYYY-MM-DD
```

---

## Testing Principles

```yaml
significance_threshold  : "95% confidence"
min_sample_per_variant  : "[100 conversions]"
min_test_duration       : "14 days"
max_simultaneous_tests  : "1 per page (to avoid interaction effects)"
tool                    : "[PostHog feature flags | VWO | Optimizely]"
```

---

## Test Queue

| Priority | ID | Page | Element | Hypothesis | Control | Variant | Status |
|---------|----|----|---------|-----------|---------|---------|--------|
| P1 | T-001 | [LP] | [Headline] | [FILL] | [FILL] | [FILL] | [QUEUED] |
| P2 | T-002 | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [QUEUED] |

---

## Completed Tests

| ID | Page | Element | Winner | CVR Change | Confidence | Implemented | Notes |
|----|------|---------|--------|-----------|-----------|------------|-------|
| T-000 | [FILL] | [FILL] | [Control / Variant] | [+/- %] | [%] | [YES / NO] | [FILL] |
