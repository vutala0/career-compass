"""
Normalize, dedupe, and emerging-score job postings from 3 Apify actors.
Output: dataset.csv, dataset.json
"""
import json
import re
import csv
from datetime import datetime, timezone
from difflib import SequenceMatcher
from collections import Counter

OUT_DIR = "/sessions/compassionate-stoic-hawking/mnt/outputs"

# ---------- Load raw ----------
linkedin_raw = json.load(open(f"{OUT_DIR}/raw/linkedin.json"))["items"]
ats_raw      = json.load(open(f"{OUT_DIR}/raw/ats.json"))["items"]
yc_raw       = json.load(open(f"{OUT_DIR}/raw/yc.json"))["items"]

# ---------- Helpers ----------

INDIA_CITIES = {
    "bangalore","bengaluru","hyderabad","pune","mumbai","delhi","gurugram",
    "gurgaon","noida","chennai","kolkata","ahmedabad","jaipur","kochi",
    "thiruvananthapuram","trivandrum","warangal","indore","chandigarh",
    "delhi ncr"
}
INDIA_TOKENS = INDIA_CITIES | {"india","in","ind"}

def is_in_india(loc_text: str) -> bool:
    if not loc_text: return False
    t = loc_text.lower()
    if "india" in t: return True
    if any(c in t for c in INDIA_CITIES): return True
    if re.search(r'\bIN\b', loc_text): return True
    return False

def normalize_company(c: str) -> str:
    if not c: return ""
    c = c.lower().strip()
    c = re.sub(r"\b(pvt|private|ltd|limited|llc|inc|corporation|corp|technologies|technology|systems|software|labs?|india|in)\b\.?", "", c)
    c = re.sub(r"[^\w\s]", " ", c)
    c = re.sub(r"\s+", " ", c).strip()
    return c

# ---------- Title normalization & seniority ----------

SENIORITY_RULES = [
    (r"\b(intern|trainee|graduate)\b", "intern"),
    (r"\b(junior|associate)\b", "junior"),
    (r"\b(principal|distinguished)\b", "principal"),
    (r"\b(staff)\b", "staff"),
    (r"\b(senior|sr\.?|lead)\b", "senior"),
    (r"\b(head of|director|vp|vice president|chief|cto|cpo|ceo)\b", "lead"),
    (r"\b(manager)\b", "lead"),
    (r"\b(founding|founder)\b", "senior"),
]

def detect_seniority(title: str, level_hint: str = "") -> str:
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

