# Career Discovery Pipeline — Apify Validation Test

**Run date:** 2026-04-30 · **Region:** India · **Window:** last 30 days · **Spend:** ~$0.17 of $5 budget

---

## TL;DR

Apify can surface emerging Indian tech roles, but **only if you anchor on the right source**. The ATS aggregator (`jobo.world/ats-jobs-search`) returned 82% emerging-density (28 of 34 rows scored ≥7), pulling Forward Deployed Engineers, Applied AI Engineers, and ML Research Engineers directly from Greenhouse, Lever, Ashby, and Workable boards. The LinkedIn actor returned 24% emerging-density (29 of 122 rows scored ≥7) and was dominated by IT-services companies (Accenture, Infosys, Tech Mahindra) rebranding standard ML work as "AI/ML Engineer." YC's India filter returned zero usable rows (all 15 results were 47+ days old).

If you scale this up, **drop YC, anchor on the ATS aggregator, use LinkedIn only for coverage of companies not on modern ATS systems**, and budget ~$3 / 5K postings / month or ~$30 / 50K postings / month. For Greenhouse and Lever specifically, the direct public APIs would beat Apify on cost — Apify earns its keep on LinkedIn (no API) and on the multi-ATS aggregation convenience.

---

## Run summary

| Actor | Raw items | India-tagged | Cost | Time | Notes |
|---|---|---|---|---|---|
| `cheap_scraper/linkedin-job-scraper` | 150 | 150 | $0.110 | ~2 min | Hit the 150-result minimum floor; built-in dedup useful |
| `jobo.world/ats-jobs-search` | 50 | 43 (7 mis-tagged) | $0.015 | ~30 sec | Cleanest source by far |
| `parsebird/yc-jobs-scraper` | 15 | 15 | $0.042 | ~45 sec | All listings stale (>30 days); 0 contributed |
| **Total** | **215** | **208** | **$0.167** | **~3 min** | No failures, no blocks |

After global dedup (fuzzy match on normalized company × normalized title × city, with description-similarity backstop on borderline cases): **156 unique rows.** After biasing toward emerging roles + a few standard-role contrast samples: the curated 50-row dataset.

---

## Top 12 emerging roles found

Each is a real posting from the last 30 days in India. The asterisk flags companies likely to be a recruiting intermediary (Weekday, Crossing Hurdles) or a services rebrand (Tech Mahindra, Accenture).

| # | Title | Company | Location | Why it matters |
|---|---|---|---|---|
| 1 | Forward Deployed Engineer | DevRev | Bangalore | DevRev is a Khosla-backed AI-native CRM. FDE = Palantir-style customer-embedded engineer; the role barely existed in India 18 months ago. |
| 2 | Forward Deployed Engineer | Workato | Hyderabad | Workato (iPaaS) replicating the FDE pattern for India delivery. Real signal — multiple tier-1 cos. importing this title. |
| 3 | Forward Deployed Senior Software Engineer | Redwood Software | Hyderabad | Same archetype, third independent company. Three Indian FDE listings in 30 days suggests this is the leading edge of a real shift. |
| 4 | ML Research Engineer (Inference) | Cerebras Systems | Bengaluru | Frontier hardware-AI co. with India inference team. "ML Research Engineer" with inference specialization is genuinely rare here. |
| 5 | Applied AI Engineer (Agentic Systems & Reputation Intelligence) | Built In | India (remote) | Title is a perfect snapshot of 2026 vocabulary: "Applied AI" + "Agentic" + a vertical specialty (reputation). |
| 6 | Applied AI Engineer, Knowledge Graph | OpenGov | Pune | Knowledge-graph specialty inside applied AI — a sub-niche even in the US. |
| 7 | AI Applications Engineer — GTM | Oleria Security | Bangalore | Cross-domain: AI engineering attached to go-to-market. The clearest example of the AI×GTM pattern you described. |
| 8 | Founding QA Engineer | Coram AI | Bangalore | "Founding" framing extending past eng/PM into QA. Salary disclosed (₹12L–₹25L) — uncommon for India listings. |
| 9 | DevSecOps Engineer (TypeScript & Agentic AI) | Arize AI | Hybrid | Arize is the AI observability leader. Combining DevSecOps + agentic AI is a niche worth noting. |
| 10 | AI Prompt Engineer II | JustAnswer | India | "Prompt engineer" as a leveled job ladder (II suffix) is rare; most companies treat this as part of an AI engineer's job. |
| 11 | Staff Applied AI Engineer | Komodo Health | India | "Staff" + "Applied AI" together — health-tech vertical applying frontier-AI titles. |
| 12 | AI Systems Engineer | Kulfi Collective | Mumbai | Indian content/media-tech startup hiring at the AI-systems level. Notable as a non-FAANG, non-frontier-AI company adopting the vocabulary. |

