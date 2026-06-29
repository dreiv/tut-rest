import { db } from "../models/db.js";
import { messages } from "../models/message.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export class MessageService {
  public async getAll() {
    return db.select().from(messages);
  }

  public async getById(id: string) {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  public async create(text: string) {
    const id = randomUUID();
    await db.insert(messages).values({ id, text });
    return { id, text };
  }

  public async update(id: string, text: string) {
    const result = await db
      .update(messages)
      .set({ text })
      .where(eq(messages.id, id));

    return result.changes > 0;
  }

  public async delete(id: string) {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return result.changes > 0;
  }
}
