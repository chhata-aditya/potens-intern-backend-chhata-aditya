const express = require("express");
const { getRecommendations } = require("../recommender");

function makeRecommendRouter(db) {
  const router = express.Router();

  router.post("/", (req, res) => {
    const profile = req.body;
    if (!profile || typeof profile !== "object") {
      return res.status(400).json({ error: "Request body must be a JSON object" });
    }
    const result = getRecommendations(db, profile);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  return router;
}

module.exports = { makeRecommendRouter };
