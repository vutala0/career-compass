"""
Run #2 normalizer — NON-TECH job postings (product, ops, customer, marketing,
data-analyst, design, sales, generalist).

Loads 5 raw files (1 LinkedIn + 4 ATS), filters to India + last 30 days,
applies non-tech emerging-score rubric, dedupes, and outputs:
  - dataset.json / dataset.csv (capped at 200)
  - full_dedup.json (everything that survived dedup, no cap)
  - stats.json (distributions)

Schema is identical to run #1's so the two pools can be merged.
"""
import json, re, csv
from datetime import datetime, timezone
from difflib import SequenceMatcher
from collections import Counter

OUT_DIR = "/sessions/compassionate-stoic-hawking/mnt/career-compass/apify-validation-run2-2026-05-02"
TODAY = datetime(2026, 5, 2, tzinfo=timezone.utc)

# ---------- Load raw ----------
linkedin_raw = json.load(open(f"{OUT_DIR}/raw/linkedin.json"))["items"]
ats_files = [
    ("ats_product_generalist", json.load(open(f"{OUT_DIR}/raw/ats_product_generalist.json"))["items"]),
    ("ats_ops_customer",       json.load(open(f"{OUT_DIR}/raw/ats_ops_customer.json"))["items"]),
    ("ats_marketing_analyst",  json.load(open(f"{OUT_DIR}/raw/ats_marketing_analyst.json"))["items"]),
    ("ats_sales_design",       json.load(open(f"{OUT_DIR}/raw/ats_sales_design.json"))["items"]),
]

# ---------- India filter ----------
INDIA_CITIES = {
    "bangalore","bengaluru","hyderabad","pune","mumbai","delhi","gurugram",
    "gurgaon","noida","chennai","kolkata","ahmedabad","jaipur","kochi",
    "thiruvananthapuram","trivandrum","warangal","indore","chandigarh",
    "delhi ncr"
}

def is_in_india(loc_text):
    if not loc_text: return False
    t = loc_text.lower()
    if "india" in t: return True
    if any(c in t for c in INDIA_CITIES): return True
    if re.search(r'\bIN\b', loc_text): return True
    return False

# ---------- Title / company normalization ----------
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

SENIORITY_RULES = [
    (r"\b(intern|trainee|graduate|fresher)\b", "intern"),
    (r"\b(junior|associate|jr\.?)\b", "junior"),
    (r"\b(principal|distinguished)\b", "principal"),
    (r"\b(staff)\b", "staff"),
    (r"\b(senior|sr\.?)\b", "senior"),
    (r"\b(head of|director|vp|vice president|chief|cmo|coo|cfo|cpo)\b", "lead"),
    (r"\b(lead)\b", "lead"),
    (r"\b(manager)\b", "mid"),  # "Manager" alone is mid in non-tech
    (r"\b(founding|founder)\b", "senior"),
]
def detect_seniority(title, level_hint=""):
    t = (title or "").lower()
    h = (level_hint or "").lower()
    if h:
        if "intern" in h: return "intern"
        if "entry" in h or "junior" in h: return "junior"
        if "associate" in h: return "junior"
        if "mid" in h: return "mid"
        if "senior" in h: return "senior"
        if "staff" in h: return "staff"
        if "principal" in h: return "principal"
        if "director" in h or "lead" in h or "head" in h: return "lead"
    for pat, sen in SENIORITY_RULES:
        if re.search(pat, t):
            return sen
    return "unknown"

