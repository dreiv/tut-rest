import { Express } from "express";
import * as swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";

/**
 * Reads the generated TSOA spec and binds the Swagger UI middleware stack
 * @param app The active Express application instance
 */
export function setupSwagger(app: Express): void {
  try {
    const swaggerSpecPath = path.join(
      process.cwd(),
      "src",
      "generated",
      "swagger.json",
    );

    const swaggerData = fs.readFileSync(swaggerSpecPath, "utf-8");
    const swaggerDocument = JSON.parse(swaggerData);

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (error) {
    console.warn(
      "⚠️ Run 'npm run tsoa:gen' first to generate your API documentation UI.",
    );
    console.error("Swagger Setup Error:", error);
  }
}
