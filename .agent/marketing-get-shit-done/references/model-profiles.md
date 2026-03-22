# Model Profiles — Agent Model Assignments for MGSD

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
node mgsd-tools.cjs config-set model_profile quality

# Check current profile
node mgsd-tools.cjs config-get model_profile
```

## Resolution Order

1. Model overrides in config (`model_overrides.{agent_type}`)
2. Profile mapping table above
3. Default: `sonnet`
