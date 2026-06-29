import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    text: text("text").notNull(),
    category: text("category").$type<"system" | "user" | "billing">().notNull(),
    priority: integer("priority").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    // B-Tree Indexes for fast filtering and sorting
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    categoryIdx: index("category_idx").on(table.category),
    priorityIdx: index("priority_idx").on(table.priority),
  }),
);

// We will add the FTS5 virtual table here once you are ready for the migration
// export const messagesFts = sqliteTable("messages_fts", { ... });

export interface Message {
  id: string;
  text: string;
  category: "system" | "user" | "billing";
  priority: number;
  isRead: boolean;
  createdAt: string;
}

export type NewMessage = typeof messages.$inferInsert;
