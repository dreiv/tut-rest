import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/generated/migrations",
  schema: "./src/models/message.ts",
  dialect: "sqlite",
  dbCredentials: { url: "sqlite.db" },
});