# ---------- Role family (8 non-tech buckets) ----------
def role_family(title):
    t = (title or "").lower()
    if "founding" in t or "0 to 1" in t or "0-1 hire" in t:
        return "generalist"
    if any(k in t for k in ["chief of staff","cos ","founder's office","founders office","founder office"]):
        return "generalist"
    if any(k in t for k in ["product operations","product ops","product manager","product marketing","prd","apm","pm intern","group product"]):
        return "product"
    if any(k in t for k in ["business operations","biz ops","strategy and operations","strategy operations","strategy & operations","trust and safety","trust & safety","trust&safety","operations manager","operations associate","marketplace operations","program manager","operations specialist","operations lead"]):
        return "operations"
    if any(k in t for k in ["customer success","customer marketing","account manager","implementation","customer support","customer experience","client success","onboarding manager"]):
        return "customer"
    if any(k in t for k in ["marketing","content","brand","seo","demand gen","performance marketing","community","copywriter","communications","growth marketer","social media"]):
        return "marketing"
    if any(k in t for k in ["business analyst","data analyst","marketing analyst","operations analyst","strategy analyst","financial analyst","insights analyst","reporting analyst","analytics specialist","analyst"]):
        return "data-analyst"
    if any(k in t for k in ["product designer","ux designer","ui designer","user researcher","ux researcher","design operations","design ops","interaction designer","visual designer","graphic designer","product design"]):
        return "design"
    if any(k in t for k in ["account executive","business development","sales development","sdr","bdr","partnerships","solutions consultant","sales engineer","sales executive","inside sales","field sales","key account","enterprise sales","strategic accounts"]):
        return "sales"
    return "other"

# ---------- Tech-role exclusion (run #1 territory) ----------
TECH_TITLE_PATTERNS = [
    r"\b(software|backend|front[- ]?end|full[- ]?stack|devops|sre|platform engineer)\b",
    r"\b(ai engineer|ml engineer|machine learning engineer|ml ops engineer|data scientist|data engineer|ml research)\b",
    r"\b(forward deployed|founding engineer|founding swe|founding ai|founding ml)\b",
    r"\b(applied ai|ai/ml|ai systems|prompt engineer|llm engineer|agent engineer|rag engineer)\b",
    r"\bsoftware development engineer\b|\bsde\b",
    r"\b(qa engineer|test engineer|sdet|automation engineer)\b",
    r"\b(android engineer|ios engineer|mobile engineer|react native engineer)\b",
    r"\b(security engineer|infrastructure engineer|cloud engineer|network engineer|systems engineer)\b",
    r"\b(developer|engineer)\b.*(python|java|javascript|node|react|kubernetes|kafka)\b",
]
def is_tech_role(title, desc=""):
    t = (title or "").lower()
    for pat in TECH_TITLE_PATTERNS:
        if re.search(pat, t):
            return True
    return False

