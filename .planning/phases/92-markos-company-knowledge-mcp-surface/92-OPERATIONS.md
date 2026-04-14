# Phase 92 Operations

## Supported v1 surface

- `search_markos_knowledge` — snippet-first search over approved internal knowledge
- `fetch_markos_artifact` — explicit fetch of one approved artifact or section

## Launch / invoke

### CLI

```powershell
node bin/markos-company-knowledge.cjs search '{"query":"revops evidence","scopes":["literacy","mir"]}'
node bin/markos-company-knowledge.cjs fetch '{"uri":"markos://tenant/tenant-alpha-001/mir/mir-001#section=AUDIENCES"}'
```

### API

POST to `/api/research/company-knowledge` with either:

```json
{
  "name": "search_markos_knowledge",
  "arguments": {
    "query": "revops evidence",
    "scopes": ["literacy", "mir"],
    "filters": {
      "audience": ["revops_leader"]
    }
  }
}
```

or:

```json
{
  "name": "fetch_markos_artifact",
  "arguments": {
    "uri": "markos://tenant/tenant-alpha-001/mir/mir-001#section=AUDIENCES"
  }
}
```

## Explicit non-goals

- no external routing
- no multi-source orchestration
- no draft exposure
- no write or approval actions
- no browse-heavy catalog surface
