const { all } = require("./db/database");

function scoreJob(job, profile) {
  let score = 0;
  const reasons = [];
  const mismatches = [];

  const jobSkills = JSON.parse(job.required_skills);
  const studentSkills = profile.skills.map((s) => s.toLowerCase());

  // Hard filter: CGPA below minimum
  if (profile.cgpa < job.min_cgpa) return null;

  // Hard filter: experience gap too large (e.g. job needs 1-2yr, student is fresher)
  const expMap = { fresher: 0, "0-1yr": 1, "1-2yr": 2 };
  const studentExp = expMap[profile.experience_level] ?? 0;
  const jobExp = expMap[job.experience_level] ?? 0;
  if (jobExp - studentExp > 1) return null;

  // Skill match: +10 per matched skill
  const matchedSkills = jobSkills.filter((skill) =>
    studentSkills.some(
      (s) => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s)
    )
  );
  const unmatchedSkills = jobSkills.filter((skill) =>
    !studentSkills.some(
      (s) => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s)
    )
  );
  score += matchedSkills.length * 10;
  if (matchedSkills.length > 0) {
    reasons.push(`You know ${matchedSkills.join(", ")}, which are required here.`);
  }
  if (unmatchedSkills.length > 0) {
    mismatches.push(`You'd need to pick up: ${unmatchedSkills.join(", ")}.`);
  }

  // Degree: +15 exact match, +5 if "Any"
  if (job.preferred_degree === "Any") {
    score += 5;
    reasons.push("Open to any degree — you qualify.");
  } else if (job.preferred_degree.toLowerCase() === profile.degree.toLowerCase()) {
    score += 15;
    reasons.push(`Your ${profile.degree} is exactly what they prefer.`);
  }

  // Domain preference: +20
  if (profile.preferred_domain &&
    job.domain.toLowerCase() === profile.preferred_domain.toLowerCase()) {
    score += 20;
    reasons.push(`Matches your preferred domain (${job.domain}).`);
  }

  // Location: +10
  if (profile.location &&
    (job.location.toLowerCase() === profile.location.toLowerCase() ||
      job.location.toLowerCase() === "remote")) {
    score += 10;
    reasons.push(`Based in ${job.location}, which fits your preference.`);
  }

  // CGPA headroom: +10 if well above cutoff
  const headroom = profile.cgpa - job.min_cgpa;
  if (headroom >= 1.5) {
    score += 10;
    reasons.push(`Your CGPA of ${profile.cgpa} is comfortably above their ${job.min_cgpa} minimum.`);
  } else {
    reasons.push(`Your CGPA of ${profile.cgpa} meets their ${job.min_cgpa} minimum.`);
  }

  const skillCoverage = Math.round((matchedSkills.length / jobSkills.length) * 100);
  const allReasons = [...reasons, ...mismatches];

  const reasoning =
    `${job.title} at ${job.company} is a ${skillCoverage}% skill match. ` +
    allReasons.join(" ") +
    ` Stipend: ₹${Number(job.stipend_min).toLocaleString()}–₹${Number(job.stipend_max).toLocaleString()}/month. Location: ${job.location}.`;

  return { score, reasoning };
}

function getRecommendations(db, profile) {
  // Validate
  const required = ["name", "cgpa", "degree", "skills", "experience_level"];
  const missing = required.filter((f) => profile[f] === undefined || profile[f] === null);
  if (missing.length > 0) return { error: `Missing required fields: ${missing.join(", ")}` };
  if (!Array.isArray(profile.skills) || profile.skills.length === 0)
    return { error: "skills must be a non-empty array" };
  if (profile.cgpa < 0 || profile.cgpa > 10)
    return { error: "cgpa must be between 0 and 10" };

  const allJobs = all(db, "SELECT * FROM jobs");
  const scored = [];

  for (const job of allJobs) {
    const result = scoreJob(job, profile);
    if (result !== null) scored.push({ job, ...result });
  }

  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);

  if (top3.length === 0) {
    return {
      recommendations: [],
      message: "No matching jobs found for your profile. Try broadening your skills or preferred domain.",
    };
  }

  return {
    recommendations: top3.map((entry, i) => ({
      rank: i + 1,
      job_id: entry.job.id,
      title: entry.job.title,
      company: entry.job.company,
      domain: entry.job.domain,
      location: entry.job.location,
      stipend_range: `₹${Number(entry.job.stipend_min).toLocaleString()} – ₹${Number(entry.job.stipend_max).toLocaleString()}/month`,
      match_score: entry.score,
      reasoning: entry.reasoning,
    })),
  };
}

module.exports = { getRecommendations };
