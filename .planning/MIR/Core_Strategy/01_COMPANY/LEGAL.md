# LEGAL.md — Legal Entity, Compliance & Restrictions
<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Core_Strategy/01_COMPANY/LEGAL.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: Compliance is non-negotiable. `mgsd-auditor` MUST verify all campaign specs against the constraints in Section 2 and 3. `mgsd-copy-drafter` MUST NOT use prohibited claims (Section 3). Any violation triggers a Phase Halt until fixed.

**Dependencies:** PROJECT (`../00_META/PROJECT.md`), WORKFLOWS (`../../Operations/10_OPERATIONS/WORKFLOWS.md`)
**Assigned Agent:** `mgsd-auditor`
**Linear Project Manager:** `mgsd-linear-manager`

```
file_purpose  : Define the legal entity, compliance requirements, and marketing
                restrictions that apply to this business. Prevents agents from 
                producing non-compliant marketing specs.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — compliance rules override all creative preferences
```

> ⚠️ This file is not legal advice. It documents known legal facts and constraints for marketing alignment. Consult qualified legal counsel for actual legal matters.

---

## 1. Legal Entity

```yaml
legal_entity_name     : "[Full registered name]"
entity_type           : "[LLC | S-CORP | C-CORP | SOLE_PROPRIETOR | SAS | LTDA | OTHER]"
registration_country  : "[Country]"
registration_state    : "[State/Province if applicable]"
tax_id_type           : "[EIN | NIT | RFC | VAT | OTHER]"
tax_id                : "[ID number — store securely, not in public repo]"
registered_address    : "[Registered legal address]"
operating_address     : "[Primary operating address if different]"
```

---

## 2. Industry Regulatory Context

```yaml
regulated_industry    : "[YES | NO]"
regulatory_bodies     : "[List relevant regulators — e.g. FTC, FDA, SEC, SFC, or NONE]"
license_requirements  : "[Any required operating licenses — or NONE]"
```

**Key regulatory constraints that affect marketing:**
[FILL — e.g. "Cannot make before/after claims. Must include disclaimer on any financial projections. Cannot use the word 'guaranteed' in any ad copy."]

---

## 3. Advertising Compliance Rules

> These are the rules that MUST be applied to all paid and organic marketing.

**Claims that are PROHIBITED in all marketing:**
- [FILL — e.g. "Guaranteed results of any kind"]
- [FILL — e.g. "Specific income or revenue claims without disclaimers"]
- [FILL — e.g. "Health or medical claims"]

**Claims that REQUIRE a disclaimer:**
| Claim Type | Required Disclaimer |
|------------|-------------------|
| [Claim type] | [Exact disclaimer text or source] |

**Platform-specific restrictions:**
| Platform | Restriction | Reason |
|----------|-------------|--------|
| Meta Ads | [FILL] | [FILL] |
| Google Ads | [FILL] | [FILL] |
| TikTok Ads | [FILL] | [FILL] |

---

## 4. Data & Privacy

```yaml
privacy_policy_url     : "[URL or NOT_PUBLISHED_YET]"
terms_of_service_url   : "[URL or NOT_PUBLISHED_YET]"
cookie_policy_url      : "[URL or NOT_PUBLISHED_YET]"
data_residency         : "[Where customer data is stored — country/region]"
gdpr_applicable        : "[YES | NO | PARTIAL]"
ccpa_applicable        : "[YES | NO]"
lgpd_applicable        : "[YES | NO — Brazil]"
other_privacy_laws     : "[List applicable privacy laws or NONE]"
```

**Data collection that is explicitly authorized in marketing:**
[FILL — e.g. "We collect: name, email, phone, company name, and ad click source. All governed by our privacy policy."]

**Data that may NOT be collected through marketing channels:**
[FILL — e.g. "No sensitive personal data (health, finances, SSN) may be collected through lead forms."]

---

## 5. Intellectual Property

```yaml
trademarked_name      : "[YES — registered | YES — pending | NO]"
trademark_jurisdiction: "[Countries where trademarked]"
domain_owned          : "[Primary domain]"
other_domains         : "[List or NONE]"
```

**IP that may not be used in marketing without permission:**
[FILL — third-party logos, music, imagery, licensed content]

**IP owned by this business that agents should reference:**
[FILL — proprietary methodology names, trademark-protected phrases, etc.]

---

## 6. Contracts & Commitments

**Active client-facing contract terms that affect marketing claims:**
[FILL — e.g. "Client contracts guarantee a 2-week delivery timeline. This can be stated in marketing."]

**What the business guarantees (and may state in marketing):**
[FILL — e.g. "30-day money back guarantee on audit service"]

**What the business explicitly does NOT guarantee:**
[FILL — e.g. "No specific ROAS, revenue, or lead volume guarantees in marketing materials"]

---

## 7. Crisis & Reputation Protocol

**Approved response to negative public reviews:**
[FILL — or "See Operations/10_OPERATIONS/WORKFLOWS.md for crisis communication protocol"]

**Topics that must be escalated to {{LEAD_AGENT}} immediately:**
[FILL — e.g. "Any legal threat, public defamation, platform ban notice, or media inquiry"]