**Roles you likely haven't heard of in the Indian context:**
- "Forward Deployed Engineer" — appearing at DevRev, Workato, Redwood. This is the strongest emerging-role signal in the dataset.
- "AI Applications Engineer — GTM" — the AI×Sales cross-domain you flagged in the brief, in the wild.
- "Applied AI Engineer, Knowledge Graph" — sub-specialty taxonomy emerging.
- "AI Systems Engineer" (distinct from "AI Engineer") — implying systems-level scope.
- "Founding QA Engineer" — founding-tier framing leaking past eng into adjacent functions.

---

## Patterns across emerging roles

**Geography.** Bengaluru concentrates 35% of emerging-scored roles (17 of 49 city-locatable rows). Hyderabad is a clear #2 at 16% (8 rows) — driven by Workato, Cerebras, Redwood, Backbase. Pune and Gurugram are tied at #3 with 5 each. Mumbai (3), Chennai (3), Delhi (2), Noida (1), Kochi (1). **Hyderabad is over-indexing on FDE roles specifically** — three of the four FDE listings are there. This is worth watching if you're building city-level signals.

**Company types posting emerging roles.** Three buckets dominate:
1. **US-HQ frontier or AI-native startups with India offices** (Cerebras, Arize, OpenGov, Komodo Health, Coram AI, Workato, DevRev, Built In). These hit ATS-scraped boards with cleanest title vocabulary.
2. **Indian-HQ AI-leaning companies** (Razorpay, Deccan AI, Kulfi Collective, ShyftLabs). Mixed quality — some genuine, some catch-all.
3. **IT services rebranding** (Accenture, Tech Mahindra, Persistent, Infosys). They post "GenAI / Agentic AI / AI Engineer" titles but the role descriptions reveal standard ML/data work. The score-7 LinkedIn rows skew heavily here — discount accordingly.

**Skills clusters.** Standard data science (Python + SQL + scikit-learn + Tableau) is the dominant baseline — appears in roughly two-thirds of all rows regardless of emerging score. The emerging cluster is overlaid:

| Skill | Rate in emerging (≥7) | Rate in standard (<7) | Lift |
|---|---|---|---|
| kubeflow | 7% | 1% | **7.0x** |
| embeddings | 16% | 5% | 3.1x |
| reinforcement learning | 9% | 3% | 2.9x |
| Vertex AI | 14% | 5% | 2.8x |
| Go (lang) | 19% | 7% | 2.7x |
| multi-agent | 10% | 4% | 2.6x |
| TypeScript | 7% | 3% | 2.3x |
| agentic | 51% | 22% | 2.3x |
| Claude | 14% | 7% | 2.0x |
| RAG | 40% | 24% | 1.7x |
| MLOps | 28% | 17% | 1.6x |
| prompt engineering | 23% | 14% | 1.6x |
| evals | 32% | 20% | 1.6x |

The pattern is clean: emerging roles favor **agent infrastructure + evaluation + retrieval + Go/TypeScript** on top of standard Python. If you're building a "skills graph" feature, these lift values are exactly what your scoring algorithm wants — they're the signal that distinguishes "frontier-stack engineer" from "ML engineer with a 2024 title rebrand."

**India-specific patterns vs. US/EU.** Three things stood out:
1. **Forward Deployed Engineer is more concentrated in India than I'd have predicted.** Four listings in 30 days at three different companies — that's a higher density per million tech jobs than I'd expect to see in a comparable EU run. Likely driver: India is the natural delivery hub for US-HQ B2B AI products that need on-the-ground customer integration.
2. **"Founding" titles are rarer than US.** Only 2 founding roles in the full deduped 156-row pool, vs. what you'd see in US/EU runs. Indian early-stage companies use "Founding" framing less often.
3. **Salary disclosure remains rare.** Only ~12% of rows had any salary data, mostly from Lever-hosted boards. This is a structural India-market gap, not a pipeline gap.

---

## Pipeline assessment

### Did Apify give good coverage?

**Mixed, source-dependent.** The ATS aggregator gave excellent coverage of US-HQ frontier-AI companies hiring in India — those companies use modern ATS systems (Greenhouse, Lever, Ashby) and the actor pulls cleanly from them. Coverage of **Indian-HQ startups** posting emerging roles is weaker because those companies often use Naukri, Instahyre, or their own custom boards which the actor doesn't hit. LinkedIn fills some of this gap but mostly with noise.

**The dataset did not skew toward standard titles** — but only because I biased the LinkedIn search keywords toward emerging vocabulary upfront. If you ran an unbiased "all India tech jobs last 30 days" query, you'd see 70%+ standard-title results from IT services. The lesson is that the **search-side filter matters as much as the source choice** for emerging-role density.

### Total cost: $0.167 USD

Itemized: $0.110 LinkedIn + $0.015 ATS + $0.042 YC. Roughly 3% of the $5 cap.

### Scaled cost projections

| Volume | LinkedIn-heavy mix | ATS-anchored mix |
|---|---|---|
| 5,000 postings/month | ~$3.50 | ~$2.00 |
| 50,000 postings/month | ~$35 | ~$20 |

These are direct event-based charges. Apify also bills compute (memory × runtime); for the scrapers used here, that's typically 10–20% on top — roughly $25/month for 50K postings on the ATS-anchored mix. Add a 30% buffer for retries on transient failures.

