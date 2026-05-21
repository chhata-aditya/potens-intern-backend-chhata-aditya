# Job Recommendation API

A RESTful API that matches student profiles to internship/job listings using a custom scoring engine.

**Built for:** Potens IT Services Internship Take-Home 2026 · Backend Role · Q2  
**Author:** Chhata Aditya

---

## Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/chhata-aditya/potens-intern-backend-chhata-aditya
cd potens-intern-backend-chhata-aditya
npm install
node scripts/seed.js   # loads 16 job listings into the database
npm start              # server runs at http://localhost:3000
```

To run tests:
```bash
npm test
```

---

## API Reference

### `POST /recommend`
Returns the top 3 job matches for a student profile. No auth required.

**Request body:**
```json
{
  "name": "Chhata Aditya",
  "cgpa": 9.03,
  "degree": "MCA",
  "skills": ["Node.js", "Express", "SQL", "JavaScript", "HTML", "CSS", "REST APIs"],
  "experience_level": "fresher",
  "preferred_domain": "backend",
  "location": "Pune"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | Student name |
| `cgpa` | number | ✅ | 0–10 |
| `degree` | string | ✅ | e.g. "BCA", "MCA", "BTech" |
| `skills` | string[] | ✅ | Non-empty array |
| `experience_level` | string | ✅ | `"fresher"`, `"0-1yr"`, `"1-2yr"` |
| `preferred_domain` | string | ❌ | e.g. "backend", "frontend", "ml" |
| `location` | string | ❌ | City preference |

**Response:**
```json
{
  "recommendations": [
    {
      "rank": 1,
      "job_id": 2,
      "title": "Backend Engineer Intern",
      "company": "Zepto",
      "domain": "backend",
      "location": "Mumbai",
      "stipend_range": "₹25,000 – ₹35,000/month",
      "match_score": 75,
      "reasoning": "Backend Engineer Intern at Zepto is a 100% skill match. You know Node.js, Express, SQL, REST APIs, which are required here. Open to any degree — you qualify. Matches your preferred domain (backend). Your CGPA of 9.03 is comfortably above their 7.5 minimum. Stipend: ₹25,000–₹35,000/month. Location: Mumbai."
    }
  ]
}
```

---

### `GET /explain/:item_id`
Returns the eligibility logic for a specific job in plain English. No auth required.

```bash
GET /explain/2
```

```json
{
  "job_id": 2,
  "title": "Backend Engineer Intern",
  "company": "Zepto",
  "eligibility_explanation": "Node.js and SQL required. CGPA 7.5+. Any CS degree.",
  "requirements": {
    "minimum_cgpa": 7.5,
    "preferred_degree": "Any",
    "experience_level": "fresher",
    "required_skills": ["Node.js", "Express", "SQL", "REST APIs"]
  }
}
```

---

### `GET /items` — Admin
Returns all jobs. Requires `x-admin-key: potens-admin-2026` header.

```bash
curl http://localhost:3000/items -H "x-admin-key: potens-admin-2026"
```

### `POST /items` — Admin
Creates a new job listing.

```json
{
  "title": "iOS Developer Intern",
  "company": "Paytm",
  "domain": "mobile",
  "min_cgpa": 7.0,
  "required_skills": ["Swift", "Xcode", "REST APIs"],
  "preferred_degree": "Any",
  "experience_level": "fresher",
  "location": "Noida",
  "stipend_min": 20000,
  "stipend_max": 28000,
  "description": "Build iOS features for Paytm's super app.",
  "eligibility_logic": "Swift required. CGPA 7.0+. Any degree."
}
```

### `PUT /items/:id` — Admin
Updates any field on an existing job.

### `DELETE /items/:id` — Admin
Deletes a job.

---

## How Matching Works

Each job is scored against the student profile using these signals:

| Signal | Points | Notes |
|--------|--------|-------|
| Skill match | +10 per skill | Partial string match (e.g. "SQL" matches "MySQL") |
| Domain preference | +20 | If student's `preferred_domain` matches job domain |
| Degree match | +15 exact / +5 "Any" | Exact match vs open |
| Location match | +10 | Also awarded for remote jobs |
| CGPA headroom | +10 | If CGPA is 1.5+ above the minimum |

**Hard filters (disqualify a job entirely):**
- Student's CGPA below the job's `min_cgpa`
- Experience gap greater than 1 level (e.g. student is fresher, job requires 1–2yr)

Jobs are ranked by total score. Top 3 are returned. If no jobs pass the hard filters, the API returns an empty list with a message.

---

## Design Decisions

**Why SQLite over PostgreSQL?**  
No setup, no running server, no connection string to configure. The database is a single file that travels with the project. For a catalogue-based recommendation system with modest write volume, SQLite is the right call for a 24-hour build. If this went to production at scale, I'd migrate to PostgreSQL — and the query layer here is thin enough to make that swap straightforward.

**Why sql.js over better-sqlite3?**  
`better-sqlite3` requires native compilation against Node headers (node-gyp), which breaks in environments without internet access to the Node CDN. `sql.js` is pure JavaScript — zero native dependencies, works anywhere Node runs. The tradeoff is that it runs in-memory and we persist manually to disk; for this use case, that's completely fine.

**Why not use an ORM?**  
Raw SQL with a thin helper layer keeps the database interactions transparent and auditable. For a 16-row catalogue with straightforward queries, an ORM adds more boilerplate than it removes.

**Scoring is deterministic, not ML-based.**  
A rule-based scorer with clearly weighted signals is more auditable and easier to explain than a black-box model. The `reasoning` field in each response traces exactly why a job was ranked where it was — which is exactly what `GET /explain/:id` also exposes.

**Admin key in plaintext.**  
For a take-home, this is fine. In production this would be an environment variable loaded via dotenv, never committed to version control.

---

## What's Broken / Unfinished

- **No pagination on `GET /items`** — with 16 jobs this is fine; at 1000+, you'd want `?page=` params.
- **No rate limiting** — adding `express-rate-limit` middleware on `POST /recommend` would be the next step.
- **Skill matching is fuzzy but dumb** — `"SQL"` matches `"MySQL"` which is correct, but it could also generate false positives on unusual names. A proper skill taxonomy would fix this.
- **No dotenv** — the admin key and port are hardcoded. Would externalize these for any real deployment.

**What I'd build next:**
1. `POST /recommend/batch` — match a list of students at once (useful for placement cell portals)
2. Webhook support when new jobs are added that match a saved profile
3. OpenAPI spec auto-generated from routes
4. A simple HTML UI at `GET /` for quick manual testing without Postman

---

## AI Use Log

| Tool | Approx. messages | Used for |
|------|-----------------|----------|
| Claude (claude.ai) | ~25 | Initial scaffolding, architecture decisions, debugging sql.js persistence, test structure |

All logic — scoring algorithm, data model, eligibility rules, reasoning text, README — was written and reviewed by me. Claude was used to accelerate boilerplate and catch errors, not to substitute for design decisions.
