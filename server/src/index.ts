import express from "express";

import { RegisterRoutes } from "./generated/routes.js";
import { globalErrorHandler } from "./middlewares/errorHandlerMiddleware.js";
import { setupSwagger } from "./config/swagger.js";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// Register automated controller routes
RegisterRoutes(app);
// Attach TSOA OpenAPI documentation UI route handler
setupSwagger(app);

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(
    `Swagger documentation available at http://localhost:${PORT}/api-docs`,
  );
});
