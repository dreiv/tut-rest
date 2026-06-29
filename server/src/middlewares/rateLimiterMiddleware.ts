import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";

const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });

/**
 * Parameterized Rate Limiter Factory
 * @param maxRequests Maximum allowance allowed in the window (default: 60)
 * @param windowSeconds Rolling window size in seconds (default: 60)
 */
export const rateLimiter = (
  maxRequests: number = 60,
  windowSeconds: number = 60,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const cacheKey = `ratelimit:${ip}:${req.method}:${req.originalUrl}`;
    const currentHits = rateLimitCache.get<number>(cacheKey) || 0;

    if (currentHits >= maxRequests) {
      console.warn(
        `🛑 Rate limit breached [${currentHits}/${maxRequests}] by IP: ${ip} on ${req.originalUrl}`,
      );
      res.status(429).json({
        error: `Too many requests. Optimized threshold is ${maxRequests} requests per ${windowSeconds}s.`,
      });
      return;
    }

    const currentTtl = rateLimitCache.getTtl(cacheKey);

    if (currentTtl) {
      const remainingSeconds = Math.max(
        1,
        Math.round((currentTtl - Date.now()) / 1000),
      );
      rateLimitCache.set(cacheKey, currentHits + 1, remainingSeconds);
    } else {
      rateLimitCache.set(cacheKey, currentHits + 1, windowSeconds);
    }

    next();
  };
};
