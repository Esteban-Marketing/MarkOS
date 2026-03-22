---
description: Start a new marketing milestone (quarterly planning cycle)
---

# /mgsd-new-milestone

<purpose>
Archive completed milestone and begin a new one. Updates PROJECT.md, creates new ROADMAP section, resets STATE.md.
</purpose>

## Process

1. Archive current phases to `.planning/milestones/v{version}-phases/`
2. Wrap completed milestone in `<details>` block in ROADMAP.md
3. Create new milestone heading with phases
4. Update STATE.md milestone version
5. Run MIR audit for new milestone baseline
6. Commit

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(milestone): close v{old} — start v{new}"
```