def normalize_title(raw: str) -> str:
    if not raw: return ""
    t = re.sub(r"[\(\[\{].*?[\)\]\}]", "", raw)
    t = re.sub(r"\s*[-\u2013\u2014|/]\s*.*$", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^(senior|sr\.?|junior|jr\.?|lead|principal|staff|head of|director|manager,?|associate)\s+", "", t, flags=re.I)
    return t.strip()

def role_family(title: str) -> str:
    t = (title or "").lower()
    if any(k in t for k in ["forward deployed","fde","applied ai","ai engineer","prompt engineer","agent engineer","agentic"]):
        return "applied-ai"
    if any(k in t for k in ["ml engineer","machine learning","ml ops","mlops","ml platform","ml research"]):
        return "ml"
    if any(k in t for k in ["data scientist","data analyst"]):
        return "data-science"
    if any(k in t for k in ["data engineer","etl","analytics engineer"]):
        return "data-eng"
    if any(k in t for k in ["devops","sre","platform","infra","reliability"]):
        return "platform-infra"
    if any(k in t for k in ["devrel","developer experience","developer relations","developer advocate"]):
        return "devrel-dx"
    if any(k in t for k in ["security","red team"]):
        return "security"
    if any(k in t for k in ["product manager","pm "]):
        return "product"
    if any(k in t for k in ["designer","design "]):
        return "design"
    if any(k in t for k in ["growth","gtm","sales","marketing"]):
        return "growth-gtm"
    if any(k in t for k in ["frontend","front end","front-end","ui engineer","react"]):
        return "frontend"
    if any(k in t for k in ["backend","back end","back-end","api engineer"]):
        return "backend"
    if any(k in t for k in ["full stack","fullstack","full-stack"]):
        return "fullstack"
    if any(k in t for k in ["mobile","ios","android","react native"]):
        return "mobile"
    if any(k in t for k in ["qa","test","quality"]):
        return "qa"
    if any(k in t for k in ["software engineer","sde","developer","engineer"]):
        return "swe"
    return "other"

# ---------- Emerging-role scoring ----------

T4_KEYS = [
    "forward deployed","fde","forward-deployed",
    "founding ai","founding ml","founding engineer",
    "applied ai engineer","applied ai",
    "agent engineer","agentic",
    "eval engineer","ai red team","red teamer",
    "rag engineer","prompt engineer",
    "ai systems","ai applications engineer",
    "ai gtm","applications engineer \u2014 gtm",
    "ml research engineer","frontier model","ai infrastructure engineer",
    "developer experience engineer",
]
T3_KEYS = [
    "ai engineer","ai/ml engineer","genai engineer","llm engineer",
    "ml platform","ml ops engineer","mlops engineer",
    "developer relations","developer advocate","devrel",
    "ai solution engineer","ai prompt","ai platform","ai research",
    "ai pre-sales","ai solutions",
]
T2_KEYS = [
    "ml engineer","machine learning engineer","sre","site reliability",
    "platform engineer","devops","data engineer","analytics engineer",
    "security engineer","react native","mobile engineer","ios engineer","android engineer",
]
T1_KEYS = [
    "software engineer","backend developer","backend engineer","frontend engineer",
    "frontend developer","full stack","fullstack","data analyst","data scientist",
    "qa engineer","test engineer","ui developer","ui engineer","developer",
]

AI_NATIVE_HINTS = ["ai","ml","llm","claude","openai","anthropic","perplexity","cohere","mistral",
                   "agent","cerebras","arize","coram","weekday","devrev","groq","scale ai",
                   "fantastic.jobs"]

def emerging_score_and_reason(title, company, desc, source, yc_batch=""):
    t = (title or "").lower()
    c = (company or "").lower()
    d = (desc or "")[:5000].lower()
    score = 1
    reasons = []

    matched_tier = None
    for k in T4_KEYS:
        if k in t:
            score = 9
            matched_tier = ("T4", k); break
    if matched_tier is None:
        for k in T3_KEYS:
            if k in t:
                score = 7
                matched_tier = ("T3", k); break
    if matched_tier is None:
        for k in T2_KEYS:
            if k in t:
                score = 4
                matched_tier = ("T2", k); break
    if matched_tier is None:
        for k in T1_KEYS:
            if k in t:
                score = 2
                matched_tier = ("T1", k); break

    company_is_ai_native = (
        any(h in c for h in AI_NATIVE_HINTS)
        or yc_batch
        or "ai" in c.split()
    )

    desc_signals = 0
    for sig in ["agentic","rag","langchain","langgraph","llamaindex","vector database","fine-tun","embeddings","tool use","multi-agent","autonomous agent","eval framework","red team"]:
        if sig in d:
            desc_signals += 1

    if matched_tier and matched_tier[0] == "T4":
        if company_is_ai_native: score = min(10, score + 1)
        reasons.append(f"title contains '{matched_tier[1]}'")
    elif matched_tier and matched_tier[0] == "T3":
        if company_is_ai_native: score = min(8, score + 1)
        if desc_signals >= 2: score = min(8, score + 1)
        reasons.append(f"rising-tier title term '{matched_tier[1]}'")
    elif matched_tier and matched_tier[0] == "T2":
        if desc_signals >= 3: score = min(6, score + 2)
        reasons.append(f"specialized-tier title '{matched_tier[1]}'")
    elif matched_tier and matched_tier[0] == "T1":
        if desc_signals >= 3: score = min(6, score + 3)
        if company_is_ai_native and desc_signals >= 2: score = max(score, 5)
        reasons.append(f"standard title '{matched_tier[1]}'")
    else:
        score = 3
        reasons.append("no canonical title match")

    if yc_batch and re.search(r"W2[4-9]|S2[4-9]", yc_batch):
        score = min(10, score + 1)
        reasons.append(f"recent YC batch ({yc_batch})")

    if "founding" in t:
        score = min(10, score + 1)
        reasons.append("founding-role title")

    if ("ai" in t or "ml" in t) and any(k in t for k in ["gtm","sales","marketing","devrel","developer relations"]):
        score = min(10, max(score, 9))
        reasons.append("cross-domain AI+GTM/DevRel role")

    if any(k in t for k in ["trainee","intern"]):
        score = min(score, 3)

    reason = "; ".join(reasons) if reasons else "default"
    return score, reason

# ---------- Skills extraction ----------

SKILL_VOCAB = [
    "python","javascript","typescript","go","golang","rust","java","kotlin","swift","scala","c++","c#","ruby","php","sql",
    "pytorch","tensorflow","jax","scikit-learn","sklearn","huggingface","hugging face","transformers","langchain","langgraph","llamaindex",
    "openai","anthropic","claude","gpt","llm","llms","rag","fine-tuning","fine tuning","embeddings","vector database","pinecone","weaviate","chroma",
    "bedrock","vertex ai","azure openai","sagemaker","mlflow","kubeflow","ray","spark","mlops",
    "agentic","agents","multi-agent","prompt engineering","evals","evaluation","reinforcement learning","rlhf","computer vision","opencv","nlp","cnn","rnn",
    "react","next.js","nextjs","node.js","nodejs","express","fastapi","flask","django","graphql","rest","grpc","kafka","redis","postgres","postgresql","mongodb","mysql","elasticsearch","redshift","snowflake","databricks","bigquery",
    "aws","azure","gcp","google cloud","kubernetes","k8s","docker","terraform","ansible","jenkins","github actions","gitlab","ci/cd","helm",
    "react native","flutter","ios","android","swiftui","jetpack compose",
    "airflow","dbt","hadoop","tableau","power bi","powerbi","looker","superset",
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
        "sklearn":"scikit-learn","hugging face":"huggingface","fine tuning":"fine-tuning",
        "k8s":"kubernetes","nodejs":"node.js","nextjs":"next.js","golang":"go",
        "powerbi":"power bi","postgres":"postgresql","gcp":"google cloud","llms":"llm",
        "agents":"agentic","evaluation":"evals",
    }
    bag = []
    seen = set()
    for s, _ in found.most_common():
        norm = canon.get(s, s)
        if norm not in seen:
            bag.append(norm); seen.add(norm)
    return bag[:max_n]

# ---------- Build normalized rows ----------

def build_row_linkedin(it):
    title = it.get("jobTitle","")
    company = it.get("companyName","")
    location = it.get("location","")
    if not is_in_india(location):
        return None
    desc = it.get("jobDescription","")
    pub = it.get("publishedAt","")
    posted_date = pub[:10] if pub else None
    rt = "unknown"
    dl = (desc + " " + location).lower()
    if "remote" in dl or "work from home" in dl: rt = "remote"
    elif "hybrid" in dl: rt = "hybrid"
    elif "onsite" in dl or "on-site" in dl or "on site" in dl: rt = "onsite"
    salary = it.get("salaryInfo")
    salary_range = None
    if isinstance(salary, list) and salary:
        salary_range = " - ".join(salary)
    score, reason = emerging_score_and_reason(title, company, desc, "linkedin")
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
    }