**Critical caveat:** the LinkedIn actor has a 150-result minimum charge per run. If you run many narrow keyword searches, each one bills 150 even if it returns 30 results. You'll want to consolidate searches and rely on built-in dedup to stay efficient.

### Source-by-source verdict

| Source | Verdict | Reason |
|---|---|---|
| `jobo.world/ats-jobs-search` | **Anchor.** Use as primary. | 82% emerging-density, clean schema, 99.7% historical success, $0.0003/result is the best price-to-value in the test. |
| `cheap_scraper/linkedin-job-scraper` | **Supplement only.** | 24% emerging-density. Useful for breadth (covers mid-market and Indian-HQ companies not on modern ATS) but heavy noise. The 150-result minimum charge is a real cost driver if you split into many keyword searches. |
| `parsebird/yc-jobs-scraper` | **Drop.** | Returned 15 India-tagged jobs but all were >30 days old. WaaS scraping doesn't index recently enough on the India filter. |

### Recommended source mix at scale

1. **Anchor** on `jobo.world/ats-jobs-search` for Greenhouse + Lever + Ashby + Workable coverage. ~$0.0003/result.
2. **Supplement** with `cheap_scraper/linkedin-job-scraper` running a small set of consolidated keyword sweeps (5–10 keywords per run, one run/day). Don't try to run 30 narrow searches — minimum-charge math gets ugly.
3. **For Greenhouse and Lever specifically:** consider going direct. Both have free public board APIs (`https://boards.greenhouse.io/{company}.json` and `https://api.lever.co/v0/postings/{company}`). The ATS aggregator is more convenient (one endpoint, normalized schema, multi-source) but at scale the direct APIs are cheaper. **Apify earns its keep on LinkedIn (no public API) and on convenience-priced multi-ATS aggregation; for direct ATS sources the math may flip if you have engineering bandwidth.**
4. Add Wellfound and Naukri actors for India-specific startup and mid-market coverage that this test didn't capture. (`sovereigntaylor/wellfound-scraper` is free; Naukri actors should be vetted for India coverage.)

### Data quality issues observed

- **ATS aggregator mis-tagged 7 of 50 rows** — some non-India locations were stamped with `country: "India"` (e.g., "Latin America" with state "Madhya Pradesh"). I caught these with a post-filter on actual location text but a production pipeline needs the same defense.
- **LinkedIn `workType` field returns the company's industry sector**, not the work-from-home type. Useless as-is. Had to infer remote/hybrid/onsite from the job description.
- **Salary data is mostly null.** LinkedIn returns empty arrays for ~95% of postings. Only Lever-hosted boards reliably surface compensation ranges. Don't build features that require salary unless you accept ~12% coverage.
- **Dedup is non-trivial.** Same company posts the same role on its Greenhouse board (caught by ATS actor) and on LinkedIn (caught by LinkedIn actor) with slightly different titles. Fuzzy match on (normalized_company, normalized_title) with a 0.80 cutoff worked, but I had to also handle "Senior X" / "X" prefix variants and IT-services companies that recycle one job_id across multiple "office locations" as separate postings. About 18% of pre-dedup rows were duplicates.
- **Recruiter intermediaries** (Weekday, Crossing Hurdles, Daccan AI Experts) post legitimate roles but mask the actual hirer. They scored well on emerging-titles but the data quality is lower because the underlying company isn't disclosed. Flagged as `company_type: "intermediary-or-services"` in the dataset.

### LinkedIn ToS

The Apify LinkedIn actor scrapes public job-search pages without authentication. LinkedIn's ToS prohibits automated access to its services; the legal landscape (post-hiQ v. LinkedIn) is unsettled. I'd treat LinkedIn data as an at-your-own-risk supplement to a primary pipeline anchored on first-party ATS sources, not as the foundation. Flagged once, not lectured.

### Would I recommend Apify as the primary ingestion layer?

**For LinkedIn: yes** — there's no good alternative.

**For ATS sources: only as a starting point.** The ATS aggregator is genuinely good and the right choice for a v1 pipeline. But once you're confident in the source mix and want to drive cost down, switch the Greenhouse and Lever portion to direct API calls. Keep Apify for Workday, Workable, BambooHR, and the long tail of less-common ATS systems where direct API access requires per-customer credentials.

**For YC: no** — the actor's index isn't fresh enough for a 30-day window. Go direct to `workatastartup.com` or use the YC company directory + Greenhouse boards.

---

## Files in this delivery

- `dataset.csv` / `dataset.json` — the curated 50 rows (40 highest-scoring + 10 contrast). All fields per spec.
- `full_dedup.json` — all 156 deduped rows with the same schema, useful for distribution analysis.
- `stats.json` — score histograms, per-source emerging density, skill-lift table, city distribution.
- `normalize.py` — the runnable pipeline (filtering, dedup, scoring). Re-run if you tweak the rubric or add sources.
- `raw/` — the raw actor outputs as returned by Apify, for audit and reproducibility.
