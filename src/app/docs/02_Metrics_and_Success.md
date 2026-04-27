# Career Compass — Metrics & Success Definition
**Version:** 1.0
**Companion to:** PRD v1.1
**Last updated:** April 27, 2026

---

## Why This Doc Exists Separately

> **PM Concept: "If your metrics live as a bullet inside the PRD, they get treated as a bullet."**
> Measurement is a discipline of its own. By giving it its own document, we force ourselves to think about *what we'd actually do with the data* — not just list things we could measure. This doc travels to every future project; the format is reusable.

---

## 1. The North Star

**One sentence:** Did Priya leave with a clearer sense of what to do next than when she arrived?

This is qualitative and unmeasurable directly — which is exactly the point. Every metric below is a *proxy* for this. We never confuse the proxy for the thing.

> **PM Concept: "Goodhart's Law"** — when a measure becomes a target, it stops being a good measure. Always remember what your metrics are trying to *approximate*.

---

## 2. The Metric Hierarchy

```
NORTH STAR (qualitative)
"Did Priya know what to do next?"
        │
        ├──── PRIMARY METRIC (measurable proxy)
        │     Roadmap Engagement Rate
        │
        ├──── SECONDARY METRICS (texture & diagnostics)
        │     • Surprise Rate
        │     • Roles Explored per Session
        │     • Time to Roadmap
        │
        └──── GUARDRAIL METRICS (what could go wrong)
              • Bounce rate on landing
              • Profile completion rate
              • Agent failure rate
              • API cost per session
```

---

## 3. Primary Metric: Roadmap Engagement Rate

### Definition
A user counts as "engaged" if they:
- Generate a roadmap, AND
- Either (a) spend >60 seconds interacting with the roadmap page (scrolling, expanding sections), OR (b) return within 7 days to view it again

**Engagement Rate = engaged users / users who completed profile input**

### Why this metric
- Filters out "click-through tourists" who generate a roadmap and bounce
- Rewards depth of value, not surface activity
- The 7-day return signal is the strongest indicator that the roadmap felt useful

### Targets
| Stage | Target | Rationale |
|---|---|---|
| First 10 users | Don't measure | Sample too small; just observe qualitatively |
| First 50 users | >40% engagement | Pre-product/market fit signal |
| First 200 users | >50% engagement | Approaching real value delivery |
| If we hit 500+ | >60% engagement | Time to think about v2 |

### What it does NOT tell us
- Whether the roadmap was *correct*
- Whether Priya actually pursued the role
- Whether the AI hallucinated

This is why we need the secondary metrics.

---

## 4. Secondary Metrics

### 4a. Surprise Rate
**Definition:** % of users who answer "yes" to a one-question post-roadmap modal: *"Did Career Compass show you a role you hadn't seriously considered before?"*

**Target:** >40%

**Why this matters:** This directly measures the product's core promise — discovery of unknown roles. If surprise rate is low, the Role Discovery Agent is failing at its job, and no amount of roadmap polish will save us.

**Implementation:** Show modal once per user, after they've viewed the roadmap. Single tap. Don't be greedy with surveys.

### 4b. Roles Explored per Session
**Definition:** Median number of role detail pages a user views per session.

**Target:** 2+

**Why this matters:** A user who only views one role isn't really exploring — they're confirming. Multi-role exploration suggests the discovery framing is working.

**Diagnostic value:** If this is exactly 1.0, the role discovery UX is failing to invite exploration.

### 4c. Time to Roadmap
**Definition:** Median time from landing page → roadmap visible.

**Target:** <3 minutes

**Why this matters:** Friction kills products. Priya should reach the magic moment fast. Anything over 3 minutes means the input flow is too heavy.

**Diagnostic value:** If this is creeping up, profile input is bloating.

---

## 5. Guardrail Metrics

> **PM Concept: "Guardrails are metrics you watch to make sure you're not winning the wrong game."**
> If engagement rate is high but bounce rate is also high, you're filtering hard for a niche audience and excluding everyone else. Guardrails catch this.

### 5a. Bounce Rate on Landing
**Threshold:** <60% bounce
**Action if breached:** The landing page isn't communicating the value prop fast enough. Rewrite headline + add 10-second demo loop.

