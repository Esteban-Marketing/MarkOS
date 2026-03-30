# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments
# Reference Example: **B2C** (Premium Home Fitness Brand)

<!-- markos-token: MIR | model: B2C -->
> [!NOTE] This is a completed example for a B2C business. Use this as a quality and depth benchmark.

---

## 1. Primary Audience Segments

* **"Optimizers" (Primary — 35â€“50, HHI $120K+):** High-achieving professionals who treat their fitness as seriously as their careers. They research purchases extensively, read reviews, and pay a premium for quality. They are the core revenue segment.
* **"Aspirers" (Secondary — 28â€“35, HHI $75K+):** Career-focused adults who want to develop a consistent fitness habit. They're often purchasing their first premium fitness equipment. Higher churn risk but larger addressable pool.
* **"Gift Buyers" (Seasonal):** Partners, parents, and adult children purchasing for someone in the primary segment. Conversion window is narrow (Octâ€“Dec). Message shifts to "the gift that keeps giving."

## 2. Advanced Psychographics & Neuromarketing Profile

* **Core Desires/Fears:**
  * Desire: Control over their body and time — they want maximum results in minimum time. Fitness is identity, not just health.
  * Fear: Buying expensive equipment that gathers dust. They've done it before. The fear of wasted money and wasted potential is acute.
* **Neuromarketing Triggers:**
  * *Primary Archetype to Target:* **The Hero** — They are on a self-improvement journey. Position the brand as the tool that makes them the hero of their own story.
  * *Effective Cognitive Biases:* Social Proof (before/after community, user stats), Scarcity (limited colorways, waitlists), Identity-Based Messaging ("people like you" framing), The Endowment Effect (free trial, 30-day home test).
* **Pain Points & Frustrations:**
  * No time for commute to gym — 45-minute round trips kill motivation.
  * Gym environments feel crowded and performative; they prefer working out privately.
  * Previous home equipment underdelivered — cheap resistance bands, a treadmill used as a clothes rack.
  * Inconsistent schedules make class bookings impractical.
* **Objections & Friction:**
  * "It's too expensive for something I might not use."
  * "I need to see it in person before spending that much."
  * "My partner needs to agree on something this big."
  * "I'm not sure I'll stay motivated without a class environment."

## 3. Lexicon & Behavioral Patterns

* **Language/Vocabulary:** "Workout streak," "personal record," "gains," "recovery day," "HIIT," "at-home workout," "form check," "no excuses," "lifestyle upgrade," "ROI on health."
* **Channel Consumption:** Instagram (workout content, transformation reels), YouTube (long-form workout videos, gear reviews), Reddit (r/homegym, r/fitness for peer advice), Apple Podcasts (health optimization, performance), TikTok (discovery of new workout styles).
* **Buying Triggers:** New Year's resolution window (Jan), post-summer "get back in shape" (Sept), receiving a health scare or doctor's advice, a visible lifestyle change in a close peer who trains at home, relocation that ends a gym membership.

## 4. Regulation & Compliance Restraints

* **Compliance Checks Required:** FTC guidelines on before/after claims (no unsubstantiated results), CPSC safety standards for fitness equipment, California Prop 65 labeling if materials apply. No HIPAA implications unless health data is stored.

## 5. Live Vectorized Sentiment (Supabase + Upstash Vector Integration)

* **Vector DB Target:** `upstash-vector://collections/markos-audience-sentiment`
* **Latest Trending Grievances:** (Injected dynamically per query by `markos-strategist` reading the DB).
* **High-Volatility Topics:** (Keywords currently accelerating in market chatboards).
