const { init, run, all } = require("../src/db/database");

const jobs = [
  { title: "Frontend Developer Intern", company: "Razorpay", domain: "frontend", min_cgpa: 7.0, required_skills: JSON.stringify(["HTML","CSS","JavaScript","React"]), preferred_degree: "Any", experience_level: "fresher", location: "Bangalore", stipend_min: 20000, stipend_max: 30000, description: "Build UI components for India's leading payment gateway.", eligibility_logic: "Open to any CS/IT degree with CGPA above 7.0. Must know React. Freshers welcome." },
  { title: "Backend Engineer Intern", company: "Zepto", domain: "backend", min_cgpa: 7.5, required_skills: JSON.stringify(["Node.js","Express","SQL","REST APIs"]), preferred_degree: "Any", experience_level: "fresher", location: "Mumbai", stipend_min: 25000, stipend_max: 35000, description: "High-throughput backend services for 10-minute grocery delivery.", eligibility_logic: "Node.js and SQL required. CGPA 7.5+. Any CS degree." },
  { title: "Full Stack Intern", company: "Potens IT", domain: "fullstack", min_cgpa: 7.0, required_skills: JSON.stringify(["JavaScript","Node.js","React","MySQL"]), preferred_degree: "MCA", experience_level: "fresher", location: "Pune", stipend_min: 15000, stipend_max: 20000, description: "Small team building software for high-responsibility environments.", eligibility_logic: "Prefers MCA students with full stack experience. Freshers only. CGPA 7.0+." },
  { title: "Data Analyst Intern", company: "PhonePe", domain: "data", min_cgpa: 7.0, required_skills: JSON.stringify(["Python","SQL","Excel"]), preferred_degree: "Any", experience_level: "fresher", location: "Bangalore", stipend_min: 20000, stipend_max: 28000, description: "Analyze transaction data to surface product insights.", eligibility_logic: "Python and SQL required. CGPA 7.0+. Freshers welcome." },
  { title: "UI/UX Design Intern", company: "Swiggy", domain: "design", min_cgpa: 6.5, required_skills: JSON.stringify(["Figma","Wireframing","Prototyping"]), preferred_degree: "Any", experience_level: "fresher", location: "Bangalore", stipend_min: 18000, stipend_max: 25000, description: "Design flows for millions of users daily.", eligibility_logic: "Figma proficiency required. Portfolio needed. CGPA 6.5+." },
  { title: "DevOps Intern", company: "Freshworks", domain: "devops", min_cgpa: 7.5, required_skills: JSON.stringify(["Linux","Git","Docker","CI/CD"]), preferred_degree: "BTech", experience_level: "0-1yr", location: "Chennai", stipend_min: 22000, stipend_max: 32000, description: "Maintain CI/CD pipelines for a globally used CRM product.", eligibility_logic: "Prefers BTech with Docker/Linux knowledge. Some prior exposure preferred." },
  { title: "Android Developer Intern", company: "CRED", domain: "mobile", min_cgpa: 7.0, required_skills: JSON.stringify(["Java","Android SDK","REST APIs"]), preferred_degree: "Any", experience_level: "fresher", location: "Bangalore", stipend_min: 25000, stipend_max: 40000, description: "Build features in one of India's most design-obsessed apps.", eligibility_logic: "Java + Android SDK required. CGPA 7.0+. Freshers considered." },
  { title: "Machine Learning Intern", company: "Ola", domain: "ml", min_cgpa: 8.0, required_skills: JSON.stringify(["Python","Scikit-learn","Pandas","Statistics"]), preferred_degree: "Any", experience_level: "fresher", location: "Bangalore", stipend_min: 30000, stipend_max: 45000, description: "Demand forecasting and pricing models at scale.", eligibility_logic: "Strong Python and statistics required. CGPA threshold is high at 8.0." },
  { title: "QA Engineer Intern", company: "Infosys", domain: "qa", min_cgpa: 6.5, required_skills: JSON.stringify(["Manual Testing","SQL","Bug Reporting"]), preferred_degree: "Any", experience_level: "fresher", location: "Hyderabad", stipend_min: 12000, stipend_max: 18000, description: "Ensure software quality for enterprise banking and insurance clients.", eligibility_logic: "Low CGPA bar. Any degree. No prior experience needed." },
  { title: "Cloud Intern", company: "TCS", domain: "cloud", min_cgpa: 6.5, required_skills: JSON.stringify(["AWS","Linux","Networking Basics"]), preferred_degree: "Any", experience_level: "fresher", location: "Noida", stipend_min: 15000, stipend_max: 20000, description: "Support cloud migration projects under senior engineers.", eligibility_logic: "Any CS degree. AWS basics sufficient. CGPA 6.5+." },
  { title: "React Native Intern", company: "Meesho", domain: "mobile", min_cgpa: 7.0, required_skills: JSON.stringify(["React Native","JavaScript","REST APIs"]), preferred_degree: "Any", experience_level: "fresher", location: "Bangalore", stipend_min: 20000, stipend_max: 30000, description: "Build features for a social commerce app used by millions.", eligibility_logic: "React Native experience required. CGPA 7.0+. Freshers welcome." },
  { title: "PHP Developer Intern", company: "Nagarro", domain: "backend", min_cgpa: 6.5, required_skills: JSON.stringify(["PHP","MySQL","HTML","CSS"]), preferred_degree: "Any", experience_level: "fresher", location: "Remote", stipend_min: 12000, stipend_max: 18000, description: "Maintain and extend legacy PHP systems for global clients.", eligibility_logic: "PHP + MySQL required. CGPA bar is low. Remote — open to all locations." },
  { title: "Java Backend Intern", company: "Wipro", domain: "backend", min_cgpa: 7.0, required_skills: JSON.stringify(["Java","JDBC","SQL","OOP"]), preferred_degree: "MCA", experience_level: "fresher", location: "Hyderabad", stipend_min: 15000, stipend_max: 22000, description: "Java microservices for banking clients.", eligibility_logic: "Java + JDBC required. Prefers MCA. CGPA 7.0+." },
  { title: "Technical Content Intern", company: "GeeksforGeeks", domain: "content", min_cgpa: 6.0, required_skills: JSON.stringify(["Writing","DSA","Any Programming Language"]), preferred_degree: "Any", experience_level: "fresher", location: "Remote", stipend_min: 8000, stipend_max: 12000, description: "Write tutorials consumed by millions of learners daily.", eligibility_logic: "Lowest CGPA bar. Communication and coding ability matter more than grades." },
  { title: "Cybersecurity Intern", company: "HCL Technologies", domain: "security", min_cgpa: 7.5, required_skills: JSON.stringify(["Networking","Linux","Ethical Hacking Basics"]), preferred_degree: "BTech", experience_level: "0-1yr", location: "Noida", stipend_min: 18000, stipend_max: 25000, description: "Vulnerability assessments and security audits for enterprise clients.", eligibility_logic: "Prefers BTech. Networking and Linux required. CGPA 7.5+." },
  { title: "Product Management Intern", company: "Groww", domain: "product", min_cgpa: 7.5, required_skills: JSON.stringify(["Communication","SQL","Figma","Analytical Thinking"]), preferred_degree: "Any", experience_level: "fresher", location: "Bangalore", stipend_min: 25000, stipend_max: 35000, description: "Ship features for India's largest stock trading app.", eligibility_logic: "High communication bar. SQL and Figma are a plus. CGPA 7.5+." },
];

async function seed() {
  const db = await init();

  // Clear existing
  db.run("DELETE FROM jobs");
  db.run("DELETE FROM sqlite_sequence WHERE name='jobs'");

  for (const job of jobs) {
    run(db,
      `INSERT INTO jobs (title,company,domain,min_cgpa,required_skills,preferred_degree,
       experience_level,location,stipend_min,stipend_max,description,eligibility_logic)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [job.title, job.company, job.domain, job.min_cgpa, job.required_skills,
       job.preferred_degree, job.experience_level, job.location,
       job.stipend_min, job.stipend_max, job.description, job.eligibility_logic]
    );
  }

  console.log(`✅ Seeded ${jobs.length} jobs.`);
  process.exit(0);
}

seed();
