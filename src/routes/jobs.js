const express = require("express");
const { all, get, run } = require("../db/database");
const { requireAdmin } = require("../middleware/auth");

function makeJobsRouter(db) {
  const router = express.Router();

  // GET /items — all jobs (admin)
  router.get("/", requireAdmin, (req, res) => {
    const jobs = all(db, "SELECT * FROM jobs");
    const parsed = jobs.map((j) => ({ ...j, required_skills: JSON.parse(j.required_skills) }));
    res.json({ count: parsed.length, jobs: parsed });
  });

  // GET /items/:id — single job (admin)
  router.get("/:id", requireAdmin, (req, res) => {
    const job = get(db, "SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ ...job, required_skills: JSON.parse(job.required_skills) });
  });

  // POST /items — create job (admin)
  router.post("/", requireAdmin, (req, res) => {
    const fields = ["title","company","domain","min_cgpa","required_skills",
      "preferred_degree","experience_level","location","stipend_min","stipend_max",
      "description","eligibility_logic"];
    const missing = fields.filter((f) => req.body[f] === undefined);
    if (missing.length > 0) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    if (!Array.isArray(req.body.required_skills))
      return res.status(400).json({ error: "required_skills must be an array" });

    const { title, company, domain, min_cgpa, required_skills, preferred_degree,
      experience_level, location, stipend_min, stipend_max, description, eligibility_logic } = req.body;

    const result = run(db,
      `INSERT INTO jobs (title,company,domain,min_cgpa,required_skills,preferred_degree,
       experience_level,location,stipend_min,stipend_max,description,eligibility_logic)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [title, company, domain, min_cgpa, JSON.stringify(required_skills), preferred_degree,
       experience_level, location, stipend_min, stipend_max, description, eligibility_logic]
    );
    res.status(201).json({ message: "Job created", job_id: result.lastInsertRowid });
  });

  // PUT /items/:id — update (admin)
  router.put("/:id", requireAdmin, (req, res) => {
    const job = get(db, "SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const updated = { ...job, ...req.body };
    if (Array.isArray(req.body.required_skills)) {
      updated.required_skills = JSON.stringify(req.body.required_skills);
    }

    run(db,
      `UPDATE jobs SET title=?,company=?,domain=?,min_cgpa=?,required_skills=?,
       preferred_degree=?,experience_level=?,location=?,stipend_min=?,stipend_max=?,
       description=?,eligibility_logic=? WHERE id=?`,
      [updated.title, updated.company, updated.domain, updated.min_cgpa, updated.required_skills,
       updated.preferred_degree, updated.experience_level, updated.location,
       updated.stipend_min, updated.stipend_max, updated.description, updated.eligibility_logic,
       req.params.id]
    );
    res.json({ message: "Job updated" });
  });

  // DELETE /items/:id — delete (admin)
  router.delete("/:id", requireAdmin, (req, res) => {
    const job = get(db, "SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (!job) return res.status(404).json({ error: "Job not found" });
    run(db, "DELETE FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ message: "Job deleted" });
  });

  return router;
}

module.exports = { makeJobsRouter };
