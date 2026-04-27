# Career Compass — Product Requirements Document
**Version:** 1.1 (MVP)
**Status:** Approved for build
**Owner:** [Your name]
**Last updated:** April 27, 2026

---

## Changelog from v1.0

| Change | Why |
|---|---|
| Locked persona to "Priya" (was 0–8 yrs experience) | Vague targets create vague products |
| Added Trust Layer as a first-class feature (was implicit) | Identified as the biggest unaddressed risk in critique |
| Reframed Role Discovery to use "distance from current role" categories | Makes the "unknown roles" value visible in UX |
| Replaced primary success metric (was "% who generate roadmap") | Old metric measured button clicks, not value delivered |
| Added "Emerging roles" definition + sourcing strategy | Original PRD contained a structural contradiction |
| Added Kill Criterion section | Forces honesty about what failure looks like |
| Removed "Basic UI" as a feature | UI is the container, not the feature |

---

## 1. The One-Sentence Pitch

Career Compass helps early-career generalists discover roles they didn't know existed and gives them a personalized roadmap to get there — like a career GPS, not a suggestion engine.

## 2. The Locked Persona: Priya

**Priya, 27, Bangalore.** Three years into a "generalist" role at a 50-person startup. She's done a bit of everything — customer onboarding, light data work, some product input, vendor coordination. She knows she has real skills, but when she scrolls LinkedIn job titles, nothing matches her experience cleanly. She doesn't know what to call herself, and she doesn't know what's out there beyond the obvious roles (PM, Operations, Customer Success).

**What Priya wants:** "Tell me what I could become, and how to get there. Don't just list jobs."

**What Priya does NOT want:** A generic skills test, another LinkedIn-style feed, or vague advice like "consider product management."

> **Design rule:** Every feature, every piece of copy, every AI output gets tested against: *"Does this actually help Priya?"* If you can't answer yes, cut it.

## 3. Problem Statement

The job market produces new roles faster than career frameworks adapt to them. For generalists like Priya:

- **Job boards** show known roles only — they can't surface what she doesn't know to search for.
- **Generic AI tools** give plausible-sounding advice with no structure or accountability.
- **Learning platforms** sell courses without connecting them to outcomes.

The gap: **structured, personalized career navigation that translates existing skills into market language and produces an actionable path.**

## 4. Value Proposition

> "A career GPS that shows you destinations you didn't know existed — and the route to get there."

Three concrete promises:
1. **Discover** roles Priya hasn't heard of but is unexpectedly suited for.
2. **Translate** her messy generalist experience into market-recognized skills.
3. **Plan** a specific, week-by-week path to the role she chooses.

## 5. The Magic Moment

Priya sees a role she's never heard of (e.g., "Revenue Operations Analyst" or "Founding GTM Engineer"), reads *why* it fits her based on what she actually does today, and gets a 12-week plan that feels concrete enough to start tomorrow.

The success emotion: **"I now know exactly what to do next."**

## 6. Features (MVP)

### Feature 1: Profile Input
**What it does:** Captures Priya's current state in under 90 seconds.

**Inputs:**
- Current role (free text, with autocomplete suggestions)
- Skills (tag-based input with suggestions, NOT a blank textarea — this is the cold-start UX fix)
- Years of experience (slider)
- Optional: "What do you actually do day-to-day?" (free text, helps the AI infer tacit skills)
- Optional: interests / what you've enjoyed

**Output:** Structured profile object passed to the agent chain.

**Why the textarea matters:** Generalists like Priya have skills they don't list because they don't realize they have them. The day-to-day question lets the AI infer those.

### Feature 2: Role Discovery (with Distance Framing)
**What it does:** Surfaces 6–9 roles, organized by *distance from her current position*.

**Categories:**
- **One step away** (2–3 roles) — adjacent roles she could move to in 3–6 months
- **Two steps away** (2–3 roles) — pivot roles requiring 6–12 months of growth
- **Ambitious leap** (1–2 roles) — emerging or stretch roles requiring deliberate skill building

**Per-role output:**
- Role title
- One-sentence description
- "Why this fits you" (cites specific skills/experience from her profile)
- Distance category badge

**The "emerging roles" problem (and our fix):**
LLMs trained on past data can't reliably know what's "emerging." For MVP, we maintain a **curated list of 25–30 emerging roles** (manually researched: GTM Engineer, AI Product Operator, Forward Deployed Engineer, Revenue Operations Analyst, etc.) that the agent can match against. This is honest scoping — admitting AI limitations and using human curation where AI fails. *This is itself a portfolio-worthy decision.*