def build_row_ats(it):
    title = it.get("title","")
    company = ""
    co = it.get("company")
    if isinstance(co, dict):
        company = co.get("name","")
    elif isinstance(co, str):
        company = co
    locs = it.get("locations") or []
    loc_str = ""
    in_india = False
    if locs:
        india_locs = [l for l in locs if (l.get("country") or "").lower() == "india"]
        valid_locs = india_locs if india_locs else locs
        loc_str = "; ".join([l.get("location") or "" for l in valid_locs if l.get("location")])
        in_india = any((l.get("country") or "").lower() == "india" for l in locs)
        if all("latin america" in (l.get("location") or "").lower() for l in locs):
            in_india = False
        # Also reject if all locs are non-India after data clean
        non_india_only = all(
            (l.get("country") or "").lower() not in ("india",) and "india" not in (l.get("location") or "").lower()
            for l in locs
        )
        if non_india_only:
            in_india = False
    if not in_india: return None
    desc = it.get("description","") or ""
    posted_date = (it.get("date_posted") or "")[:10] or None
    is_remote = it.get("is_remote", False)
    wpt = (it.get("workplace_type") or "").lower()
    if is_remote: rt = "remote"
    elif wpt == "hybrid": rt = "hybrid"
    elif wpt == "onsite": rt = "onsite"
    else: rt = "unknown"
    comp = it.get("compensation") or {}
    salary_range = None
    if isinstance(comp, dict):
        if comp.get("raw_text"):
            salary_range = comp.get("raw_text")
        elif comp.get("min") and comp.get("max"):
            salary_range = f"{comp.get('currency','')} {comp.get('min')}-{comp.get('max')}".strip()
    score, reason = emerging_score_and_reason(title, company, desc, "ats")
    return {
        "source": f"jobo.world/ats-jobs-search ({it.get('source','?')})",
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
    }

