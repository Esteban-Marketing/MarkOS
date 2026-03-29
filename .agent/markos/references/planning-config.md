---
token_id: MGSD-REF-OPS-05
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MGSD-IDX-000    # MGSD-INDEX.md — master registry
downstream:
  - MGSD-AGT-EXE-01  # mgsd-executor.md — reads config before execution
  - MGSD-AGT-STR-01  # mgsd-strategist.md — reads config for discipline status
  - MGSD-AGT-EXE-02  # mgsd-verifier.md — reads workflow.verifier flag
mir_gate_required: false
---

# Planning Config — MGSD Configuration Schema

<!-- TOKEN: MGSD-REF-OPS-05 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines the .planning/config.json schema with all MGSD behavioral toggles. Agents read this before executing any phase to determine workflow flags, discipline states, and model profiles. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-IDX-000 | MGSD-INDEX.md | Entry point — indexes this document |
| MGSD-REF-OPS-09 | model-profiles.md | Model profile values referenced in model_profile key |
| MGSD-REF-OPS-10 | model-profile-resolution.md | Resolution order for model profile cascade |
| MGSD-REF-OPS-01 | mir-gates.md | mir_gate_enforcement flag controls gate behavior |

## File Location

`.planning/config.json`

## Schema

```json
{
  "model_profile": "balanced",
  "commit_docs": true,
  "parallelization": true,
  "mir_gate_enforcement": true,
  "campaign_approval_flow": true,
  "linear_sync": true,
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "auto_advance": false,
    "text_mode": false
  },
  "discipline_activation": {
    "advertising": "ACTIVE",
    "content_marketing": "ACTIVE",
    "email_marketing": "ACTIVE",
    "social_media": "INACTIVE",
    "influencer": "FUTURE",
    "seo": "ACTIVE",
    "pr": "INACTIVE",
    "brand_marketing": "INACTIVE",
    "product_marketing": "ACTIVE",
    "partnerships": "FUTURE",
    "cro": "ACTIVE",
    "community": "INACTIVE",
    "events": "INACTIVE"
  }
}
```

## Key Descriptions

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `model_profile` | string | `balanced` | Agent model selection: `quality`, `balanced`, `budget`, `inherit` |
| `commit_docs` | bool | `true` | Commit .planning/ docs to git |
| `parallelization` | bool | `true` | Run independent plans in parallel |
| `mir_gate_enforcement` | bool | `true` | Block execution when MIR gates are RED |
| `campaign_approval_flow` | bool | `true` | Require human approval before campaign launch |
| `linear_sync` | bool | `true` | Auto-sync phases/campaigns to Linear |
| `workflow.research` | bool | `true` | Research before planning each phase |
| `workflow.plan_check` | bool | `true` | Verify plans after creation |
| `workflow.verifier` | bool | `true` | Verify work after execution |
| `workflow.auto_advance` | bool | `false` | Auto-advance to next step |
| `workflow.text_mode` | bool | `false` | Plain text instead of AskUserQuestion |
| `discipline_activation` | object | `{}` | Per-discipline ON/OFF status |

## Commands

```bash
# Set a value
node mgsd-tools.cjs config-set mir_gate_enforcement false

# Get a value
node mgsd-tools.cjs config-get workflow.research

# Create initial config
node mgsd-tools.cjs config-new-project '{"model_profile":"quality"}'
```
