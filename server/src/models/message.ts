import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
});

export interface Message {
  id: string;
  text: string;
}

export type NewMessage = typeof messages.$inferInsert;
