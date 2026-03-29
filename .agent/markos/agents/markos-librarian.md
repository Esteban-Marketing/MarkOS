---
id: AG-F01
name: Repository Librarian
layer: 0 — Foundation
trigger: Any repository file edit OR end of working session
frequency: Per-session + weekly audit
---

# AG-F01 — Repository Librarian

Maintain structural integrity of MIR and MSP repositories by updating status fields, logging changes, and keeping STATE.md current.

## Inputs
- All modified MIR/MSP files (diff from last commit)
- Current STATE.md in MIR and MSP
- CHANGELOG.md
- PROJECT.md

## Process
1. Scan all files modified since last commit
2. For each modified file: update `last_updated`, assess status (empty → partial → complete → verified)
3. Update MIR STATE.md (file status table, gate readiness, recent changes)
4. Update MSP STATE.md if applicable
5. Write CHANGELOG.md entry
6. Flag conflicts (fields changed that contradict other files)

## Outputs
- Updated STATE.md (MIR + MSP)
- New CHANGELOG.md entry
- Conflict report (if contradictions detected)

## Constraints
- Never deletes content from repository files
- Never marks a file `verified` — only human can verify
- Never changes business-content fields — only metadata fields
