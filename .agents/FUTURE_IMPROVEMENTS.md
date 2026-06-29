# 🚀 Architectural Roadmap & Future Improvements

This document outlines potential optimizations, advanced search features, and scalability improvements for the messages service and search infrastructure.

---

## 📑 Table of Contents

1. [Search Enhancements](#1-search-enhancements)
2. [Performance & Scalability](#2-performance--scalability)
3. [Real-Time Capabilities](#3-real-time-capabilities)
4. [Robustness & Code Quality](#4-robustness--code-quality)

---

## 1. Search Enhancements

### 🔹 Linguistic Word Stemming (Porter Stemmer)

- **What it is:** Upgrading the SQLite FTS5 tokenizer from `unicode61` (exact matches) to `porter`. The Porter Stemming algorithm reduces words to their base linguistic form.
- **Why do it:** It makes search significantly smarter. A search for `"completing"` or `"completed"` will flawlessly match a record containing `"complete"`.
- **Implementation Note:** Requires modifying `db.ts` and dropping/re-seeding `sqlite.db` since the disk-level token index structure changes.
  ```sql
  CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    id UNINDEXED,
    text,
    tokenize = "porter unicode61"
  );
  ```

````

### 🔹 Multi-Column Search Matrix

* **What it is:** Expanding the FTS5 virtual table to index columns beyond just `text`, such as `category`.
* **Why do it:** Allows cross-field searches (e.g., searching for the term `"billing system"` across both category and message content simultaneously) using specialized FTS weights.
```sql
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  id UNINDEXED,
  category,
  text
);

````

---

## 2. Performance & Scalability

### 🔹 Cursor-Based Pagination (Keyset Pagination)

- **What it is:** Replacing standard Offset Pagination (`.limit().offset()`) with cursor positioning based on a sequential anchor (e.g., `createdAt` + `id`).
- **Why do it:**

1. **Constant Time ($O(\log N)$):** Offset pagination slows down significantly on deep pages (e.g., page 5,000) because SQLite must read and discard all leading records. Cursors leverage indexes to jump directly to the target row.
2. **No Data Drifting:** Prevents rows from duplicating or skipping on the frontend if new messages are inserted while a user is actively scrolling.

- **API Structure Change:** `?page=2` changes to `?cursor=2026-06-29T12:00:00.000Z_uuid`.

### 🔹 Explicit `INNER JOIN` Strategy

- **What it is:** Rewriting the dynamic query builder to use an `innerJoin()` on `messages_fts` rather than an `IN (SELECT id FROM...)` subquery condition.
- **Why do it:** While SQLite heavily optimizes subqueries, explicit joins give the internal query planner ultimate control over relational mapping when datasets climb into the millions of rows.

---

## 3. Real-Time Capabilities

### 🔹 Server-Sent Events (SSE) or WebSockets

- **What it is:** Establishing a persistent, unidirectional (SSE) or bidirectional (WS) connection channel between the client and backend.
- **Why do it:** Currently, the system relies on local optimistic updates. If an background worker or system process creates a critical `system` or `billing` alert, the frontend won't reflect it without polling or manual reloading.
- **How it fits:** Since database triggers handle automated FTS writes atomically, the `MessageService.create()` method can safely broadcast new items over the socket line immediately following a successful Drizzle insert.

---

## 4. Robustness & Code Quality

### 🔹 Input Schema Validation (Zod)

- **What it is:** Intercepting query string parameters and request bodies with strict parser schemas before passing objects to the service layer.
- **Why do it:** Protects database compilers and prevents unhandled runtime exceptions if malformed parameters (e.g., `?page=invalid` or `?category=malicious_string`) slip through Express routing.

```typescript
export const MessageQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(["system", "user", "billing"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
```

### 🔹 High-Frequency Text Sanitization

- **What it is:** Improving the current regex character stripper (`/[^a-zA-Z0-9 ]/g`) to support advanced FTS5 query operator syntax natively (like `AND`, `OR`, or `NOT`), rather than stripping them.
- **Why do it:** Allows power users to run complex filtering operations directly from your application's simple search bar input (e.g., searching for `"matrix AND NOT system"`).

```

```