### 5b. Profile Completion Rate
**Definition:** % of users who start the profile input and finish it.
**Threshold:** >70%
**Action if breached:** Cut required fields. The cold-start UX is broken.

### 5c. Agent Failure Rate
**Definition:** % of agent calls that fail validation, time out, or return errors.
**Threshold:** <5% per agent
**Action if breached:** Either the prompt is fragile or the schema is wrong. This is a quality issue.

### 5d. API Cost per Engaged User
**Threshold:** <$0.50 per engaged user
**Action if breached:** Optimize prompts (shorter context, cheaper models for some agents).

---

## 6. Qualitative Layer (Most Important Section)

> **PM Concept: "Numbers tell you what; interviews tell you why."**
> Quant metrics without qual research is flying blind. For an MVP especially, 5 user interviews will teach you more than 5,000 datapoints.

### Interview Plan
**Goal:** 5 interviews before declaring MVP "done"
**Composition:** At least 2 actual Priya-types (3yrs generalist), 1 person who's NOT Priya (to test scope), 2 flexible

### Interview Script (30 min each)
1. (5 min) Tell me about your current role and how you feel about your career.
2. (10 min) Use the product. Think aloud. Don't help them.
3. (10 min) Reactions:
   - Did anything surprise you?
   - What confused you?
   - Would you trust the roadmap to actually pursue this?
   - On a scale of 1–10, how likely are you to come back? Why that number?
4. (5 min) What's missing? What would you cut?

### Coding the Interviews
For each interview, tag responses against:
- ✅ Hit the magic moment
- 😐 Felt neutral / generic
- ❌ Felt confused / didn't trust output

This becomes a chart in your portfolio narrative.

---

## 7. Kill Criterion (from PRD §11)

After 20 real users (not friends), if **all three** are true, we stop:
1. Surprise rate <30%
2. <25% return to view roadmap a second time
3. Qualitative interviews reveal trust issues

This is reproduced here because **a kill criterion that isn't visible in the metrics doc isn't a kill criterion.**

---

## 8. What We Are NOT Measuring (and Why)

| Not measuring | Why |
|---|---|
| DAU / MAU | Wrong frame for a single-use career tool |
| Conversion to paid | No paid tier in MVP |
| NPS | Too small a sample to be meaningful |
| Number of skills entered | Vanity metric — doesn't connect to value |
| Total roadmaps generated | Counts clicks, not value (this is why we changed it from v1.0) |
| Social shares | Premature; not a viral product |

---

## 9. Instrumentation Plan

For MVP, we use the simplest possible setup:

| Metric | How we capture it |
|---|---|
| Engagement Rate | Vercel Analytics (free tier) + a simple "viewed roadmap" event |
| Surprise Rate | One-click modal on roadmap page |
| Time to Roadmap | Timestamp on landing + timestamp on roadmap render |
| Agent Failure Rate | Server-side logging in API routes |
| API Cost | Anthropic dashboard + per-session estimation |

**Explicitly avoiding:** Mixpanel, Amplitude, Segment, Google Analytics. Too heavy for MVP. We can add later if we hit real volume.

---

## 10. Cadence

| When | What we review |
|---|---|
| After every 10 users | Quick scan: any guardrail metric red? |
| After every 5 user interviews | Re-read the qualitative coding |
| Monthly | Full review against this doc; update targets if reality demands it |

> **PM Concept: "Metrics are not stone tablets."** If a target is consistently missed AND users seem genuinely happy, the target was wrong. Update the doc, log the change, move on.

---

## Appendix: Mapping Metrics to Decisions

This is the test of whether a metric is real: *what decision would a change in this number trigger?*

| If we see... | We will... |
|---|---|
| Engagement rate <30% | Audit the roadmap quality with 5 emergency interviews |
| Surprise rate <30% | Rewrite the Role Discovery Agent prompt; expand emerging roles list |
| Time to roadmap >5 min | Cut profile input fields by half |
| Agent failure rate >5% | Add structured output validation + retry logic |
| Cost per user >$1 | Switch some agents to Claude Haiku |
| Profile completion <50% | Redesign the input UX — it's broken |

If a metric doesn't have a row here, we don't track it.
