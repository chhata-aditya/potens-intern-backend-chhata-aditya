const express = require("express");
const { getRecommendations } = require("../recommender");
const cache = require("../cache");

function makeRecommendRouter(db) {
  const router = express.Router();

  router.post("/", (req, res) => {
    const profile = req.body;
    if (!profile || typeof profile !== "object") {
      return res.status(400).json({ error: "Request body must be a JSON object" });
    }

    // Check cache first
    const cached = cache.get(profile);
    if (cached) {
      // Tell the client this came from cache so they can see it working
      return res.json({ ...cached, cache: "HIT" });
    }

    const result = getRecommendations(db, profile);
    if (result.error) return res.status(400).json({ error: result.error });

    // Store in cache before responding
    cache.set(profile, result);

    res.json({ ...result, cache: "MISS" });
  });

  return router;
}

module.exports = { makeRecommendRouter };
