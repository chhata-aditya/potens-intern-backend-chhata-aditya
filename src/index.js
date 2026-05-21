const express = require("express");
const { init, get, all } = require("./db/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// We initialize the DB once at startup, then attach routes
// All route handlers receive `db` via closure after init

let db;

async function startApp() {
  db = await init();

  const { makeRecommendRouter } = require("./routes/recommend");
  const { makeJobsRouter } = require("./routes/jobs");

  // Health check
  app.get("/", (req, res) => {
    res.json({
      service: "Job Recommendation API",
      version: "1.0.0",
      author: "Chhata Aditya",
      endpoints: {
        "POST /recommend": "Get top 3 job matches for a student profile",
        "GET /explain/:item_id": "Eligibility logic for a job (public)",
        "GET /items": "List all jobs (admin: x-admin-key header)",
        "POST /items": "Create a job (admin)",
        "PUT /items/:id": "Update a job (admin)",
        "DELETE /items/:id": "Delete a job (admin)",
      },
    });
  });

  // Recommend
  app.use("/recommend", makeRecommendRouter(db));

  // Explain (public)
  app.get("/explain/:item_id", (req, res) => {
    const job = get(db, "SELECT * FROM jobs WHERE id = ?", [req.params.item_id]);
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json({
      job_id: job.id,
      title: job.title,
      company: job.company,
      eligibility_explanation: job.eligibility_logic,
      requirements: {
        minimum_cgpa: job.min_cgpa,
        preferred_degree: job.preferred_degree,
        experience_level: job.experience_level,
        required_skills: JSON.parse(job.required_skills),
      },
    });
  });

  // Items CRUD (admin)
  app.use("/items", makeJobsRouter(db));

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

// Export for tests
module.exports = { startApp, getApp: () => app };

// Start server if run directly
if (require.main === module) {
  startApp().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`   Admin key: potens-admin-2026\n`);
    });
  });
}