def build_row_yc(it):
    title = it.get("title","")
    company = it.get("companyName","")
    location = it.get("location","")
    if not is_in_india(location): return None
    desc = it.get("description") or ""
    posted_date = (it.get("datePosted") or "")[:10] or None
    rt = "unknown"
    if "remote" in location.lower(): rt = "remote"
    salary_range = it.get("salaryRange") or None
    if salary_range and not salary_range.strip(): salary_range = None
    yc_batch = it.get("ycBatch","")
    score, reason = emerging_score_and_reason(title, company, desc, "yc", yc_batch=yc_batch)
    return {
        "source": "parsebird/yc-jobs-scraper",
        "company": company,
        "title_raw": title,
        "title_normalized": normalize_title(title),
        "seniority": detect_seniority(title, it.get("experience","")),
        "role_family": role_family(title),
        "location": location,
        "remote_type": rt,
        "posted_date": posted_date,
        "skills_extracted": extract_skills(title + " " + desc),
        "salary_range": salary_range,
        "emerging_score": score,
        "emerging_reason": reason,
        "url": it.get("url",""),
    }

rows = []
li_kept = 0
for it in linkedin_raw:
    r = build_row_linkedin(it)
    if r: rows.append(r); li_kept += 1
print(f"LinkedIn kept (after India filter): {li_kept}/{len(linkedin_raw)}")

ats_kept = 0
for it in ats_raw:
    r = build_row_ats(it)
    if r: rows.append(r); ats_kept += 1
print(f"ATS kept (after India filter): {ats_kept}/{len(ats_raw)}")

yc_kept = 0
for it in yc_raw:
    r = build_row_yc(it)
    if r: rows.append(r); yc_kept += 1
print(f"YC kept (after India filter): {yc_kept}/{len(yc_raw)}")

print(f"\nTotal pre-dedup: {len(rows)}")

TODAY = datetime(2026, 4, 30, tzinfo=timezone.utc)
def within_30d(d):
    if not d: return True
    try:
        dt = datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return (TODAY - dt).days <= 32
    except Exception:
        return True

rows = [r for r in rows if within_30d(r["posted_date"])]
print(f"After 30-day filter: {len(rows)}")

def title_key(t):
    t = (t or "").lower()
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def fuzz_ratio(a, b):
    return SequenceMatcher(None, a, b).ratio()