# ---------- Emerging-score rubric (NON-TECH calibrated) ----------
T4_KEYS = [
    "founding operator","founding marketer","founding csm","founding customer",
    "founding designer","founding sales","founding partner","founding gtm",
    "founding product","founding chief of staff","founding analyst",
    "ai product operator","gtm engineer","growth operator",
    "customer success operations engineer","community operations",
    "trust safety specialist","trust and safety analyst",
    "0 to 1 hire","0-1 product","0-1 marketing",
]
T3_KEYS = [
    "product operations","product ops",
    "marketing operations","marketing ops","revops","revenue operations",
    "customer marketing","customer marketing manager",
    "trust and safety","trust & safety","trust safety",
    "growth pm","growth product manager","growth marketer","growth product",
    "implementation specialist","implementation manager","implementation consultant",
    "user researcher","ux researcher",
    "design operations","design ops",
    "strategy and operations","strategy & operations","strategy operations",
    "business operations manager","biz ops",
    "chief of staff",
    "founder's office","founders office","founder office",  # Indian-market equivalent of CoS
    "partnerships manager","strategic partnerships",
    "solutions consultant","customer solutions",
    "demand generation","demand gen","abm",
    "community manager","community lead","community ops",
    "content strategist","content lead","content marketing manager",
    "brand marketing manager","brand strategy","brand manager",
    "performance marketing manager","performance marketing",
    "lifecycle marketing","lifecycle manager",
    "marketing analyst","strategy analyst","operations analyst","insights analyst",
    "category manager","category lead",
    "associate product manager","apm",
    "ai product manager","ai pm",
    "engagement manager",
    "people ops",
]
T2_KEYS = [
    "product manager","group product manager","senior product manager",
    "ux designer","product designer","ui designer",
    "account executive","business development manager","business development representative",
    "business analyst","data analyst",
    "customer success manager","csm",
    "sales development representative","sdr","bdr",
    "digital marketing manager","seo manager","sem manager",
    "marketing manager","content marketing","email marketing","social media manager",
    "key account manager",
]
T1_KEYS = [
    "sales executive","sales manager","tele sales","telesales","telecaller",
    "hr manager","hrbp","human resources","talent acquisition","recruiter",
    "operations manager","operations associate","operations executive",
    "account manager","accounts executive","accounts payable","accounts receivable",
    "customer support","customer service","customer care","customer support executive","customer success advisor",
    "executive assistant","office manager","admin",
    "accountant","finance manager","bookkeeper","financial controller","finance controller","treasury manager",
    "general manager","branch manager","regional manager","area manager","store manager",
    "business associate",
    "field officer","field sales","field executive",
    "content writer","content executive","copy editor","translator","copywriter",
    "graphic designer","visual designer",
    "delivery manager","project manager","program manager","senior program manager",
    "compliance analyst","compliance manager","risk manager",
    "library manager","nursing","change manager",
    "marketing specialist","marketing executive","marketing associate",
    "associate director","senior manager",
]

EARLY_STAGE_HINTS = ["seed","series a","series-a","stealth","yc","y combinator","early-stage","early stage","founding team","first hire","0 to 1","0-1"]
AI_PRODUCT_HINTS = ["llm","gen ai","genai","generative ai","agentic","ai-native","ai native"]

def emerging_score_and_reason(title, company, desc):
    t = (title or "").lower()
    c = (company or "").lower()
    d = (desc or "")[:5000].lower()
    score = 1
    reasons = []

    matched = None
    for k in T4_KEYS:
        if k in t:
            score = 9
            matched = ("T4", k); break
    if not matched:
        for k in T3_KEYS:
            if k in t:
                score = 6
                matched = ("T3", k); break
    if not matched:
        for k in T2_KEYS:
            if k in t:
                score = 4
                matched = ("T2", k); break
    if not matched:
        for k in T1_KEYS:
            if k in t:
                score = 1
                matched = ("T1", k); break

    early_stage_signal = any(h in d for h in EARLY_STAGE_HINTS) or any(h in c for h in ["stealth","ventures","seed"])
    ai_native_signal = any(h in d for h in AI_PRODUCT_HINTS)

    if matched and matched[0] == "T4":
        if early_stage_signal: score = min(10, score + 1)
        reasons.append(f"title contains '{matched[1]}'")
    elif matched and matched[0] == "T3":
        # T3 spans 6-8: default 6, +1 for senior/lead tier, +1 for early-stage/AI context
        score = 6
        if any(x in t for x in ["senior","sr.","lead","head of","director","manager"]):
            score = 7
        if early_stage_signal or ai_native_signal:
            score = min(8, score + 1)
            reasons.append(f"rising-tier '{matched[1]}' + early-stage/AI-native context")
        else:
            reasons.append(f"rising-tier title term '{matched[1]}'")
    elif matched and matched[0] == "T2":
        score = 4
        if early_stage_signal: score = 5
        reasons.append(f"specialized established title '{matched[1]}'")
    elif matched and matched[0] == "T1":
        score = 1
        if early_stage_signal: score = 2
        reasons.append(f"standard title '{matched[1]}'")
    else:
        score = 3
        reasons.append("no canonical title match")

    # Founding boost (always)
    if "founding" in t:
        score = min(10, max(score, 9))
        reasons.append("founding-role title (cross-domain at startup)")

    # Cross-domain boost: AI + non-tech function
    if any(k in t for k in ["ai product","ai marketing","ai operations","ai customer","ai strategy"]):
        score = min(10, max(score, 8))
        reasons.append("AI cross-domain non-tech role")

    # Anti-signal: clear standard/legacy title
    if any(k in t for k in ["telecaller","telesales","field officer","field executive","branch manager","store manager","accounts payable"]):
        score = min(score, 1)

    if "trainee" in t or "intern" in t:
        score = min(score, 2)

    return score, "; ".join(reasons) if reasons else "default"

