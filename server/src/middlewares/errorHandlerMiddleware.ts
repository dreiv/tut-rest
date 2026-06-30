import { Request, Response, NextFunction } from "express";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  [key: string]: any;
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(
    "❌ Handled Global Backend Error:",
    err.stack || err.message || err,
  );

  const status = err.status || 500;

  const detailMessage =
    IS_PRODUCTION && status === 500
      ? "An unexpected internal server error occurred on our systems."
      : err.message || "An unexpected internal server error occurred.";

  const protocol = req.protocol;
  const host = req.get("host");
  const docsBaseUrl = `${protocol}://${host}/errors`;

  let title = "Internal Server Error";
  let type = `${docsBaseUrl}/internal-error.html`;

  if (status === 400) {
    title = "Bad Request";
    type = `${docsBaseUrl}/validation-failed.html`;
  } else if (status === 404) {
    title = "Not Found";
    type = "about:blank";
  } else if (status === 429) {
    title = "Too Many Requests";
    type = `${docsBaseUrl}/rate-limit-exceeded.html`;
  }

  const problemResponseBody: ProblemDetails = {
    type,
    title,
    status,
    detail: detailMessage,
    instance: req.originalUrl,
  };

  if (err.fields) {
    problemResponseBody.type = `${docsBaseUrl}/validation-failed.html`;
    problemResponseBody.title = "Validation Failed";
    problemResponseBody.invalidParams = Object.keys(err.fields).map((key) => ({
      name: key,
      reason: err.fields[key].message,
    }));
  }

  res.setHeader("Content-Type", "application/problem+json");
  res.status(status).json(problemResponseBody);
};