def dedupe(rows):
    kept = []
    seen = []
    for r in rows:
        nc = normalize_company(r["company"])
        nt = title_key(r["title_normalized"])
        loc = (r["location"] or "").lower()
        is_dup = False
        for idx, (kc, kt, kloc) in enumerate(seen):
            if not nc or not kc: continue
            comp_match = (nc == kc) or (fuzz_ratio(nc, kc) >= 0.92)
            if not comp_match: continue
            title_match = fuzz_ratio(nt, kt) >= 0.80
            loc_match = (loc and kloc and (loc.split(",")[0].strip() == kloc.split(",")[0].strip()))
            if title_match or (fuzz_ratio(nt, kt) >= 0.65 and loc_match):
                existing = kept[idx]
                priority = {"jobo.world":3,"parsebird":2,"cheap_scraper":1}
                def src_pri(s):
                    for k,v in priority.items():
                        if k in s: return v
                    return 0
                if src_pri(r["source"]) > src_pri(existing["source"]):
                    kept[idx] = r
                    seen[idx] = (nc, nt, loc)
                is_dup = True
                break
        if not is_dup:
            kept.append(r)
            seen.append((nc, nt, loc))
    return kept

rows = dedupe(rows)
print(f"After dedup: {len(rows)}")

def parse_date_safe(d):
    try: return datetime.strptime(d, "%Y-%m-%d")
    except: return datetime(1970,1,1)
rows.sort(key=lambda r: (-r["emerging_score"], -parse_date_safe(r["posted_date"] or "1970-01-01").timestamp()))

# Flag company-quality caveats: known IT-services + recruiter-aggregator companies
# (these post titles like "AI Engineer" but are not frontier hirers)
SERVICE_INTERMEDIARIES = {
    "weekday","crossing hurdles","deccan ai experts","tech mahindra","accenture in india","accenture",
    "infosys","tcs","wipro","cognizant","capgemini","mphasis","persistent systems","l&t technology",
    "hcl","ltimindtree","mindtree","virtusa","hexaware","iqvia","dxc technology"
}
def quality_flag(r):
    nc = normalize_company(r["company"])
    for s in SERVICE_INTERMEDIARIES:
        if s in nc:
            return "intermediary-or-services"
    return "direct"
for r in rows:
    r["company_type"] = quality_flag(r)

# Save FULL deduped (for distribution/coverage analysis)
with open(f"{OUT_DIR}/full_dedup.json","w") as f:
    json.dump(rows, f, indent=2, default=str)

# Build curated top 50 — but stratify so we keep some lower-scored rows
# 40 highest-scoring + 10 representative lower scoring for contrast
top40 = rows[:40]
remainder = rows[40:]
# pick 10 items from remainder spanning score range, prefer direct hirers and unique role_families seen less
seen_families = Counter([r["role_family"] for r in top40])
chosen = []
for r in remainder:
    if len(chosen) >= 10: break
    if r["company_type"] != "direct": continue
    chosen.append(r)
final = top40 + chosen
print(f"Final dataset size (top40 by score + 10 contrast rows): {len(final)}")

with open(f"{OUT_DIR}/dataset.json","w") as f:
    json.dump(final, f, indent=2, default=str)

with open(f"{OUT_DIR}/dataset.csv","w", newline="") as f:
    fieldnames = ["source","company","company_type","title_raw","title_normalized","seniority","role_family","location","remote_type","posted_date","skills_extracted","salary_range","emerging_score","emerging_reason","url"]
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for r in final:
        rr = dict(r)
        rr["skills_extracted"] = "; ".join(r["skills_extracted"])
        w.writerow(rr)

print("\n== Score histogram ==")
hist = Counter([r["emerging_score"] for r in final])
for s in sorted(hist):
    print(f" {s}: {'#'*hist[s]} ({hist[s]})")

print("\n== Source mix ==")
src_hist = Counter([r["source"].split(" ")[0] for r in final])
for s,n in src_hist.most_common(): print(f" {s}: {n}")

print("\n== Role family ==")
rf_hist = Counter([r["role_family"] for r in final])
for s,n in rf_hist.most_common(): print(f" {s}: {n}")

