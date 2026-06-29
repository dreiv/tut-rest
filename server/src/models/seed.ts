import { db } from "./db.js";
import { messages } from "./message.js";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";

export async function seedDatabase() {
  const existing = await db.select().from(messages);

  if (existing.length === 0) {
    console.log("🌱 Generating 999 rich mock records using Faker...");

    const categories: ("system" | "user" | "billing")[] = [
      "system",
      "user",
      "billing",
    ];

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
        category: faker.helpers.arrayElement(categories),
        priority: faker.number.int({ min: 1, max: 5 }),
        isRead: faker.datatype.boolean(0.8),
        createdAt: faker.date.past({ years: 0.25 }).toISOString(),
      };
    });

    console.log("🚀 Batch-inserting rich dataset into SQLite via Drizzle...");
    await db.insert(messages).values(starterMessages);

    console.log(
      `✅ Seeding complete! Added ${starterMessages.length} highly unique records with filterable fields.`,
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
