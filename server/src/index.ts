import express from "express";
import * as swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

import { RegisterRoutes } from "./generated/routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

try {
  const swaggerSpecPath = path.join(
    process.cwd(),
    "src",
    "generated",
    "swagger.json",
  );
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerSpecPath, "utf8"));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.log(
    "⚠️ Run 'npm run tsoa:gen' first to generate your API documentation UI.",
  );
}

RegisterRoutes(app);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("❌ Handled Global Backend Error:", err.message || err);

    const status = err.status || 500;
    const message =
      err.message || "An unexpected internal server error occurred.";

    res.status(status).json({
      error: message,
    });
  },
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(
    `Swagger documentation available at http://localhost:${PORT}/api-docs`,
  );
});
