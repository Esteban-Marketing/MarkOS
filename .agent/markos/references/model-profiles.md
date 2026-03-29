---
token_id: MARKOS-REF-OPS-09
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000    # MARKOS-INDEX.md — master registry
  - MARKOS-REF-OPS-10 # model-profile-resolution.md — resolution order for profiles
downstream:
  - MARKOS-REF-OPS-05  # planning-config.md — model_profile config key references these values
  - MARKOS-AGT-EXE-01  # markos-executor.md — profile selection at runtime
mir_gate_required: false
---

# Model Profiles — Agent Model Assignments for MARKOS

<!-- TOKEN: MARKOS-REF-OPS-09 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines the four MARKOS model profile tiers (quality/balanced/budget/inherit), their cost characteristics, and which agent roles each tier targets. Resolution order is defined in MARKOS-REF-OPS-10. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — indexes this document |
| MARKOS-REF-OPS-10 | model-profile-resolution.md | Resolution cascade that selects the active profile |
| MARKOS-REF-OPS-05 | planning-config.md | Config schema where model_profile key is set |
| MARKOS-AGT-EXE-01 | agents/markos-executor.md | Agent that applies profile at execution time |

## Profiles

| Profile | Description | Cost |
|---------|-------------|------|
| `quality` | Opus for research/strategy, Sonnet for execution | Higher |
| `balanced` | Sonnet for all agents | Moderate |
| `budget` | Haiku where possible, Sonnet for planning | Lower |
| `inherit` | Use current session model for all | Varies |

## Agent-to-Model Mapping

| Agent Role | Quality | Balanced | Budget |
|-----------|---------|----------|--------|
| Researcher | opus | sonnet | haiku |
| Strategist | opus | sonnet | sonnet |
| Planner | opus | sonnet | sonnet |
| Executor | sonnet | sonnet | haiku |
| Verifier | opus | sonnet | haiku |
| Content Creator | sonnet | sonnet | haiku |
| Linear Manager | haiku | haiku | haiku |

## Usage

```bash
# Set profile
node markos-tools.cjs config-set model_profile quality

# Check current profile
node markos-tools.cjs config-get model_profile
```

## Resolution Order

1. Model overrides in config (`model_overrides.{agent_type}`)
2. Profile mapping table above
3. Default: `sonnet`
