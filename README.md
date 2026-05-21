# Job Recommendation API

**Potens IT Services — Backend Internship Take-Home 2026**  
**Q2: Profile-to-Recommendation API**  
Built by Chhata Aditya

---

## What this is

A REST API that takes a student's profile and returns the top 3 job listings that match them — with a ranked score and a plain-English reason for each match.

I picked the job-matching domain because it's something I've personally felt the gap of as a student applying to internships. Most job boards just keyword-match. This scores on multiple signals: skill overlap, degree preference, domain interest, location, and CGPA headroom, and tells you WHY something matched, not just that it did.

The catalogue has 16 real-sounding internship listings across frontend, backend, ML, design, DevOps, and more.

---

## Stack

- **Node.js + Express** — straightforward, I know it well
- **sql.js** — SQLite in pure JavaScript. No native compilation, no running database server, works on any machine with Node. The database persists to a single `data.db` file.
- **Jest + Supertest** — 12 unit tests

I chose SQLite over PostgreSQL deliberately. For a catalogue-based system with infrequent writes, it's the right tool — and it means anyone can clone and run this in under 5 minutes without installing anything extra.

---

## Setup

```bash
git clone https://github.com/chhata-aditya/potens-intern-backend-chhata-aditya
cd potens-intern-backend-chhata-aditya
npm install --ignore-scripts
node scripts/seed.js
npm start
```

Server runs at `http://localhost:3000`  
Admin key: `potens-admin-2026`

---

## Endpoints

### `POST /recommend`
No auth required. Returns top 3 matches with score and reasoning.

**Minimum required fields (5):** `name`, `cgpa`, `degree`, `skills`, `experience_level`  
**Optional:** `preferred_domain`, `location`

```json
{
  "name": "Chhata Aditya",
  "cgpa": 9.03,
  "degree": "MCA",
  "skills": ["Node.js", "Express", "SQL", "JavaScript", "HTML", "CSS"],
  "experience_level": "fresher",
  "preferred_domain": "backend",
  "location": "Pune"
}
```

Response includes a `cache` field — `"MISS"` on first call, `"HIT"` on repeat calls within 5 minutes.

---

### `GET /explain/:item_id`
Returns the eligibility logic for a job in plain English. No auth.

```bash
GET /explain/2
```

---

### `GET /cache-stats`
Shows how many profiles are currently cached and the TTL. No auth.

---

### `GET /items` — Admin
Returns all 16 job listings. Requires header: `x-admin-key: potens-admin-2026`

### `POST /items` — Admin
Add a new job to the catalogue.

### `PUT /items/:id` — Admin
Update any field on an existing job.

### `DELETE /items/:id` — Admin
Remove a job.

---

## How the scoring works

Every job goes through two stages:

**Hard filters (disqualify entirely):**
- Student's CGPA is below the job's minimum
- Experience gap is more than 1 level (e.g. job needs 1–2yr, student is a fresher — disqualified. But fresher applying to a 0–1yr role is fine.)

**Soft scoring (builds the rank):**

| Signal | Points | Reasoning |
|--------|--------|-----------|
| Each matched skill | +10 | Direct requirement coverage |
| Skill momentum bonus | +15 | Triggered when >60% of skills match. A candidate 75% there is meaningfully more hirable than one 25% there -- the gap is closeable on the job. Flat per-skill scoring misses this. |
| Domain preference match | +20 | Student is more likely to stay and perform in a domain they want |
| Exact degree match | +15 | Explicit preference signal from employer |
| Degree open to "Any" | +5 | Acknowledged but weighted lower |
| Location match or remote | +10 | Reduces friction in the hiring process |
| CGPA 1.5+ above minimum | +10 | Headroom signals academic consistency, not just clearing the bar |

The top 3 by score are returned. Ties are broken by order in the catalogue.

Skill matching is fuzzy — `"SQL"` matches `"MySQL"` because the comparison checks if either string contains the other. This is intentional; a student who knows SQL can pick up MySQL syntax quickly.

---

## Caching

`POST /recommend` has an in-memory cache with a 5-minute TTL.

The cache key is built from the profile's scoring-relevant fields (cgpa, degree, skills, experience_level, preferred_domain, location) — normalized and sorted so `["Node.js", "SQL"]` and `["SQL", "Node.js"]` hit the same key.

The `name` field is intentionally excluded from the cache key. Two students with identical profiles should get identical results — their names don't affect matching.

Hit `GET /cache-stats` to see the current cache state.

---

## Tests

```bash
npm test
```

12 tests across 3 groups:
- `POST /recommend` — valid profile, no-match, missing fields, invalid cgpa, empty skills, experience gap logic
- `GET /explain/:item_id` — valid and 404
- `GET /items` — auth pass, no key, wrong key

---

## What's missing / what I'd build next

- **Pagination on `GET /items`** — fine at 16 jobs, needed at scale
- **Rate limiting on `POST /recommend`** — `express-rate-limit` would be a 10-line addition
- **dotenv for config** — admin key and port are hardcoded; would externalize these
- **Persistent cache** — in-memory cache resets on server restart. Redis would fix this
- **`/subscribe` webhook** — notify a profile when a new job matches them. I'd store profiles in a `subscribers` table and run a match check on every `POST /items`
- **OpenAPI spec** — would auto-generate from routes using `swagger-autogen`

---


## AI Use Log

| Tool | Messages (approx) | Used for |
|------|-------------------|----------|
| Claude (claude.ai) | ~35 | Debugging sql.js disk persistence on Windows, test boilerplate, cache TTL logic |
| MDN / Stack Overflow | reference | sql.js API docs, Express router patterns |

I used Claude as a debugging and boilerplate tool, not a decision-making one. The domain choice, scoring model, catalogue data, profile fields, and SQLite justification are decisions I made and can defend. When Claude suggested a more complex stack (Winston for logging, Zod for validation, better-sqlite3), I pushed back and simplified -- because I knew the added complexity wasn't worth it for this scope.

The sql.js persistence setup was the one genuinely tricky part. better-sqlite3 requires native compilation which breaks on Windows without extra tooling. I worked through that with Claude's help and understand exactly how it works now.

The README is written by me with Claude's help on structure. I'm logging this because the brief asked for honesty, and because I think knowing when and how to use AI is itself a skill worth showing.
