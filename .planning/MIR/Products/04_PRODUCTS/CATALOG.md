# CATALOG.md — Products & Services Catalog
<!-- markos-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.markos-local/MIR/Products/04_PRODUCTS/CATALOG.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This catalog is the definitive source of truth for all deliverables. `markos-copy-drafter` MUST verify every product claim in Section 2 before generating ad copy. `markos-executor` MUST ensure that any product promoted in an active campaign is marked as `ACTIVE` in this file. No unauthorized products or claims may be used.

**Dependencies:** PRICING (`PRICING.md`), OFFERS (`OFFERS.md`), CUSTOMER-JOURNEY (`CUSTOMER-JOURNEY.md`), AUDIENCES (`../../Market_Audiences/03_MARKET/AUDIENCES.md`)
**Assigned Agent:** `markos-product-manager`
**Linear Project Manager:** `markos-linear-manager`

```
file_purpose  : Complete inventory of everything this business sells.
                Governs what can be promoted, how it's described, and
                what campaigns can drive traffic toward.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — source of truth for all product/service facts
```

> **Rule:** No marketing campaign may promote a product or service not listed here as `active`. If a new offer is created, add it here first.

---

## 1. Product/Service Index

| ID | Name | Type | Status | Primary ICP |
|----|------|------|--------|-------------|
| P001 | [Name] | [SERVICE / PRODUCT / SUBSCRIPTION / DIGITAL] | [ACTIVE / INACTIVE / COMING_SOON] | [ICP-1 / ICP-2] |
| P002 | [Name] | [FILL] | [FILL] | [FILL] |

---

## 2. Product/Service Profiles

> One section per product or service.

---

### P001: [Product/Service Name]

```yaml
id              : "P001"
name            : "[Full name]"
status          : "[ACTIVE | INACTIVE | COMING_SOON | SUNSET]"
type            : "[SERVICE | PRODUCT | SUBSCRIPTION | DIGITAL_PRODUCT | BUNDLE]"
category        : "[e.g. Strategy, Implementation, Audit, Coaching, Software]"
target_icp      : "[ICP-1 | ICP-2 | ALL]"
```

**What it is (one sentence):**
[FILL]

**What it does for the customer (outcome, not feature list):**
[FILL — describe the transformation or result, not the deliverable]

**What is included:**
| Deliverable | Description | Format |
|-------------|-------------|--------|
| [Item 1] | [Description] | [e.g. PDF, Zoom call, Notion doc] |
| [Item 2] | [Description] | [FILL] |

**What is NOT included (scope boundaries):**
[FILL — prevents scope creep and sets customer expectations]

**Delivery format:**
```yaml
delivery_method   : "[Async | Live calls | On-site | Mixed]"
delivery_timeline : "[e.g. 5 business days from kickoff]"
delivery_platform : "[e.g. Notion, Google Drive, Vibe page, Email]"
```

**Ideal candidate for this offer:**
[FILL — more specific than the ICP. What situation is this product right for?]

**Not a fit when:**
[FILL — situations where this offer would fail or the customer would be disappointed]

**Key proof points / social proof for this offer:**
[FILL — specific results, testimonials, or case studies linked to this product]

**Marketing-approved claims about this product:**
[FILL — what we CAN say about it in ads and copy]

**Claims we cannot make about this product:**
[FILL — what we CANNOT say]

---

### P002: [Product/Service Name]

[Repeat structure above]

---

## 3. Product Relationships

**Logical upsell paths:**

```
[Entry offer] → [Core offer] → [Premium / Ongoing offer]
[e.g. Audit (P001)] → [Full Setup (P002)] → [Monthly Retainer (P003)]
```

**Bundling logic:**
[FILL — which products are offered together and when]

**Entry-point offer (lowest barrier to start):**
[FILL — the first purchase designed to initiate a client relationship]

---

## 4. Discontinued Products

> Keep a record of sunset offers to prevent agents from accidentally promoting them.

| ID | Name | Discontinued Date | Reason | Replacement |
|----|------|------------------|--------|-------------|
| [ID] | [Name] | [YYYY-MM-DD] | [FILL] | [P00X or NONE] |