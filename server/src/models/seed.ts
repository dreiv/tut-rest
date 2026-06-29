import { db } from "./db.js";
import { messages } from "./message.js";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";

export async function seedDatabase() {
  const existing = await db.select().from(messages);

  if (existing.length === 0) {
    console.log("🌱 Generating 999 realistic mock records using Faker...");

    const starterMessages = Array.from({ length: 999 }, (_, index) => {
      let dynamicText = "";

      if (index % 3 === 0) {
        dynamicText = `[${faker.hacker.noun().toUpperCase()}] ${faker.hacker.phrase()}`;
      } else if (index % 3 === 1) {
        dynamicText = `Message from ${faker.person.fullName()}: "${faker.lorem.sentence()}"`;
      } else {
        dynamicText = `System Broadcast: ${faker.company.catchPhrase()} — ${faker.hacker.verb()} completed.`;
      }

      return {
        id: randomUUID(),
        text: dynamicText,
      };
    });

    console.log("🚀 Batch-inserting Faker dataset into SQLite...");
    await db.insert(messages).values(starterMessages);

    console.log(
      `✅ Seeding complete! Added ${starterMessages.length} highly unique records.`,
    );
  } else {
    console.log(
      `⚠️ Database already contains ${existing.length} records. Skipping seed.`,
    );
  }
}

seedDatabase().catch((err) => {
  console.error("❌ Seeding failed:", err);
});
