import db from "./db.js";
import { randomUUID } from "crypto";

export interface Message {
  id: string;
  text: string;
}

export const MessageModel = {
  getAll: (): Message[] => {
    const stmt = db.prepare("SELECT * FROM messages");
    return stmt.all() as Message[];
  },

  getById: (id: string): Message | undefined => {
    const stmt = db.prepare("SELECT * FROM messages WHERE id = ?");
    return stmt.get(id) as Message | undefined;
  },

  create: (text: string): Message => {
    const id = randomUUID();
    const stmt = db.prepare("INSERT INTO messages (id, text) VALUES (?, ?)");
    stmt.run(id, text);
    return { id, text };
  },

  update: (id: string, text: string): boolean => {
    const stmt = db.prepare("UPDATE messages SET text = ? WHERE id = ?");
    const result = stmt.run(text, id);
    return result.changes > 0; // Returns true if a row was actually updated
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare("DELETE FROM messages WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0; // Returns true if a row was deleted
  },
};
