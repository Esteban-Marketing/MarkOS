# Model Profile Resolution for MGSD Agents

## Resolution Order

Model profiles resolve in this cascade for MGSD agents:

```
1. Explicit --model flag (highest priority)
2. Agent-specific config key (e.g., config.agents.researcher_model)
3. Global profile (config.model_profile: quality | balanced | budget)
4. Hardcoded agent default (fallback)
```

## Checking Profile

```bash
PROFILE=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" config-get model_profile 2>/dev/null || echo "balanced")
```

## Profile-to-Model Mapping

Per agent role from init context:

| Role Key | quality | balanced | budget |
|----------|---------|---------|--------|
| `researcher_model` | claude-opus-4-5 | claude-sonnet-4-5 | claude-haiku-4-5 |
| `planner_model` | claude-opus-4-5 | claude-sonnet-4-5 | claude-haiku-4-5 |
| `checker_model` | claude-sonnet-4-5 | claude-haiku-4-5 | claude-haiku-4-5 |
| `executor_model` | claude-sonnet-4-5 | claude-sonnet-4-5 | claude-haiku-4-5 |
| `verifier_model` | claude-sonnet-4-5 | claude-sonnet-4-5 | claude-haiku-4-5 |

## Changing Profile

```bash
# Set globally
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" config-set model_profile quality

# Set per-agent
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" config-set agents.planner_model claude-opus-4-5
```

## Agent Spawn with Model

Always pass model from init context:

```
Task(
  subagent_type="mgsd-market-researcher",
  model="{researcher_model}",
  ...
)
```

Never hardcode model names in workflow files — always resolve from init JSON.
