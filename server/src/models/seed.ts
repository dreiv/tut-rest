import db from "./db.js";
import { randomUUID } from "crypto";

export function seedDatabase() {
  const checkEmpty = db.prepare("SELECT COUNT(*) as count FROM messages");
  const row = checkEmpty.get() as { count: number };

  if (row.count === 0) {
    console.log("🌱 Database is empty. Seeding starter data...");

    const insertStmt = db.prepare(
      "INSERT INTO messages (id, text) VALUES (?, ?)",
    );
    const starterMessages = [
      "Hello world! Welcome to tut-rest.",
      "SQLite is running smoothly behind this API.",
      "Try using Postman or your client to delete this message!",
    ];

    const tx = db.transaction(() => {
      for (const text of starterMessages) {
        insertStmt.run(randomUUID(), text);
      }
    });

    tx();
    console.log("✅ Seeding complete!");
  } else {
    console.log(
      "⚠️ Database already has data. Skipping seed to prevent duplication.",
    );
  }
}

seedDatabase();