print("\n== Top 12 emerging ==")
for r in final[:12]:
    print(f" [{r['emerging_score']}] {r['title_raw']} @ {r['company']} ({r['location']}) | {r['source'].split('/')[0]} | {r.get('company_type','direct')}")

print("\n== Per-source emerging density (full deduped pool) ==")
src_total = Counter()
src_high = Counter()
for r in rows:
    s = r["source"].split(" ")[0]
    src_total[s] += 1
    if r["emerging_score"] >= 7: src_high[s] += 1
for s in src_total:
    pct = 100*src_high[s]/src_total[s] if src_total[s] else 0
    print(f" {s}: {src_high[s]}/{src_total[s]} ({pct:.0f}% scored >=7)")

print("\n== Top 20 skills across full deduped pool ==")
sk = Counter()
for r in rows:
    for s in r["skills_extracted"]: sk[s]+=1
for s,n in sk.most_common(20): print(f" {s}: {n}")

# Stats over FULL deduped pool
all_score_hist = Counter([r["emerging_score"] for r in rows])
all_src_hist = Counter([r["source"].split(" ")[0] for r in rows])
all_rf_hist = Counter([r["role_family"] for r in rows])
all_company_type = Counter([r["company_type"] for r in rows])
emerging_skill = Counter()
standard_skill = Counter()
for r in rows:
    bucket = emerging_skill if r["emerging_score"] >= 7 else standard_skill
    for s in r["skills_extracted"]: bucket[s] += 1
n_emerging = sum(1 for r in rows if r["emerging_score"] >= 7)
n_standard = sum(1 for r in rows if r["emerging_score"] < 7)
skill_lift = []
for sk_name in set(emerging_skill) | set(standard_skill):
    e_rate = emerging_skill[sk_name] / max(n_emerging,1)
    s_rate = standard_skill[sk_name] / max(n_standard,1)
    if e_rate >= 0.05 and (s_rate == 0 or e_rate / max(s_rate, 0.01) >= 1.5):
        skill_lift.append({
            "skill": sk_name,
            "emerging_rate": round(e_rate,3),
            "standard_rate": round(s_rate,3),
            "lift": round((e_rate / s_rate) if s_rate > 0 else 99.0, 2)
        })
skill_lift.sort(key=lambda x: -x["lift"])

city_hist = Counter()
for r in rows:
    if r["emerging_score"] >= 7:
        loc = (r["location"] or "").lower()
        for c in INDIA_CITIES:
            if c in loc:
                city_hist[c] += 1
                break

stats = {
    "raw_counts": {"linkedin":len(linkedin_raw),"ats":len(ats_raw),"yc":len(yc_raw)},
    "after_india_filter": {"linkedin":li_kept,"ats":ats_kept,"yc":yc_kept},
    "full_dedup_pool_size": len(rows),
    "curated_dataset_size": len(final),
    "full_pool_score_histogram": dict(all_score_hist),
    "curated_score_histogram": dict(hist),
    "full_pool_source_mix": dict(all_src_hist),
    "curated_source_mix": dict(src_hist),
    "full_pool_role_family_mix": dict(all_rf_hist),
    "curated_role_family_mix": dict(rf_hist),
    "company_type_mix_full": dict(all_company_type),
    "per_source_emerging_density_full": {
        s: {"emerging":src_high[s],"total":src_total[s],
            "pct": round(100*src_high[s]/max(src_total[s],1))}
        for s in src_total
    },
    "top_skills_full": dict(Counter([s for r in rows for s in r["skills_extracted"]]).most_common(25)),
    "skills_with_lift_in_emerging": skill_lift[:25],
    "city_distribution_emerging_only": dict(city_hist.most_common()),
}
with open(f"{OUT_DIR}/stats.json","w") as f:
    json.dump(stats, f, indent=2, default=str)
print(f"\nWrote dataset.csv, dataset.json, full_dedup.json, stats.json to {OUT_DIR}")
