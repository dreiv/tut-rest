import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve("sqlite.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL
  )
`);

export default db;
