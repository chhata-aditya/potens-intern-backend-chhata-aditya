// Simple API key auth for admin routes
// Key is hardcoded here for the take-home; in prod this would be an env variable

const ADMIN_KEY = "potens-admin-2026";

function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];

  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid x-admin-key header",
    });
  }

  next();
}

module.exports = { requireAdmin, ADMIN_KEY };
