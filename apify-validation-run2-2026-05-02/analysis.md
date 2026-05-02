# Run #2 — Non-Tech Career Discovery (India, last 30 days)

**Run date:** 2026-05-02 · **Region:** India · **Spend:** $0.23 of $3 budget · **Pipeline:** reuse from run #1

## TL;DR

Hit the volume target (200 final rows from a 342-row deduped pool) and got reasonable coverage across all 8 functions, but the emerging/traditional split came in at **24/76 — not the requested 50/50**. That's an honest finding, not a pipeline problem: the Indian non-tech market is dominated by traditional vocabulary (Operations Manager, Account Manager, Sales Executive, HR Manager) with a smaller emerging tier on top. The single biggest emerging signal I found was **"Founder's Office"** — the Indian equivalent of Chief of Staff + Founding Operator combined — which appeared 14 times across companies of all stages. If the product hypothesis depends on surfacing emerging roles 50/50 with traditional ones, you'll need to either lower the threshold for "emerging" or add curation post-ingest.

## Coverage by function (final 200-row dataset)

| Bucket | Final count | Target (18–25) | Note |
|---|---|---|---|
| marketing | 30 | ✓ above | Marketing keywords surface broadly |
| product | 26 | ✓ above | PMs are over-indexed in India ATS feeds |
| sales | 25 | ✓ in range | Even AE/BD/SDR distribution |
| generalist | 24 | ✓ in range | **Founder's Office drove this** |
| data-analyst | 24 | ✓ in range | Mostly standard "Business Analyst" titles |
| customer | 21 | ✓ in range | All standard CSM/AM, no emerging variants |
| **operations** | **15** | ✗ below | Real shortage in 30-day window |
| **design** | **13** | ✗ below | Real shortage; UX roles thin in India |
| other | 22 | n/a | Finance/HR/legacy mgmt roles not fitting the 8 buckets |

Operations and design under-shot the target. I didn't pad — **the market signal is genuinely thin for these in a 30-day window**. If you want fuller coverage there, dedicate one Apify run per bucket with deeper keyword diversity, or accept that they're naturally lower-volume in the Indian market.

## Top 15 emerging non-tech roles (score 7+)

