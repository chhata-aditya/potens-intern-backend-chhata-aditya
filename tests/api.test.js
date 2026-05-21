const request = require("supertest");
const { init, run, all } = require("../src/db/database");

let app;
let db;

beforeAll(async () => {
  db = await init();

  // Clear and seed test data
  db.run("DELETE FROM jobs");
  db.run("DELETE FROM sqlite_sequence WHERE name='jobs'");

  const insert = (job) => run(db,
    `INSERT INTO jobs (title,company,domain,min_cgpa,required_skills,preferred_degree,
     experience_level,location,stipend_min,stipend_max,description,eligibility_logic)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [job.title, job.company, job.domain, job.min_cgpa, JSON.stringify(job.required_skills),
     job.preferred_degree, job.experience_level, job.location, job.stipend_min,
     job.stipend_max, job.description, job.eligibility_logic]
  );

  insert({ title: "Backend Intern", company: "TestCo", domain: "backend", min_cgpa: 7.0, required_skills: ["Node.js","SQL"], preferred_degree: "Any", experience_level: "fresher", location: "Pune", stipend_min: 15000, stipend_max: 20000, description: "Test backend role", eligibility_logic: "Node.js and SQL. CGPA 7.0+." });
  insert({ title: "ML Intern", company: "AICorp", domain: "ml", min_cgpa: 8.5, required_skills: ["Python","TensorFlow"], preferred_degree: "BTech", experience_level: "0-1yr", location: "Bangalore", stipend_min: 30000, stipend_max: 40000, description: "Test ML role", eligibility_logic: "High CGPA required. BTech preferred." });
  insert({ title: "Frontend Intern", company: "WebCo", domain: "frontend", min_cgpa: 6.5, required_skills: ["HTML","CSS","JavaScript"], preferred_degree: "Any", experience_level: "fresher", location: "Remote", stipend_min: 12000, stipend_max: 18000, description: "Test frontend role", eligibility_logic: "Open to all. CGPA 6.5+." });

  // Now build the express app with the seeded db
  const express = require("express");
  const { makeRecommendRouter } = require("../src/routes/recommend");
  const { makeJobsRouter } = require("../src/routes/jobs");
  const { get } = require("../src/db/database");

  app = express();
  app.use(express.json());

  app.use("/recommend", makeRecommendRouter(db));

  app.get("/explain/:item_id", (req, res) => {
    const job = get(db, "SELECT * FROM jobs WHERE id = ?", [req.params.item_id]);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({
      job_id: job.id, title: job.title, company: job.company,
      eligibility_explanation: job.eligibility_logic,
      requirements: { minimum_cgpa: job.min_cgpa, preferred_degree: job.preferred_degree, experience_level: job.experience_level, required_skills: JSON.parse(job.required_skills) },
    });
  });

  app.use("/items", makeJobsRouter(db));
  app.use((req, res) => res.status(404).json({ error: "Not found" }));
});

// -------------------------------------------------------
// POST /recommend
// -------------------------------------------------------
describe("POST /recommend", () => {
  test("returns matches for a valid profile", async () => {
    const res = await request(app).post("/recommend").send({
      name: "Chhata Aditya", cgpa: 9.0, degree: "MCA",
      skills: ["Node.js", "SQL", "HTML", "CSS", "JavaScript"],
      experience_level: "fresher", preferred_domain: "backend", location: "Pune",
    });
    expect(res.status).toBe(200);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    expect(res.body.recommendations[0]).toHaveProperty("rank", 1);
    expect(res.body.recommendations[0]).toHaveProperty("reasoning");
  });

  test("no-match when cgpa too low for all jobs", async () => {
    const res = await request(app).post("/recommend").send({
      name: "Low CGPA", cgpa: 4.0, degree: "BCA",
      skills: ["Word", "Excel"], experience_level: "fresher",
    });
    expect(res.status).toBe(200);
    expect(res.body.recommendations).toHaveLength(0);
    expect(res.body.message).toMatch(/no matching/i);
  });

  test("missing cgpa returns 400", async () => {
    const res = await request(app).post("/recommend").send({
      name: "Test", degree: "BCA", skills: ["HTML"], experience_level: "fresher",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cgpa/i);
  });

  test("missing skills returns 400", async () => {
    const res = await request(app).post("/recommend").send({
      name: "Test", cgpa: 7.5, degree: "BCA", experience_level: "fresher",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/skills/i);
  });

  test("cgpa above 10 returns 400", async () => {
    const res = await request(app).post("/recommend").send({
      name: "Test", cgpa: 15, degree: "BCA", skills: ["Node.js"], experience_level: "fresher",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cgpa/i);
  });

  test("empty skills array returns 400", async () => {
    const res = await request(app).post("/recommend").send({
      name: "Test", cgpa: 7.0, degree: "BCA", skills: [], experience_level: "fresher",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/skills/i);
  });

  test("fresher can match 0-1yr job (gap of 1 is allowed)", async () => {
    const res = await request(app).post("/recommend").send({
      name: "Test", cgpa: 9.0, degree: "BTech",
      skills: ["Python", "TensorFlow"], experience_level: "fresher", preferred_domain: "ml",
    });
    expect(res.status).toBe(200);
    const titles = res.body.recommendations.map((r) => r.title);
    expect(titles).toContain("ML Intern");
  });
});

// -------------------------------------------------------
// GET /explain/:item_id
// -------------------------------------------------------
describe("GET /explain/:item_id", () => {
  test("returns eligibility explanation for valid job", async () => {
    const res = await request(app).get("/explain/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("eligibility_explanation");
    expect(res.body.requirements).toHaveProperty("minimum_cgpa");
  });

  test("returns 404 for non-existent job", async () => {
    const res = await request(app).get("/explain/99999");
    expect(res.status).toBe(404);
  });
});

// -------------------------------------------------------
// GET /items — admin auth
// -------------------------------------------------------
describe("GET /items", () => {
  test("returns jobs with valid admin key", async () => {
    const res = await request(app).get("/items").set("x-admin-key", "potens-admin-2026");
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeGreaterThan(0);
  });

  test("returns 401 without admin key", async () => {
    const res = await request(app).get("/items");
    expect(res.status).toBe(401);
  });

  test("returns 401 with wrong key", async () => {
    const res = await request(app).get("/items").set("x-admin-key", "wrong");
    expect(res.status).toBe(401);
  });
});
