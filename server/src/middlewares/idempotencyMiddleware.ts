import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";

const idempotencyCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

interface CachedResponse {
  statusCode: number;
  body: string;
}

export const idempotencyInterceptor = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const cacheKey = req.header("idempotency-key");

  if (!cacheKey) {
    return next();
  }

  const cachedRecord = idempotencyCache.get<CachedResponse>(cacheKey);

  if (cachedRecord) {
    console.log(
      `🎯 Idempotency Match Found! Replaying cached response for key: ${cacheKey}`,
    );
    res.setHeader("X-Cache-Lookup", "HIT - Idempotent Replay");
    res.status(cachedRecord.statusCode).json(JSON.parse(cachedRecord.body));
    return;
  }

  const originalSend = res.send;

  res.send = function (body: any): Response {
    if (res.statusCode >= 200 && res.statusCode < 300 && body) {
      const responseData: CachedResponse = {
        statusCode: res.statusCode,
        body: typeof body === "string" ? body : JSON.stringify(body),
      };

      idempotencyCache.set(cacheKey, responseData);
      console.log(
        `💾 Successfully cached fresh idempotent lifecycle response for key: ${cacheKey}`,
      );
    }
    return originalSend.call(this, body);
  };

  next();
};
