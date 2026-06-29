import { db } from "@/models/db.js";
import { messages } from "@/models/message.js";
import { eq, like, gte, and, asc, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface MessageQueryFilters {
  search?: string;
  category?: "system" | "user" | "billing";
  minPriority?: number;
  isRead?: boolean;
  sortBy?: "createdAt" | "priority";
  order?: "asc" | "desc";
}

export class MessageService {
  public async getAll(filters: MessageQueryFilters = {}) {
    const {
      search,
      category,
      minPriority,
      isRead,
      sortBy = "createdAt",
      order = "desc",
    } = filters;

    const conditions = [];

    if (category) {
      conditions.push(eq(messages.category, category));
    }

    if (minPriority !== undefined) {
      conditions.push(gte(messages.priority, minPriority));
    }

    if (isRead !== undefined) {
      conditions.push(eq(messages.isRead, isRead));
    }

    if (search) {
      conditions.push(like(messages.text, `%${search}%`));
    }

    let query = db.select().from(messages);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const sortColumn =
      sortBy === "priority" ? messages.priority : messages.createdAt;
    const sortOrder = order === "asc" ? asc(sortColumn) : desc(sortColumn);

    return query.orderBy(sortOrder);
  }

  public async getById(id: string) {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0] || null;
  }

  public async create(text: string) {
    const newId = randomUUID();
    const newMessage = {
      id: newId,
      text,
      category: "user" as const, // Default fallback category type
      priority: 3, // Default fallback mid-priority
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await db.insert(messages).values(newMessage);
    return newMessage;
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
