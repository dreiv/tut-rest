import express from "express";
import * as swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";

import { RegisterRoutes } from "./generated/routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

RegisterRoutes(app);

const setupSwagger = () => {
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
    console.log(
      "⚠️ Run 'npm run tsoa:gen' first to generate your API documentation UI.",
    );

    console.error("Swagger Setup Error:", error);
  }
};

setupSwagger();

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
