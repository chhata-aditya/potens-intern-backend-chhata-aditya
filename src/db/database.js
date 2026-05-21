const initSqlJs = require("sql.js").default;
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data.db");

// sql.js works in-memory; we persist to disk manually using a Buffer
// This is a common pattern for sql.js in Node.js environments

let _db = null;

function saveDb(db) {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function loadDb(SQL) {
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    return new SQL.Database(fileBuffer);
  }
  return new SQL.Database();
}

// We expose a synchronous-looking interface by initializing eagerly
// getDb() returns a promise the first time, then the cached db
let _initPromise = null;

function init() {
  if (_initPromise) return _initPromise;

  _initPromise = initSqlJs().then((SQL) => {
    _db = loadDb(SQL);

    _db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        domain TEXT NOT NULL,
        min_cgpa REAL NOT NULL,
        required_skills TEXT NOT NULL,
        preferred_degree TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        location TEXT NOT NULL,
        stipend_min INTEGER NOT NULL,
        stipend_max INTEGER NOT NULL,
        description TEXT NOT NULL,
        eligibility_logic TEXT NOT NULL
      );
    `);

    saveDb(_db);
    return _db;
  });

  return _initPromise;
}

// Helper: run a query and return all rows as objects
function all(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row as object (or null)
function get(db, sql, params = []) {
  const rows = all(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run INSERT/UPDATE/DELETE, auto-save to disk
function run(db, sql, params = []) {
  db.run(sql, params);
  saveDb(db);
  // Get last insert rowid
  const res = all(db, "SELECT last_insert_rowid() as id");
  return { lastInsertRowid: res[0]?.id };
}

module.exports = { init, all, get, run };