# ---------- Skills extraction (NON-TECH heavy) ----------
SKILL_VOCAB = [
    # Sales / GTM tools
    "salesforce","hubspot","marketo","mailchimp","pardot","outreach","salesloft","apollo",
    "linkedin sales navigator","sales navigator","zoominfo","lusha","crunchbase","gong","chorus",
    # CS / Support tools
    "intercom","zendesk","freshdesk","drift","helpscout","gainsight","churnzero","catalyst","totango","vitally","planhat",
    # Analytics / BI
    "looker","tableau","power bi","mode","metabase","snowflake","periscope","databricks","redshift","bigquery",
    "google analytics","ga4","mixpanel","amplitude","heap","segment","hotjar","fullstory","pendo",
    # Productivity / collab
    "notion","asana","jira","monday","clickup","airtable","confluence","slack","linear","trello","basecamp",
    # Design tools
    "figma","sketch","adobe xd","illustrator","photoshop","miro","maze","lookback","useberry","framer","whimsical",
    # Marketing automation / lifecycle
    "iterable","braze","klaviyo","customer.io","sendgrid","activecampaign",
    # Office / data
    "excel","google sheets","vba","pivot tables","sql","python","r ",
    # Soft skills / methodologies
    "stakeholder management","cross-functional","project management","prd","roadmap","kpi","okr","go-to-market","gtm",
    "a/b testing","experimentation","ab testing","user research","user interviews","usability testing","wireframing","prototyping","user flows",
    "seo","sem","ppc","content strategy","copywriting","branding","lead generation","lead gen","demand generation","email marketing","marketing automation","funnel","conversion","attribution","retention","acquisition",
    "cold outreach","prospecting","pipeline","discovery calls","sales cycle","quota","closing","negotiation","forecasting",
    "onboarding","renewal","upsell","cross-sell","expansion","qbr","csat","nps","churn","account health","account planning",
    "process optimization","automation","workflow","sop","operating model","scaling",
    "agile","scrum","waterfall","saas","b2b","b2c","plg","product-led","product led","sales-led","enterprise","mid-market","smb",
    "data analysis","reporting","dashboards","visualization","storytelling","executive presence",
]
def extract_skills(text, max_n=12):
    if not text: return []
    text_l = text.lower()
    found = Counter()
    for skill in SKILL_VOCAB:
        pat = r"(?<![\w])" + re.escape(skill) + r"(?![\w])"
        if re.search(pat, text_l):
            found[skill] += 1
    canon = {
        "sales navigator":"linkedin sales navigator","ab testing":"a/b testing",
        "lead gen":"lead generation","gtm":"go-to-market","product led":"product-led",
        "ga4":"google analytics",
    }
    bag, seen = [], set()
    for s,_ in found.most_common():
        norm = canon.get(s,s)
        if norm not in seen:
            bag.append(norm); seen.add(norm)
    return bag[:max_n]

# ---------- Service intermediaries ----------
SERVICE_INTERMEDIARIES = {
    "weekday","crossing hurdles","deccan ai experts","tech mahindra","accenture in india","accenture",
    "infosys","tcs","wipro","cognizant","capgemini","mphasis","persistent systems","l&t technology",
    "hcl","ltimindtree","mindtree","virtusa","hexaware","iqvia","dxc technology",
    "naukri","instahyre","randstad","adecco","manpower","kelly services","vito","careernet","abc consultants","kornferry","heidrick","spencer stuart","russell reynolds","upraised",
}
def quality_flag(company):
    nc = normalize_company(company)
    for s in SERVICE_INTERMEDIARIES:
        if s in nc:
            return "intermediary-or-services"
    return "direct"

