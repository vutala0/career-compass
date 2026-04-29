# Career Compass — Decision Log

A running log of product, technical, and methodological decisions made during the build of Career Compass.

Each entry captures:
- **What** was decided
- **Why** it was decided
- **What alternative** was considered

This log lives in the repo so the thinking travels with the code.

---

## Decisions

| Date | # | Decision | Choice | Why | Alternative Considered |
|------|---|----------|--------|-----|------------------------|
| 2026-04-27 | 1 | Target user | Locked persona "Priya" — 3yrs generalist at a startup | Vague targets create vague products; sharper persona = sharper decisions | Broader 0–8yrs experience range |
| 2026-04-27 | 2 | Build approach | Visible agentic chain (4 separate agents) | Architecture is portfolio evidence; debuggable in isolation; teaches the agent pattern properly | Single mega-prompt (faster but less educational, harder to debug) |
| 2026-04-27 | 3 | Emerging roles source | Curated human list of 25–30 roles | LLMs can't reliably know "emerging" from training data alone; honest scoping of AI limitations | AI-generated only (rejected: hallucination risk) |
| 2026-04-27 | 4 | Trust handling | Dedicated Trust Layer feature | Biggest unaddressed risk in PRD v1.0; AI products fail when users can't tell when AI is wrong | Treat as implicit (rejected: insufficient given identified risk) |
| 2026-04-27 | 5 | Storage | localStorage (no DB) | No auth needed for MVP; privacy-friendly; fastest path to working product | Firebase (rejected: scope creep for MVP) |
| 2026-04-27 | 6 | Stack | Next.js + Tailwind + Vercel + localStorage | Industry-standard, free tier sufficient, fast iteration, native fit for AI calls | Plain HTML + Python backend (rejected: more moving parts for non-coder) |
| 2026-04-27 | 7 | Deployment philosophy | Deployment-first; public URL before any product code | Proves pipeline early; future deploys are small; eliminates a class of late-stage risk | Build everything then deploy on day 30 (rejected: classic mistake — defer the boring infra work and it bites at the worst time) |
| 2026-04-27 | 8 | AI Provider | Gemini (Google AI Studio) | Free tier sufficient for MVP cost-zero validation; existing familiarity reduces ramp time; Gemini 2.5 handles structured outputs reliably for our agentic chain | Anthropic Claude API (rejected: paid-only, unfamiliar, marginal quality edge not worth the cost+learning curve at MVP stage) |
| 2026-04-27 | 9 | Build methodology | Manual copy-paste with Claude as code-source | Greater control over each step; deliberate review of every change; PM's preference after explicit tradeoff discussion | Claude Code agent (rejected: less control over individual changes despite being faster) |
| 2026-04-27 | 10 | Project naming | Folder + npm name: `career-compass` (lowercase) | npm naming rules require lowercase; consistency with industry convention; brand decisions belong in deployed product, not folder names | `CareerCompass` (rejected: tooling friction with no user-facing benefit) |
| 2026-04-27 | 11 | Phase 0 milestone | Live URL: career-compass-alpha-lime.vercel.app · Repo: github.com/vutala0/career-compass | Phase 0 done — pipeline proven before product built | n/a (milestone log entry) |
| 2026-04-30 | 12 (revised) | Role data sourcing | Apify-driven scraping pipeline (Approach E), anchored on ATS aggregator | Real-time, verifiable data with documented source quality. Empirical test on tech vertical proved viability and surfaced quality benchmarks. Approach C remains a fallback. | Approach C (AI-curated, rejected after empirical comparison: weaker grounding when real-data path proved viable); Approach D (Gemini search grounding, untested fallback); Approach B (full live scraping at scale, rejected: maintenance burden) |
| 2026-04-30 | 20 | Database scope vs. product persona | Database covers all major functions broadly (~150-200 roles); v1 product experience designed narrowly for Priya | Database universality protects v2 expansion at no MVP cost; persona focus produces sharper v1 prompts and UX. The tension between "serve everyone" and "design for one" resolves by separating the data layer from the product layer. | Alternative: Database scoped narrowly to Priya's pivot universe only (rejected: rebuild cost when expanding to other personas in v2)
| 2026-04-30 | 21 | Use of existing AI/eng dataset | Retain ~30-50 cleanest rows from the Apify tech-vertical run; integrate as "emerging tech / ambitious leap" subset within the broader database | Honors the work already done; provides genuine ambitious-leap discovery for tech-curious non-tech users; avoids re-running tech queries | Alternative: Discard tech dataset entirely (rejected: wastes valid signal data) |

---

## How to Add a New Entry

When making a meaningful decision:
1. Add a row to the table above
2. Use today's date in `YYYY-MM-DD` format
3. Increment the number
4. Keep the "Why" to 1–2 sentences — it should explain the *reasoning*, not just restate the choice
5. Always fill "Alternative Considered" — if you can't name an alternative, the decision wasn't really a decision

> A decision without an alternative considered isn't a decision — it's a default.