"""
Run #3 — Customer-function emerging-roles probe.

Single-purpose: filter to customer-side emerging variants ONLY, score them,
dedupe, output. Schema matches run #2 for clean merge.
"""
import json, re, csv
from datetime import datetime, timezone
from difflib import SequenceMatcher
from collections import Counter

OUT = "/sessions/compassionate-stoic-hawking/mnt/career-compass/apify-validation-run3-customer-2026-05-02"
TODAY = datetime(2026, 5, 2, tzinfo=timezone.utc)

linkedin_raw = json.load(open(f"{OUT}/raw/linkedin.json"))["items"]
ats_raw      = json.load(open(f"{OUT}/raw/ats.json"))["items"]

INDIA_CITIES = {"bangalore","bengaluru","hyderabad","pune","mumbai","delhi","gurugram","gurgaon",
                "noida","chennai","kolkata","ahmedabad","jaipur","kochi","thiruvananthapuram",
                "trivandrum","warangal","indore","chandigarh","delhi ncr"}

def is_in_india(loc):
    if not loc: return False
    t = loc.lower()
    if "india" in t: return True
    if any(c in t for c in INDIA_CITIES): return True
    if re.search(r'\bIN\b', loc): return True
    return False

def normalize_company(c):
    if not c: return ""
    c = c.lower().strip()
    c = re.sub(r"\b(pvt|private|ltd|limited|llc|inc|corporation|corp|technologies|technology|systems|software|labs?|india|in)\b\.?", "", c)
    c = re.sub(r"[^\w\s]", " ", c)
    c = re.sub(r"\s+", " ", c).strip()
    return c

