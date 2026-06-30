import { db } from "@/models/db.js";
import { messages } from "@/models/schema.js";
import { eq, gte, and, asc, desc, count, sql } from "drizzle-orm";
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

export interface MessageCreationOverrides {
  category?: "system" | "user" | "billing";
  priority?: number;
}

const MAX_PAGINATION_LIMIT = 100;

export class MessageService {
  public async getAll(filters: MessageQueryFilters = {}) {
    const {
      search,
      category,
      minPriority,
      isRead,
      sortBy,
      order = "desc",
      page = 1,
    } = filters;

    let limit = filters.limit ?? 10;
    if (limit > MAX_PAGINATION_LIMIT) {
      limit = MAX_PAGINATION_LIMIT;
    } else if (limit <= 0) {
      limit = 10;
    }

    const conditions = [];

    if (category) conditions.push(eq(messages.category, category));
    if (minPriority !== undefined)
      conditions.push(gte(messages.priority, minPriority));
    if (isRead !== undefined) conditions.push(eq(messages.isRead, isRead));

    let safeFtsQuery = "";
    if (search) {
      // Strips FTS5 punctuation tokens but preserves Unicode letters/numbers across languages
      const cleanSearch = search.trim().replace(/[^\p{L}\p{N}\s]/gu, "");
      if (cleanSearch.length > 0) {
        safeFtsQuery = `"${cleanSearch}"*`;
      }
    }

    let dataQueryObj;
    let countQueryObj;

    if (safeFtsQuery) {
      const ftsJoin = sql`messages_fts`;

      dataQueryObj = db
        .select({
          id: messages.id,
          category: messages.category,
          priority: messages.priority,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          text: sql<string>`snippet(messages_fts, 1, '<mark>', '</mark>', '...', 15)`,
        })
        .from(messages)
        .innerJoin(ftsJoin, sql`messages_fts.id = ${messages.id}`)
        .where(and(sql`messages_fts MATCH ${safeFtsQuery}`, ...conditions));

      countQueryObj = db
        .select({ total: count() })
        .from(messages)
        .innerJoin(ftsJoin, sql`messages_fts.id = ${messages.id}`)
        .where(and(sql`messages_fts MATCH ${safeFtsQuery}`, ...conditions));
    } else {
      dataQueryObj = db.select().from(messages);
      countQueryObj = db.select({ total: count() }).from(messages);

      if (conditions.length > 0) {
        dataQueryObj.where(and(...conditions));
        countQueryObj.where(and(...conditions));
      }
    }

    let sortOrder;
    if (safeFtsQuery && !sortBy) {
      sortOrder = asc(sql`messages_fts.rank`);
    } else {
      const activeSortBy = sortBy || "createdAt";
      const sortColumn =
        activeSortBy === "priority" ? messages.priority : messages.createdAt;
      sortOrder = order === "asc" ? asc(sortColumn) : desc(sortColumn);
    }

    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * limit;
    dataQueryObj.orderBy(sortOrder).limit(limit).offset(offset);

    const [countResult, data] = await Promise.all([
      countQueryObj,
      dataQueryObj,
    ]);

    const totalRecords = countResult[0]?.total || 0;

    return {
      data,
      meta: {
        totalRecords,
        currentPage: safePage,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  public async getById(id: string) {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0] || null;
  }

  public async create(text: string, overrides: MessageCreationOverrides = {}) {
    const newId = randomUUID();
    const newMessage = {
      id: newId,
      text,
      category: overrides.category ?? ("user" as const),
      priority: overrides.priority ?? 3,
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
