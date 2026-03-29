# Phase 1: Template Restructuring

**Goal:** Completely design and augment the standard templates to excel across any company/industry/market/niche. Restructure the paths for maximum adaptability per project and client.
**Requirements:** TPL-01, TPL-02
**Success Criteria:**
- MIR templates are agnostic and their folder paths logic supports evolution.
- MSP templates are standardized and their paths logically modular.

## Context
These templates currently reside in rigid flat folders (e.g., `01_COMPANY`, `02_BRAND`, etc.). To enable the `markos` protocol to scale and adapt per client naturally, they will be functionally grouped into broader domains (like `/strategy`, `/assets`, `/channels`) and parametrized explicitly inside `.agent/markos/templates/`. This ensures the structure can evolve seamlessly.

## Plan

### 1. Re-architect the Folder Logic
- [x] Group `.agent/markos/templates/MIR/` folders into core domains: `Core Strategy`, `Market & Audiences`, `Products`, `Operations`.
- [x] Group `.agent/markos/templates/MSP/` folders into channel domains: `Outbound`, `Inbound`, `Social`, `Community`, `Events`.
- [x] Standardize the naming conventions so they can be securely cloned into a new project workspace.

### 2. Standardize Template Content
- [x] Audit and edit the markdown files within `MIR` to use explicit dynamic variables like `{{INDUSTRY}}`, `{{NICHE}}`, `{{TARGET_AUDIENCE}}`. This makes them agnostic to all markets.
- [x] Review `MSP/_DISCIPLINE-PLAN-TEMPLATE.md` to ensure any new marketing channel can adopt the pipeline mechanics cleanly.

### 3. Verify and Update Architecture
- [x] Restructure the actual file system directories in `.agent/markos/templates/` to match the new dynamic path logic.
- [x] Delete or archive the stale, rigid flat folders (`MIR-TEMPLATE`, `MSP-TEMPLATE`) from the root if appropriate, or mark them as legacy.
- [x] Audit the new folder structure.