# ---------- Per-source row builders ----------
def build_row_linkedin(it):
    title = it.get("jobTitle","")
    company = it.get("companyName","")
    location = it.get("location","")
    if not is_in_india(location): return None
    desc = it.get("jobDescription","") or ""
    if is_tech_role(title, desc): return None
    pub = it.get("publishedAt","")
    posted_date = pub[:10] if pub else None
    rt = "unknown"
    dl = (desc + " " + location).lower()
    if "remote" in dl or "work from home" in dl: rt = "remote"
    elif "hybrid" in dl: rt = "hybrid"
    elif "onsite" in dl or "on-site" in dl or "on site" in dl: rt = "onsite"
    salary = it.get("salaryInfo")
    salary_range = " - ".join(salary) if isinstance(salary, list) and salary else None
    score, reason = emerging_score_and_reason(title, company, desc)
    return {
        "source": "cheap_scraper/linkedin-job-scraper",
        "company": company,
        "title_raw": title,
        "title_normalized": normalize_title(title),
        "seniority": detect_seniority(title, it.get("experienceLevel","")),
        "role_family": role_family(title),
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

def build_row_ats(it, src_label):
    title = it.get("title","")
    co = it.get("company")
    company = co.get("name","") if isinstance(co, dict) else (co or "")
    locs = it.get("locations") or []
    in_india = False
    loc_str = ""
    if locs:
        india_locs = [l for l in locs if (l.get("country") or "").lower() == "india"]
        valid_locs = india_locs if india_locs else locs
        loc_str = "; ".join([l.get("location") or "" for l in valid_locs if l.get("location")])
        in_india = any((l.get("country") or "").lower() == "india" for l in locs)
        # Reject mis-tags: Latin America / Europe with country=India and clearly non-India city
        if in_india:
            india_loc_text = " ".join([(l.get("location") or "").lower() for l in india_locs]) if india_locs else ""
            if india_locs and any(any(bad in (l.get("location") or "").lower() for bad in ["latin america","europe","united states","united kingdom","canada","australia"]) for l in india_locs):
                # only reject if NO actually-india-city tag exists
                if not any(any(c in (l.get("location") or "").lower() for c in INDIA_CITIES) or "india" in (l.get("location") or "").lower() for l in india_locs):
                    in_india = False
    if not in_india: return None
    desc = it.get("description","") or ""
    if is_tech_role(title, desc): return None
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
        "source": f"jobo.world/ats-jobs-search ({it.get('source','?')}) [{src_label}]",
        "company": company,
        "title_raw": title,
        "title_normalized": normalize_title(title),
        "seniority": detect_seniority(title, it.get("experience_level","")),
        "role_family": role_family(title),
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

# ---------- Build rows ----------
rows = []
counts = {"linkedin": [0,0,0]}  # [raw, india_passed, tech_excluded]
counts["linkedin"][0] = len(linkedin_raw)
for it in linkedin_raw:
    r = build_row_linkedin(it)
    if r is None:
        # Determine reason
        if not is_in_india(it.get("location","")):
            pass
        elif is_tech_role(it.get("jobTitle",""), it.get("jobDescription","")):
            counts["linkedin"][2] += 1
        continue
    counts["linkedin"][1] += 1
    rows.append(r)

for label, items in ats_files:
    counts[label] = [len(items), 0, 0]
    for it in items:
        title = it.get("title","")
        loc_text = ""
        for l in (it.get("locations") or []):
            loc_text += (l.get("location") or "") + " "
        if not is_in_india(loc_text):
            continue
        if is_tech_role(title, it.get("description","")):
            counts[label][2] += 1
            continue
        r = build_row_ats(it, label)
        if r:
            counts[label][1] += 1
            rows.append(r)

print("=== Per-source: [raw, kept-after-india+tech-filter, excluded-as-tech] ===")
for k, v in counts.items():
    print(f" {k}: raw={v[0]}, kept={v[1]}, tech_excluded={v[2]}")
print(f"\nTotal pre-dedup: {len(rows)}")

# ---------- 30-day filter ----------
def within_30d(d):
    if not d: return True
    try:
        dt = datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return (TODAY - dt).days <= 32
    except: return True
rows = [r for r in rows if within_30d(r["posted_date"])]
print(f"After 30-day filter: {len(rows)}")

# ---------- Dedup ----------
def title_key(t):
    t = (t or "").lower()
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()

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
            comp_match = (nc == kc) or (fuzz(nc, kc) >= 0.92)
            if not comp_match: continue
            tm = fuzz(nt, kt)
            loc_match = (loc and kloc and (loc.split(",")[0].strip() == kloc.split(",")[0].strip()))
            if tm >= 0.80 or (tm >= 0.65 and loc_match):
                # Prefer ATS over LinkedIn (cleaner data)
                priority = {"jobo.world":3, "cheap_scraper":1}
                def src_pri(s):
                    for k,v in priority.items():
                        if k in s: return v
                    return 0
                if src_pri(r["source"]) > src_pri(kept[idx]["source"]):
                    kept[idx] = r
                    seen[idx] = (nc, nt, loc)
                is_dup = True
                break
        if not is_dup:
            kept.append(r); seen.append((nc, nt, loc))
    return kept

rows = dedupe(rows)
print(f"After dedup: {len(rows)}")

# Sort: by emerging_score desc, then by posted_date desc
def parse_date(d):
    try: return datetime.strptime(d,"%Y-%m-%d")
    except: return datetime(1970,1,1)
rows.sort(key=lambda r: (-r["emerging_score"], -parse_date(r["posted_date"] or "1970-01-01").timestamp()))

# ---------- Save full + capped ----------
with open(f"{OUT_DIR}/full_dedup.json","w") as f:
    json.dump(rows, f, indent=2, default=str)

# For dataset.csv/json: the user wants ~150-200 rows reflecting the broad sweep.
# Don't curate by score (we want 50/50 emerging vs traditional in the deliverable).
# Cap at 200 by stratifying across role_family AND emerging buckets so no bucket dominates.
def stratified_cap(rows, cap=200):
    if len(rows) <= cap: return list(rows)
    # Buckets: (role_family, emerging_band) where emerging_band = "high" (>=6) or "low" (<6)
    buckets = {}
    for r in rows:
        band = "high" if r["emerging_score"] >= 6 else "low"
        key = (r["role_family"], band)
        buckets.setdefault(key, []).append(r)
    # Round-robin pull
    out = []
    bucket_lists = list(buckets.values())
    while len(out) < cap and any(bucket_lists):
        for bl in bucket_lists:
            if bl and len(out) < cap:
                out.append(bl.pop(0))
        bucket_lists = [bl for bl in bucket_lists if bl]
    return out

final = stratified_cap(rows, 200)
print(f"Final dataset (stratified cap at 200): {len(final)}")

with open(f"{OUT_DIR}/dataset.json","w") as f:
    json.dump(final, f, indent=2, default=str)
fieldnames = ["source","company","company_type","title_raw","title_normalized","seniority","role_family","location","remote_type","posted_date","skills_extracted","salary_range","emerging_score","emerging_reason","url"]
with open(f"{OUT_DIR}/dataset.csv","w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for r in final:
        rr = dict(r)
        rr["skills_extracted"] = "; ".join(r["skills_extracted"])
        w.writerow(rr)

# ---------- Stats ----------
def hist(lst): return dict(Counter(lst).most_common())

city_hist = Counter()
for r in rows:
    loc = (r["location"] or "").lower()
    matched_city = None
    for c in INDIA_CITIES:
        if c in loc:
            matched_city = c; break
    if matched_city:
        city_hist[matched_city] += 1

emerging_skill = Counter()
standard_skill = Counter()
for r in rows:
    bucket = emerging_skill if r["emerging_score"] >= 6 else standard_skill
    for s in r["skills_extracted"]: bucket[s] += 1
n_emerging = sum(1 for r in rows if r["emerging_score"] >= 6)
n_standard = sum(1 for r in rows if r["emerging_score"] < 6)
skill_lift = []
for sk in set(emerging_skill) | set(standard_skill):
    e = emerging_skill[sk] / max(n_emerging,1)
    s = standard_skill[sk] / max(n_standard,1)
    if e >= 0.05 and (s == 0 or e/max(s,0.01) >= 1.5):
        skill_lift.append({"skill":sk, "emerging_rate":round(e,3), "standard_rate":round(s,3),
                            "lift": round(e/s if s>0 else 99.0, 2)})
skill_lift.sort(key=lambda x: -x["lift"])

# Per-bucket coverage in final
final_role_hist = Counter([r["role_family"] for r in final])
full_role_hist = Counter([r["role_family"] for r in rows])

# emerging vs standard mix
final_emerging_mix = Counter(["emerging" if r["emerging_score"]>=6 else "standard" for r in final])
full_emerging_mix  = Counter(["emerging" if r["emerging_score"]>=6 else "standard" for r in rows])

stats = {
    "raw_counts": {k: counts[k][0] for k in counts},
    "tech_excluded": {k: counts[k][2] for k in counts},
    "kept_after_filters": {k: counts[k][1] for k in counts},
    "full_dedup_pool_size": len(rows),
    "final_dataset_size": len(final),
    "score_histogram_full": hist([r["emerging_score"] for r in rows]),
    "score_histogram_final": hist([r["emerging_score"] for r in final]),
    "role_family_full": dict(full_role_hist),
    "role_family_final": dict(final_role_hist),
    "emerging_mix_final": dict(final_emerging_mix),
    "emerging_mix_full": dict(full_emerging_mix),
    "company_type_full": hist([r["company_type"] for r in rows]),
    "city_distribution_full": dict(city_hist.most_common()),
    "top_skills_full": dict(Counter([s for r in rows for s in r["skills_extracted"]]).most_common(30)),
    "skills_with_lift_in_emerging": skill_lift[:25],
    "estimated_cost_usd": round(0.005 + 150*0.0007 + 4*(0.00005 + 100*0.0003), 4),
}
with open(f"{OUT_DIR}/stats.json","w") as f:
    json.dump(stats, f, indent=2, default=str)

print("\n== Score histogram (full pool) ==")
for s in sorted(stats["score_histogram_full"]):
    n = stats["score_histogram_full"][s]
    print(f" {s}: {'#'*min(n,60)} ({n})")

print("\n== Role family (full pool) ==")
for k,v in full_role_hist.most_common(): print(f" {k}: {v}")
print("\n== Role family (final dataset) ==")
for k,v in final_role_hist.most_common(): print(f" {k}: {v}")
print("\n== Emerging vs standard ==")
print(f" full pool:  {dict(full_emerging_mix)}")
print(f" final:      {dict(final_emerging_mix)}")
print("\n== Top 20 emerging (score 7+) from final ==")
top = [x for x in final if x["emerging_score"]>=7][:20]
for r in top:
    print(f" [{r['emerging_score']}] {r['title_raw'][:65]} @ {r['company'][:30]} ({r['location'][:25]}) | {r['role_family']}")
print(f"\nEstimated cost: ${stats['estimated_cost_usd']}")
print(f"Wrote dataset.csv, dataset.json, full_dedup.json, stats.json to {OUT_DIR}")