| # | Title | Company | Why it matters |
|---|---|---|---|
| 1 | Manager — Founder's Office | CloudSEK | Indian-market equivalent of US Chief of Staff; wide-scope generalist tier |
| 2 | Senior Manager — Founder's Office | Pepper | Same archetype at a content/AI startup; senior tier |
| 3 | Senior Strategy & Operations Lead | MongoDB | "S&O" is a McKinsey-export role now in operating companies |
| 4 | Strategy and Operations Manager | MoonPay | Same role, fintech context, mid level |
| 5 | Senior Product Operations Manager | HackerOne | ProdOps is a real specialization, not a rebrand |
| 6 | Sr. AI Product Manager | Cyara | One of only 2 AI×PM cross-domain roles in the dataset (rare in India) |
| 7 | Senior AI Product Manager | Accellor | Same — AI-PM crossover is just emerging here |
| 8 | Engagement Manager, Strategic Accounts | Postman | Hybrid CS/sales role; doesn't map cleanly to either function |
| 9 | Senior UX Researcher | OneTrust | UX Research as a distinct discipline (not part of Designer's job) |
| 10 | Director of Content Trust & Safety Operations | Bazaarvoice | T&S Ops as a leadership track is genuinely new in India |
| 11 | Growth & Lifecycle Marketing Manager | Blink Health | Lifecycle marketing as a rising specialty vs generic "Marketing Manager" |
| 12 | Performance Marketing Manager | Apna | Distinct from "Digital Marketing"; performance/attribution focus |
| 13 | Marketing Ops & Analytics Manager | Flagright | Marketing Operations is a real US-import role landing in India |
| 14 | Solutions Consultant | Razorpay | Pre-sales technical-but-not-engineering role; rising in B2B SaaS India |
| 15 | Brand Manager | PRASUMA | Brand-marketing specialty (vs generic marketing) at consumer-products co. |

## Patterns across emerging roles

**Founder's Office is the single largest non-tech emerging cluster** — 14 distinct postings across 14 different companies in a 30-day window. Three observations: (1) it spans from intern (Dharmik, ₹45K/mo) to Senior Manager (Pepper) — full ladder forming; (2) appears in both AI-native startups (CloudSEK, Zinier) and traditional businesses (Servotech Renewable Power); (3) the title format varies wildly ("Founder's Office", "Founders Office", "Founder's Office — HR Workflows", "Manager - Founder's Office") — your normalization needs to handle all variants.

**Per-bucket emerging density (full pool):**

- generalist: 96% emerging — by construction, founder's office / CoS are inherently rising titles
- operations: 47% — Strategy&Ops, ProdOps, Trust&Safety drive this
- marketing: 26% — Lifecycle/Performance/Brand drive this; generic Marketing Manager doesn't
- design: 23% — UX Researcher and DesignOps drive this
- product: 11% — most "Product Manager" titles are mid-level standard
- sales/data-analyst: ~10% — overwhelmingly traditional vocabulary
- **customer: 0% emerging** — every CSM/AM in the sample is standard. No "Customer Success Operations Engineer," no "Customer Marketing Manager" emerging variant in this window.

**Skill cluster lift in emerging vs standard:** OKR (7.8x), HubSpot (3.9x), Notion (3.6x), scaling (2.6x), dashboards (2.3x). The lift list is short — the dataset is too small for many skills to clear the 5% rate threshold — but the direction is clear: **modern startup tooling (HubSpot/Notion) and operating-model vocabulary (OKR/scaling) cluster strongly in emerging roles**, while traditional roles use generic "MS Office" / "Excel" / "communication skills" language.

**Cities:** Bengaluru dominates (~135 rows including "bangalore" spelling variant), Mumbai distant #2 (52), Gurugram (25), Hyderabad (24), Noida (20), Delhi (18), Pune (13). Geographic skew is even more pronounced than in the run #1 tech sweep.

## Likely-surprising for a 3-year generalist

The persona is unlikely to know about: **Founder's Office** (the biggest single discovery), **Strategy & Operations** as a function (not just a McKinsey thing), **Product Operations** as a distinct role from PM, **Marketing Operations / Lifecycle Marketing** as specializations, **UX Researcher** as separate from UX Designer, **Solutions Consultant / Engagement Manager / Trust & Safety Operations** as specific career paths. Roughly **35–40 of the 200 final rows** would qualify as "I didn't know this role existed" for someone three years into a generalist Indian-startup career. That's a healthy density for the discovery use case — much higher than what unfiltered Naukri scraping would yield.

## Cost summary

| Item | Cost |
|---|---|
| LinkedIn (1 run, 150 results) | $0.110 |
| ATS aggregator × 4 runs (400 results) | $0.120 |
| **Total** | **$0.230** |

7.7% of the $3 cap. Same projection logic as run #1 holds: ~$2/5K postings/month, ~$20/50K postings/month at this source mix. The four ATS runs each cost ~$0.03 — splitting them by function pair instead of one mega-query gave clean per-bucket coverage without exceeding budget.

## Files in this delivery

- `dataset.csv` / `dataset.json` — 200 rows, stratified across role_family × emerging band so no single bucket dominates
- `full_dedup.json` — all 342 deduped rows for distribution analysis
- `stats.json` — score, role-family, emerging-mix, city, skill-lift histograms
- `normalize_run2.py` — runnable pipeline with non-tech rubric
- `raw/` — original Apify outputs from each of the 5 actor runs

Schema is identical to run #1's so you can `cat run1/full_dedup.json run2/full_dedup.json` (with light JSON merge) and have a unified ~498-row India tech+non-tech corpus.
