import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  category: text("category").$type<"system" | "user" | "billing">().notNull(),
  priority: integer("priority").notNull(), // Numeric range scale from 1 to 5
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(), // Stored as ISO string timestamps
});

export interface Message {
  id: string;
  text: string;
  category: "system" | "user" | "billing";
  priority: number;
  isRead: boolean;
  createdAt: string;
}

export type NewMessage = typeof messages.$inferInsert;