def normalize_title(raw):
    if not raw: return ""
    t = re.sub(r"[\(\[\{].*?[\)\]\}]", "", raw)
    t = re.sub(r"\s*[-\u2013\u2014|/]\s*.*$", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^(senior|sr\.?|junior|jr\.?|lead|principal|staff|head of|director|manager,?|associate)\s+", "", t, flags=re.I)
    return t.strip()

def detect_seniority(title, hint=""):
    t = (title or "").lower(); h = (hint or "").lower()
    if "intern" in h or "intern" in t: return "intern"
    if "junior" in h or "junior" in t or "associate" in h: return "junior"
    if "principal" in t: return "principal"
    if "staff" in t: return "staff"
    if any(k in t for k in ["senior","sr.","sr "]): return "senior"
    if any(k in t for k in ["head of","director","vp","chief"]) or "lead" in h: return "lead"
    if "lead" in t: return "lead"
    if "manager" in t: return "mid"
    if "founding" in t: return "senior"
    return "unknown"

# ---------- Customer-emerging include / exclude filter ----------
INCLUDE_PATTERNS = [
    r"\bcustomer success operations\b", r"\bcs ops\b", r"\bcsops\b",
    r"\bcustomer marketing\b",
    r"\bcustomer experience\b(?!.*(engineer|developer))",  # CX manager/specialist/analyst, not engineer
    r"\bcustomer insights?\b",
    r"\bcustomer onboarding\b",
    r"\bcustomer lifecycle\b",
    r"\bcustomer retention\b",
    r"\bimplementation\b.*(specialist|lead|manager|consultant)",
    r"\bengagement manager\b",
    r"\bfounding (customer|cs|csm)\b",
    r"\bfirst (cs|csm) hire\b",
    r"\baccount[- ]based customer success\b",
    r"\bcustomer operations\b",
    r"\bcustomer program manager\b",
    r"\blifecycle (manager|growth|marketing)\b",
    r"\bonboarding (coach|manager|lead)\b",
    r"\bgrowth operations\b",  # emerging crossover
    r"\bcustomer success advisor\b",
    r"\bsolution(s)? consultant\b(?!.*(pre[- ]?sales|sales))",  # customer-side only
]

EXCLUDE_PATTERNS = [
    r"\b(software|backend|frontend|full[- ]?stack|devops|sre|ml engineer|ai engineer|data scientist)\b",
    r"\b(account executive|business development|sdr|bdr|sales manager|sales executive|sales rep|inside sales)\b",
    r"\bcustomer (support|service|care)\b(?!.*(operations|specialist|lead|insights|experience|marketing|engineer manager))",
    r"\bcustomer success (engineer|network engineer|sales engineer)\b",  # tech-coding side
    r"\bsupply chain\b", r"\bcustomer support associate\b",
    r"\btechnical support\b",
]

def keep_customer_emerging(title, desc=""):
    if not title: return False
    t = title.lower()
    # Must match at least one INCLUDE
    matched_include = any(re.search(p, t) for p in INCLUDE_PATTERNS)
    if not matched_include:
        return False
    # And no EXCLUDE
    if any(re.search(p, t) for p in EXCLUDE_PATTERNS):
        return False
    return True

# ---------- Emerging score (non-tech rubric, customer-anchored) ----------
T4_KEYS = [
    "founding customer success","founding cs","founding csm","first cs hire",
    "customer success operations engineer","ai customer operations","ai cs ops",
    "account-based customer success","abm customer success",
]
T3_KEYS = [
    "customer success operations","csops","cs ops","cs operations",
    "customer marketing manager","customer marketing","customer marketing lead",
    "customer experience manager","customer experience specialist","customer experience analyst",
    "customer insights manager","customer insights",
    "customer lifecycle manager","customer lifecycle","lifecycle marketing","lifecycle growth",
    "customer retention manager","customer retention",
    "implementation lead","implementation specialist","implementation manager","implementation consultant",
    "engagement manager",
    "customer onboarding manager","onboarding coach","onboarding lead",
    "customer program manager","customer operations",
    "growth operations","customer success advisor",
    "solutions consultant",
]
T1_KEYS = [
    "customer success manager","csm","customer success specialist","customer success associate",
    "account manager","customer support",
]

EARLY_STAGE_HINTS = ["seed","series a","series-a","stealth","early-stage","early stage","founding team","first hire","yc"]
AI_HINTS = ["llm","gen ai","genai","generative ai","agentic","ai-native","ai native"]

def emerging_score_and_reason(title, company, desc):
    t = (title or "").lower()
    c = (company or "").lower()
    d = (desc or "")[:5000].lower()
    early = any(h in d for h in EARLY_STAGE_HINTS) or any(h in c for h in ["stealth","ventures"])
    ai_native = any(h in d for h in AI_HINTS)

    matched = None
    for k in T4_KEYS:
        if k in t: matched = ("T4", k); break
    if not matched:
        for k in T3_KEYS:
            if k in t: matched = ("T3", k); break
    if not matched:
        for k in T1_KEYS:
            if k in t: matched = ("T1", k); break

    reasons = []
    if matched and matched[0] == "T4":
        score = 9 if not early else 10
        reasons.append(f"genuinely-new title '{matched[1]}'")
    elif matched and matched[0] == "T3":
        score = 6
        if any(x in t for x in ["senior","sr.","lead","head of","director","manager"]):
            score = 7
        if early or ai_native:
            score = min(8, score + 1)
            reasons.append(f"rising title '{matched[1]}' + early-stage/AI context")
        else:
            reasons.append(f"rising title '{matched[1]}'")
    elif matched and matched[0] == "T1":
        score = 1
        reasons.append(f"standard title '{matched[1]}'")
    else:
        score = 3
        reasons.append("no canonical match")

    if "founding" in t:
        score = min(10, max(score, 9))
        reasons.append("founding-role title")

    if any(k in t for k in ["ai customer","ai cs"]):
        score = min(10, max(score, 9))
        reasons.append("AI-customer cross-domain")

    return score, "; ".join(reasons)

# ---------- Skills extraction (CS-tilted) ----------
SKILL_VOCAB = [
    # CS-specific
    "gainsight","churnzero","catalyst","totango","vitally","planhat","intercom","zendesk","freshdesk","drift","helpscout",
    "salesforce","hubspot","outreach","salesloft","apollo","sales navigator",
    "looker","tableau","power bi","metabase","mode","mixpanel","amplitude","heap","segment","pendo",
    "notion","asana","jira","monday","clickup","airtable","confluence","slack","linear",
    "iterable","braze","klaviyo","customer.io","sendgrid",
    "excel","sql","python",
    # Soft / domain
    "stakeholder management","cross-functional","project management","kpi","okr","go-to-market","gtm",
    "onboarding","renewal","upsell","cross-sell","expansion","qbr","csat","nps","churn","account health","account planning",
    "lifecycle","retention","activation","time to value","ttv","customer journey","journey mapping",
    "implementation","integration","change management","training","enablement",
    "saas","b2b","b2c","plg","product-led","enterprise","mid-market","smb",
    "data analysis","reporting","dashboards","scaling","operating model","process optimization","automation","workflow","sop",
]

def extract_skills(text, n=12):
    if not text: return []
    text_l = text.lower()
    found = Counter()
    for s in SKILL_VOCAB:
        if re.search(r"(?<![\w])" + re.escape(s) + r"(?![\w])", text_l):
            found[s] += 1
    canon = {"sales navigator":"linkedin sales navigator"}
    bag, seen = [], set()
    for s,_ in found.most_common():
        norm = canon.get(s,s)
        if norm not in seen: bag.append(norm); seen.add(norm)
    return bag[:n]

SERVICE_INTERMEDIARIES = {
    "weekday","crossing hurdles","tech mahindra","accenture","infosys","tcs","wipro","cognizant",
    "capgemini","mphasis","persistent systems","hcl","ltimindtree","mindtree","virtusa","hexaware",
    "iqvia","dxc technology","randstad","adecco","manpower","kelly services","careernet","abc consultants",
    "kornferry","heidrick","spencer stuart","russell reynolds","upraised","instahyre",
}
def quality_flag(co):
    nc = normalize_company(co)
    for s in SERVICE_INTERMEDIARIES:
        if s in nc: return "intermediary-or-services"
    return "direct"

def build_li(it):
    title = it.get("jobTitle","")
    location = it.get("location","")
    if not is_in_india(location): return None
    desc = it.get("jobDescription","") or ""
    if not keep_customer_emerging(title, desc): return None
    company = it.get("companyName","")
    pub = it.get("publishedAt","")
    posted_date = pub[:10] if pub else None
    rt = "unknown"
    dl = (desc + " " + location).lower()
    if "remote" in dl or "work from home" in dl: rt = "remote"
    elif "hybrid" in dl: rt = "hybrid"
    elif "onsite" in dl or "on-site" in dl: rt = "onsite"
    salary = it.get("salaryInfo")
    salary_range = " - ".join(salary) if isinstance(salary, list) and salary else None
    score, reason = emerging_score_and_reason(title, company, desc)
    return {
        "source": "cheap_scraper/linkedin-job-scraper",
        "company": company,
        "title_raw": title,
        "title_normalized": normalize_title(title),
        "seniority": detect_seniority(title, it.get("experienceLevel","")),
        "role_family": "customer",
        "location": location,
        "remote_type": rt,
        "posted_date": posted_date,
        "skills_extracted": extract_skills(title + " " + desc),
        "salary_range": salary_range,
        "emerging_score": score,
        "emerging_reason": reason,
        "url": it.get("jobUrl",""),
        "company_type": quality_flag(company),
    }

def build_ats(it):
    title = it.get("title","")
    co = it.get("company")
    company = co.get("name","") if isinstance(co, dict) else (co or "")
    locs = it.get("locations") or []
    if not locs: return None
    in_india = any((l.get("country") or "").lower() == "india" for l in locs)
    if in_india:
        india_locs = [l for l in locs if (l.get("country") or "").lower()=="india"]
        if india_locs and any(any(bad in (l.get("location") or "").lower() for bad in ["latin america","europe","united states","united kingdom","canada","australia"]) for l in india_locs):
            if not any(any(c in (l.get("location") or "").lower() for c in INDIA_CITIES) or "india" in (l.get("location") or "").lower() for l in india_locs):
                in_india = False
    if not in_india: return None
    desc = it.get("description","") or ""
    if not keep_customer_emerging(title, desc): return None
    loc_str = "; ".join([l.get("location") or "" for l in locs if (l.get("country") or "").lower()=="india"])
    posted_date = (it.get("date_posted") or "")[:10] or None
    is_remote = it.get("is_remote", False)
    wpt = (it.get("workplace_type") or "").lower()
    rt = "remote" if is_remote else (wpt if wpt in ("hybrid","onsite") else "unknown")
    comp = it.get("compensation") or {}
    salary_range = None
    if isinstance(comp, dict):
        if comp.get("raw_text"): salary_range = comp.get("raw_text")
        elif comp.get("min") and comp.get("max"):
            salary_range = f"{comp.get('currency','')} {comp.get('min')}-{comp.get('max')}".strip()
    score, reason = emerging_score_and_reason(title, company, desc)
    return {
        "source": f"jobo.world/ats-jobs-search ({it.get('source','?')})",
        "company": company,
        "title_raw": title,
        "title_normalized": normalize_title(title),
        "seniority": detect_seniority(title, it.get("experience_level","")),
        "role_family": "customer",
        "location": loc_str,
        "remote_type": rt,
        "posted_date": posted_date,
        "skills_extracted": extract_skills(title + " " + desc),
        "salary_range": salary_range,
        "emerging_score": score,
        "emerging_reason": reason,
        "url": it.get("listing_url",""),
        "company_type": quality_flag(company),
    }

# Build
rows = []
li_kept = ats_kept = 0
for it in linkedin_raw:
    r = build_li(it)
    if r: rows.append(r); li_kept += 1
for it in ats_raw:
    r = build_ats(it)
    if r: rows.append(r); ats_kept += 1
print(f"LinkedIn raw {len(linkedin_raw)} → kept {li_kept}")
print(f"ATS raw      {len(ats_raw)} → kept {ats_kept}")
print(f"Pre-dedup total: {len(rows)}")

# 30-day filter
def within_30d(d):
    if not d: return True
    try:
        dt = datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return (TODAY - dt).days <= 32
    except: return True
rows = [r for r in rows if within_30d(r["posted_date"])]
print(f"After 30-day filter: {len(rows)}")

# Dedup
def title_key(t):
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", (t or "").lower())).strip()
def fuzz(a,b): return SequenceMatcher(None,a,b).ratio()

def dedupe(rows):
    kept, seen = [], []
    for r in rows:
        nc = normalize_company(r["company"])
        nt = title_key(r["title_normalized"])
        loc = (r["location"] or "").lower()
        is_dup = False
        for idx, (kc, kt, kloc) in enumerate(seen):
            if not nc or not kc: continue
            if nc != kc and fuzz(nc, kc) < 0.92: continue
            tm = fuzz(nt, kt)
            loc_match = loc and kloc and (loc.split(",")[0].strip() == kloc.split(",")[0].strip())
            if tm >= 0.80 or (tm >= 0.65 and loc_match):
                # Prefer ATS over LinkedIn
                pri = lambda s: 3 if "jobo.world" in s else 1
                if pri(r["source"]) > pri(kept[idx]["source"]):
                    kept[idx] = r; seen[idx] = (nc, nt, loc)
                is_dup = True; break
        if not is_dup:
            kept.append(r); seen.append((nc, nt, loc))
    return kept

rows = dedupe(rows)
rows.sort(key=lambda r: (-r["emerging_score"], -(datetime.strptime(r["posted_date"],"%Y-%m-%d") if r["posted_date"] else datetime(1970,1,1)).timestamp()))
print(f"After dedup: {len(rows)}")

with open(f"{OUT}/dataset.json","w") as f:
    json.dump(rows, f, indent=2, default=str)
fieldnames = ["source","company","company_type","title_raw","title_normalized","seniority","role_family","location","remote_type","posted_date","skills_extracted","salary_range","emerging_score","emerging_reason","url"]
with open(f"{OUT}/dataset.csv","w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for r in rows:
        rr = dict(r); rr["skills_extracted"] = "; ".join(r["skills_extracted"])
        w.writerow(rr)

# Stats
score_h = Counter([r["emerging_score"] for r in rows])
print("\n== Score histogram ==")
for s in sorted(score_h): print(f" {s}: {'#'*score_h[s]} ({score_h[s]})")

print("\n== All kept rows ==")
for r in rows:
    print(f" [{r['emerging_score']}] {r['title_raw'][:60]:<60} | {r['company'][:25]:<25} | {r['location'][:25]}")

# Save brief stats
import json as _j
stats = {
    "raw_counts": {"linkedin": len(linkedin_raw), "ats": len(ats_raw)},
    "kept_after_filter_pre_dedup": {"linkedin": li_kept, "ats": ats_kept},
    "final_count": len(rows),
    "score_histogram": dict(score_h),
    "estimated_cost_usd": round(0.005 + 150*0.0007 + 0.00005 + 100*0.0003, 4),
    "title_pattern_counts": {
        "customer success operations / csops": sum(1 for r in rows if any(k in r["title_raw"].lower() for k in ["customer success operations","csops","cs ops"])),
        "customer marketing": sum(1 for r in rows if "customer marketing" in r["title_raw"].lower()),
        "customer experience": sum(1 for r in rows if "customer experience" in r["title_raw"].lower()),
        "customer insights": sum(1 for r in rows if "customer insights" in r["title_raw"].lower()),
        "customer onboarding": sum(1 for r in rows if "customer onboarding" in r["title_raw"].lower()),
        "customer lifecycle / lifecycle mgr": sum(1 for r in rows if "lifecycle" in r["title_raw"].lower()),
        "customer retention": sum(1 for r in rows if "retention" in r["title_raw"].lower()),
        "implementation": sum(1 for r in rows if "implementation" in r["title_raw"].lower()),
        "engagement manager": sum(1 for r in rows if "engagement manager" in r["title_raw"].lower()),
        "founding cs / csm": sum(1 for r in rows if "founding" in r["title_raw"].lower()),
        "customer operations / program": sum(1 for r in rows if "customer operations" in r["title_raw"].lower() or "customer program" in r["title_raw"].lower()),
    },
}
with open(f"{OUT}/stats.json","w") as f: _j.dump(stats, f, indent=2, default=str)
print(f"\nEstimated cost: ${stats['estimated_cost_usd']}")