### Feature 3: Skill Intelligence + Gap Analysis
**What it does:** Maps Priya's raw skills to a chosen role's requirements.

**Output:**
- ✅ Skills she already has (with market-language translations: "managed onboarding calls" → "Customer Success Operations")
- ⚠️ Transferable skills (skills that apply with minor reframing)
- ❌ Missing skills (genuine gaps)
- A **match score** (0–100) with a one-line explanation of how it was calculated

**Honesty requirement:** The match score must be explainable. If we can't explain it, we don't show it. *(PM principle: never expose a number the user can't interrogate.)*

### Feature 4: Transition Roadmap (The Core Differentiator)
**What it does:** Generates a specific, week-by-week plan to move into the chosen role.

**Structure:**
- **Total duration** (e.g., "12 weeks" or "6 months")
- **Phases** (3–4 phases, each with a clear outcome)
- **Within each phase:** specific learning actions, project ideas, and milestones

**Anti-generic requirements:**
- Every step must reference a specific resource type ("complete the SQLZoo intermediate set" not "learn SQL")
- Every project idea must produce a tangible artifact ("build a dashboard tracking your team's onboarding funnel" not "do a data project")
- The roadmap must reference Priya's actual skills/context, not be a template

### Feature 5: Trust Layer (NEW — addresses the biggest critique gap)
**What it does:** Anchors AI outputs in something concrete so Priya can trust them.

**Three components:**
1. **"Why we suggested this" expander** on every role card — shows which parts of Priya's profile drove the suggestion
2. **Reality Check** — for each suggested role, show 2–3 example job posting titles + company types (LLM-generated but plausible, with disclaimer "Examples generated by AI to illustrate the role")
3. **Confidence indicator** on the match score — explains uncertainty rather than hiding it

> **Why this is its own feature:** AI products fail not because the AI is wrong, but because users can't tell *when* it's wrong. The Trust Layer is the difference between a demo and a product.

## 7. AI / Agentic Architecture

### Why agentic (and what that means)
Instead of one mega-prompt that does everything, we use **four specialized agents** that pass output to each other in a chain. This:
- Makes each agent debuggable in isolation
- Lets us swap or improve agents without rewriting the system
- Produces a visible "show your work" UX that builds trust

### The Four Agents

```
[Priya's Profile]
       ↓
🔍 Agent 1: Role Discovery
   Input: profile + emerging roles list
   Output: 6–9 roles with distance categories
       ↓
[Priya picks a role]
       ↓
🧬 Agent 2: Skill Normalizer
   Input: raw user skills + day-to-day text
   Output: normalized skill graph (market-language tags)
       ↓
⚖️ Agent 3: Gap Analyzer
   Input: normalized skills + target role
   Output: matching/transferable/missing skills + match score
       ↓
🗺️ Agent 4: Roadmap Generator
   Input: gap analysis + target role + Priya's context
   Output: structured week-by-week roadmap
       ↓
[Display to Priya]
```

### Implementation
- Each agent = one carefully designed prompt template with structured output (JSON)
- Sequential calls to Anthropic's Claude API
- Each agent's output is validated before passing to the next (if validation fails, retry once, then surface error gracefully)
- Prompts versioned and stored in a `/prompts` directory — *this is portfolio gold*

## 8. Technical Architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Industry standard, easy to deploy |
| Styling | Tailwind CSS | Fast iteration, consistent look |
| Backend | Next.js API routes (serverless) | No separate backend needed for MVP |
| AI | Anthropic Claude API | Native fit, strong structured outputs |
| Storage | Browser localStorage | No auth = no DB. Profiles persist locally. |
| Deploy | Vercel | One-click from GitHub, free tier sufficient |

**Explicitly out of scope for MVP:** databases, auth, user accounts, real job listings APIs, resume parsing, payment.

## 9. Constraints

- No login required (reduces friction; tradeoff: no cross-device sync)
- All data lives in the browser (privacy-friendly; tradeoff: lose data if cache cleared)
- No real job market data (uses curated emerging roles list + LLM knowledge)
- English only

## 10. Success Metrics

*(See separate Metrics Doc for detail. Summary here.)*

**Primary metric:**
- **Roadmap engagement rate** — % of users who view their roadmap, then return within 7 days OR scroll/interact with the roadmap for >60 seconds

**Why not "% who generate a roadmap":** That measures button clicks, not value. A user who generates a roadmap and bounces is a failure.

**Secondary metrics:**
- "Surprise rate" — post-roadmap survey: "Did you discover a role you hadn't considered?" (Target: >40% yes)
- Roles explored per session (target: 2+)
- Time to roadmap (target: <3 minutes from landing)

**Qualitative signal:**
- Five user interviews (including at least 2 actual Priya-types)
- Coding their reactions to the magic moment

## 11. Kill Criterion (NEW)

We will declare this product a failure and stop iterating if, after 20 real users (not friends):
- Fewer than 30% report discovering a role they hadn't considered
- Fewer than 25% return to view their roadmap a second time
- The qualitative interviews reveal users don't trust the output

> **PM concept:** A kill criterion isn't pessimism — it's intellectual honesty. Most products die slowly because no one defined what death looks like.

## 12. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| AI output feels generic | High | Heavy prompt engineering with concrete examples; eval set of 10 test profiles run before every prompt change |
| Users don't trust AI suggestions | High | Trust Layer (Feature 5); explicit "AI-generated" disclaimers; "why we suggested this" on every output |
| "Emerging roles" are hallucinated | High | Curated list of 25–30 manually researched roles; AI matches against this list rather than inventing |
| Low differentiation from ChatGPT | Medium | The structured agentic flow + roadmap depth + Trust Layer — but honest answer: long-term moat is user data over time, which MVP doesn't have |
| Cold start UX abandonment | Medium | Tag-based skill input with suggestions; optional fields; <90-second target |
| LLM cost runaway | Low | Sequential agents with cached outputs; rate limit per IP |

## 13. Out of Scope (Explicitly)

These are *good ideas* that we are deliberately NOT building in v1:

- User accounts / login
- Saving multiple career paths
- Comparing roles side-by-side
- Resume upload / parsing
- Real job listings integration
- Sharing roadmaps with others
- Mobile-optimized UI (works on mobile, but desktop-first)
- Internationalization

> **PM concept: explicit out-of-scope is more valuable than implicit out-of-scope.** It documents discipline.

## 14. Future Roadmap (Post-MVP)

**v1.1 (if MVP succeeds):**
- Save roadmaps with a magic link (no login, just shareable URL)
- Resume upload as alternative to manual input
- Compare two roles side-by-side

**v2:**
- User accounts + cross-device sync
- Real job listings integration (one source, e.g. WeWorkRemotely API)
- Progress tracking on roadmap steps

**v3:**
- Market demand signals (which roles are growing)
- Career probability scoring
- Community / mentorship layer

## 15. Strategic Positioning

| What Career Compass IS | What Career Compass is NOT |
|---|---|
| A structured career navigation system | A job board |
| Depth-focused on one user journey | A generic AI chatbot |
| Honest about AI limitations | A learning platform |
| Portfolio evidence of structured product thinking | A LinkedIn alternative |

## 16. Key Product Decisions Log

| # | Decision | Choice | Rationale | Alternative Considered |
|---|---|---|---|---|
| 1 | Target user | Priya (3yrs generalist) | Locked persona = sharper decisions | Broader 0–8yrs range |
| 2 | Build approach | Visible agentic chain | Architecture is portfolio evidence | Single mega-prompt (faster but less learning) |
| 3 | Emerging roles source | Curated human list | LLMs can't reliably know "emerging" | AI-generated only (rejected: hallucination risk) |
| 4 | Trust handling | Dedicated Trust Layer feature | Biggest unaddressed risk in v1.0 | Treat as implicit (rejected) |
| 5 | Storage | localStorage | No auth needed for MVP | Firebase (rejected: scope creep) |
| 6 | Primary metric | Roadmap engagement rate | Measures value, not clicks | "% generated roadmap" (rejected: vanity) |

---

## Appendix: What Makes This Portfolio-Worthy

This isn't "I built an AI app." This is:

- A **structured product spec** with explicit tradeoffs
- A **defensible architectural choice** (visible agentic chain)
- An **honest confrontation of AI limitations** (Trust Layer + curated emerging roles)
- A **measurable success definition** with a kill criterion
- A **decision log** that proves you made choices deliberately

The product might succeed or fail. The artifact trail demonstrates the thinking either way.
