/**
 * Simple in-memory cache with TTL (time-to-live).
 *
 * Why in-memory and not Redis?
 * For a catalogue this size, in-memory is the right call — zero dependencies,
 * zero setup, and the cache is scoped to the process lifetime which is fine
 * for a recommendation service where the catalogue changes infrequently.
 * If this scaled to multiple server instances, Redis would be the upgrade path.
 *
 * TTL is set to 5 minutes. Reasoning: job listings don't change by the second,
 * but a student might tweak their profile and expect fresh results soon after.
 * 5 minutes balances performance with freshness.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes

const store = new Map();

/**
 * Build a deterministic cache key from a profile object.
 * We sort the skills array so ["Node.js", "SQL"] and ["SQL", "Node.js"]
 * produce the same key — same profile, same result.
 */
function makeKey(profile) {
  const normalized = {
    cgpa: profile.cgpa,
    degree: (profile.degree || "").toLowerCase(),
    skills: [...(profile.skills || [])].map(s => s.toLowerCase()).sort(),
    experience_level: profile.experience_level,
    preferred_domain: (profile.preferred_domain || "").toLowerCase(),
    location: (profile.location || "").toLowerCase(),
  };
  return JSON.stringify(normalized);
}

function get(profile) {
  const key = makeKey(profile);
  const entry = store.get(key);
  if (!entry) return null;

  // Check if entry has expired
  if (Date.now() - entry.timestamp > TTL_MS) {
    store.delete(key);
    return null;
  }

  return entry.value;
}

function set(profile, value) {
  const key = makeKey(profile);
  store.set(key, { value, timestamp: Date.now() });
}

// Expose cache size for the /cache-stats endpoint
function stats() {
  // Clean expired entries before reporting
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.timestamp > TTL_MS) store.delete(key);
  }
  return { entries: store.size, ttl_seconds: TTL_MS / 1000 };
}

module.exports = { get, set, stats };
