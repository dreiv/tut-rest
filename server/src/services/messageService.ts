import { db } from "@/models/db.js";
import { messages } from "@/models/message.js";
import { eq, like, gte, and, asc, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface MessageQueryFilters {
  search?: string;
  category?: "system" | "user" | "billing";
  minPriority?: number;
  isRead?: boolean;
  sortBy?: "createdAt" | "priority";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
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
      page = 1,
      limit = 10,
    } = filters;

    const conditions = [];

    if (category) conditions.push(eq(messages.category, category));
    if (minPriority !== undefined)
      conditions.push(gte(messages.priority, minPriority));
    if (isRead !== undefined) conditions.push(eq(messages.isRead, isRead));
    if (search) conditions.push(like(messages.text, `%${search}%`));

    let countQuery = db.select({ total: count() }).from(messages);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
    }
    const countResult = await countQuery;
    const totalRecords = countResult[0]?.total || 0;

    let query = db.select().from(messages);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const sortColumn =
      sortBy === "priority" ? messages.priority : messages.createdAt;
    const sortOrder = order === "asc" ? asc(sortColumn) : desc(sortColumn);

    const offset = (page - 1) * limit;

    const data = await query.orderBy(sortOrder).limit(limit).offset(offset);

    return {
      data,
      meta: {
        totalRecords,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
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
