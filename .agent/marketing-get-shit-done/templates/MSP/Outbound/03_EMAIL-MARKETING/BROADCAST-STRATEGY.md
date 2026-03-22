# BROADCAST-STRATEGY.md — Newsletter & Campaign Sends

```
status      : empty
last_updated: YYYY-MM-DD
```

> Broadcasts are one-to-many sends: newsletters, launch announcements, and seasonal campaigns.
> They differ from sequences (triggered by behavior) in that they are calendar-driven.

---

## Newsletter Framework

```yaml
name              : "[Newsletter name — or 'No named newsletter']"
frequency         : "[Biweekly | Monthly | Weekly]"
send_day          : "[e.g. Tuesday]"
send_time         : "[e.g. 9:00am audience local time]"
segments_included : "[All | Subscribers only | Clients excluded]"
```

**Newsletter structure:**
```
Section 1: One insight or observation (100–200 words)
Section 2: One resource or tool (external — demonstrates curation)
Section 3: One CTA (single, clear, low-friction)
```

**Content sourcing:**
[FILL — where does newsletter content come from: {{LEAD_AGENT}}'s observations, repurposed blog, curated links]

---

## Broadcast Calendar

| Send # | Date | Subject Theme | Segment | Offer/CTA | Status |
|--------|------|--------------|---------|----------|--------|
| [#] | [YYYY-MM-DD] | [FILL] | [All / Segment] | [FILL] | [DRAFT / SCHEDULED / SENT] |

---

## Broadcast Performance Log

| Date | Subject Line | Recipients | Open Rate | CTR | Unsubscribes | CTA Clicks |
|------|-------------|-----------|----------|-----|-------------|-----------|
| [Date] | [FILL] | [#] | [%] | [%] | [#] | [#] |
