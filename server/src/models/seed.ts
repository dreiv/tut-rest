import { db } from "./db.js";
import { messages } from "./message.js";
import { randomUUID } from "crypto";

export async function seedDatabase() {
  const existing = await db.select().from(messages);

  if (existing.length === 0) {
    console.log("🌱 Database is empty. Seeding starter data with Drizzle...");

    const starterMessages = [
      { id: randomUUID(), text: "Hello world! Welcome to tut-rest." },
      { id: randomUUID(), text: "SQLite is running smoothly behind this API." },
      {
        id: randomUUID(),
        text: "Try using Postman or your client to delete this message!",
      },
    ];

    await db.insert(messages).values(starterMessages);
    console.log("✅ Seeding complete!");
  } else {
    console.log("⚠️ Database already has data. Skipping seed.");
  }
}

seedDatabase().catch((err) => {
  console.error("❌ Seeding failed:", err);
});
