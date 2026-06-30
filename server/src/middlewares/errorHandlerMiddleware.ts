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

  let title = "Internal Server Error";
  let type = "https://api.yourservice.com/errors/internal-error";

  if (status === 400) {
    title = "Bad Request";
    type = "https://api.yourservice.com/errors/bad-request";
  } else if (status === 404) {
    title = "Not Found";
    type = "https://api.yourservice.com/errors/not-found";
  } else if (status === 429) {
    title = "Too Many Requests";
    type = "https://api.yourservice.com/errors/rate-limit-exceeded";
  }

  const problemResponseBody: ProblemDetails = {
    type,
    title,
    status,
    detail: detailMessage,
    instance: req.originalUrl,
  };

  if (err.fields) {
    problemResponseBody.type =
      "https://api.yourservice.com/errors/validation-failed";
    problemResponseBody.title = "Validation Failed";
    problemResponseBody.invalidParams = Object.keys(err.fields).map((key) => ({
      name: key,
      reason: err.fields[key].message,
    }));
  }

  res.setHeader("Content-Type", "application/problem+json");

  res.status(status).json(problemResponseBody);
};
