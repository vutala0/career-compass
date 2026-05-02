# Run #3 — Customer-Function Emerging Probe

**Run date:** 2026-05-02 · **Spend:** $0.14 of $0.50 budget · **Sources:** 1 LinkedIn run + 1 ATS run

## Verdict

**The customer-emerging gap from run #2 was ~70% query artifact, ~30% real market gap.** Targeted queries surfaced 25 deduped customer-emerging roles in 30 days — a healthy signal that run #2's broad sweep missed because standard CSM/Account Manager titles dominated the keyword distribution. But several specific titles I expected to find are genuinely absent from the Indian market in this window.

## Did we find emerging customer roles? Yes — 25.

Score distribution (all 25 are customer-side, role_family = "customer"):

| Score | Count | What's there |
|---|---|---|
| 8 | 6 | Engagement Manager Strategic Accounts (Postman), Senior Lifecycle Growth Manager (Ethos Life), Growth & Lifecycle Marketing Manager (Blink Health), Head of Customer Operations (Laundryheap), Senior Engagement Manager (WPP Media), Associate Customer Program Manager (Fictiv) |
| 7 | 8 | CS Operations Analyst (Onit), Customer Operations Manager (Innovapptive), Solutions Consultant (Razorpay), Customer Success Operations Specialist (Pine Labs), AI Implementation Manager (Sutra.AI), Implementation Manager (CUBE), Senior Engagement Manager (Quantiphi), Growth Operations Specialist (Airwallex) |
| 6 | 8 | Multiple "Analyst, Customer Success Operations" (hackajob, Colt), Customer Success Operations Coordinator (Forbes Advisor), Customer Operations Analyst (MoonPay), Customer Experience Specialist (Nielsen), Customer Operations Specialist (SITA, Fieldwire), Customer Success Advisor (Safe Security) |
| 3 | 3 | Borderline cases that snuck through filter (Implementation Engineering Manager, BI-flavored Customer Experience analysts) |

**88% of the dataset (22/25) scored emerging (≥6).** None scored 9 or 10 because no Founding CSM / AI Customer Operations Engineer titles appeared.

## Titles that surfaced but weren't in run #2

Cross-referencing run #2's 32 customer rows: **none of these 25 appear there** (run #2's customer bucket was almost entirely standard "Customer Success Manager" / "Account Manager" / "Customer Support Lead").

The newly-surfaced patterns:
1. **Customer Success Operations** as a distinct sub-discipline — 5 companies (Pine Labs, Onit, hackajob, Colt, Forbes Advisor). The "Analyst, Customer Success Operations" job ladder is forming in India.
2. **Customer Operations** (broader) — 5 more (Laundryheap, Innovapptive, MoonPay, SITA, Fieldwire). Distinct from CSM and from Customer Support.
3. **Engagement Manager** — 3 (Postman, Quantiphi, WPP Media). Hybrid CS/strategic-account role.
4. **Lifecycle Marketing/Growth Manager** — 2 (Ethos Life, Blink Health). Customer-tilted marketing.
5. **AI Implementation Manager** at Sutra.AI — a single occurrence but a noteworthy emerging variant; AI-startups creating customer-facing AI-implementation roles.
6. **Implementation Manager / Lead** — 2 (CUBE, Sutra.AI).
7. **Solutions Consultant** at Razorpay — customer-side post-sales, not pre-sales.
8. **Growth Operations Specialist** at Airwallex — emerging cross-domain role.

## Real market gaps (not artifacts)

Despite explicit targeted searches, these returned **zero India hits**:

- **Customer Marketing Manager** — zero. The role exists in US/EU; not yet in India in this window.
- **Customer Insights Manager** — zero. Bundled into BI/Analytics roles instead.
- **Customer Onboarding Manager** as a discrete role — zero. Onboarding is bundled into CSM responsibilities; one "Onboarding Coach - Guest Experience" appeared at a hospitality co. but that's a different concept.
- **Founding CSM / First CS Hire** — zero. Founding-tier titles are concentrated in eng + generalist (Founder's Office) in India; not customer.
- **Account-Based Customer Success** — zero.

## Honest assessment of the gap

The run #2 result of "0% emerging customer roles" was misleading. **There IS an emerging customer tier in India** — the most populated being CS Operations and Customer Operations specialties. The reason run #2 missed them:

- Run #2's broad "Customer Success Manager India" keyword returned mostly standard CSM titles, drowning out the operations sub-specialty.
- The ATS aggregator with `customer success` query also surfaced standard CSM more often than CSOps.
- Roles like "Engagement Manager" don't contain "customer" in the title and so weren't matched by run #2's customer keywords; they ended up under sales or operations bucket if they got through at all.

**Implication for the product:** Customer Success Operations / Customer Operations is a discoverable career path for the persona — about 10–15 distinct companies hiring at any given time in India. Bundle these as a discovery cluster, not as variants of "Customer Success Manager."

**Implication for the pipeline:** Broad keywords alone don't surface emerging sub-specialties. Either run targeted sweeps per-bucket (as in this run) or post-process the broad sweep with specialty-specific title patterns. Recommend the latter for cost.

## Cost summary

| Item | Cost |
|---|---|
| LinkedIn (1 run, 150 results) | $0.110 |
| ATS aggregator (1 run, 100 results) | $0.030 |
| **Total** | **$0.140** |

28% of the $0.50 cap. The probe answered the question for under 5% of run #2's marginal extra spend if integrated into the broader pipeline.

## Files

- `dataset.json` / `dataset.csv` — 25 customer-emerging rows, schema matches runs #1 and #2
- `stats.json` — score distribution and title-pattern frequencies
- `normalize_run3.py` — runnable customer-only filter + scorer
- `raw/` — original Apify outputs

Merging this into the run #2 corpus brings the customer bucket from 32 (all standard) to 57 (32 standard + 25 emerging), restoring proper signal for that function.
