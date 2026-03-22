# DIGITAL-PRESENCE.md — Complete Digital Footprint

```
file_purpose  : Master index of every URL, handle, profile, and listing
                this business owns or operates. Used by agents to reference
                correct links and by {{LEAD_AGENT}} to manage the full digital estate.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — no link should be used in marketing without appearing here first
```

---

## 1. Owned Domains

| Domain | Purpose | Status | Registrar | Renewal Date |
|--------|---------|--------|----------|-------------|
| [domain.com] | [Primary site] | [ACTIVE / PARKED / REDIRECTING] | [Registrar] | [YYYY-MM-DD] |
| [www.domain.com] | [Redirects to root] | [ACTIVE] | [FILL] | [FILL] |

**Primary domain:**
```yaml
primary_domain        : "[domain.com]"
primary_url           : "https://[domain.com]"
www_redirect          : "[YES | NO]"
ssl_status            : "[ACTIVE | EXPIRED]"
hosting_platform      : "[Vibe code | Cloudflare | Other]"
```

---

## 2. Core Web Pages

| Page | URL | Purpose | Last Updated |
|------|-----|---------|-------------|
| Home | [URL] | [FILL] | [YYYY-MM-DD] |
| About | [URL] | [FILL] | [YYYY-MM-DD] |
| Services | [URL] | [FILL] | [YYYY-MM-DD] |
| [Service/Product page] | [URL] | [FILL] | [YYYY-MM-DD] |
| Contact / Book a call | [URL] | [FILL] | [YYYY-MM-DD] |
| Blog / Resources | [URL] | [FILL] | [YYYY-MM-DD] |
| Privacy Policy | [URL] | Legal | [YYYY-MM-DD] |
| Terms of Service | [URL] | Legal | [YYYY-MM-DD] |

---

## 3. Landing Pages

> Marketing-specific pages separate from the main site.

| Page Name | URL | Campaign | Status |
|-----------|-----|---------|--------|
| [Name] | [URL] | [Campaign ID] | [LIVE / DRAFT / PAUSED] |

---

## 4. Social Profiles

| Platform | Handle / URL | Status | Primary Purpose |
|----------|-------------|--------|----------------|
| Instagram | [@handle] | [ACTIVE / INACTIVE] | [e.g. Brand awareness, organic content] |
| Facebook Page | [Page name / URL] | [FILL] | [FILL] |
| LinkedIn | [Company URL] | [FILL] | [FILL] |
| TikTok | [@handle] | [FILL] | [FILL] |
| X (Twitter) | [@handle] | [FILL] | [FILL] |
| YouTube | [Channel URL] | [FILL] | [FILL] |
| WhatsApp Business | [Number] | [FILL] | [FILL] |

---

## 5. Business Listings & Directories

| Platform | Listing URL | Status | Last Verified |
|----------|-------------|--------|--------------|
| Google Business Profile | [URL] | [VERIFIED / UNVERIFIED / NOT_LISTED] | [YYYY-MM-DD] |
| [Other directory] | [URL] | [FILL] | [FILL] |

---

## 6. Third-Party Profiles

| Platform | Profile URL | Purpose | Status |
|----------|-------------|---------|--------|
| Clutch.co | [URL] | [Agency reviews] | [FILL] |
| [Other] | [URL] | [FILL] | [FILL] |

---

## 7. Booking & Scheduling

| Tool | URL | Purpose |
|------|-----|---------|
| [e.g. Calendly] | [URL] | [Discovery call booking] |

---

## 8. URL Standards

```yaml
utm_naming_convention : "utm_source=[platform]&utm_medium=[medium]&utm_campaign=[campaign_id]&utm_content=[asset_id]"
link_shortener        : "[NONE | Bit.ly | Custom domain]"
redirect_tracking     : "[YES — via n8n | NO]"
```
