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

    const cacheKey = `rl:${ip}:${req.method}:${req.path}`;

    const currentHits = rateLimitCache.get<number>(cacheKey) || 0;
    const currentTtl = rateLimitCache.getTtl(cacheKey);

    let remainingSeconds = windowSeconds;
    if (currentTtl) {
      remainingSeconds = Math.max(
        1,
        Math.round((currentTtl - Date.now()) / 1000),
      );
    }

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - currentHits - 1),
    );

    if (currentHits >= maxRequests) {
      console.warn(`🛑 Rate limit enforced for ${ip} on path: ${req.path}`);
      res.setHeader("Retry-After", remainingSeconds);
      res.status(429).json({
        error: `Too many requests. Please try again in ${remainingSeconds} seconds.`,
      });
      return;
    }

    if (currentTtl) {
      rateLimitCache.set(cacheKey, currentHits + 1, remainingSeconds);
    } else {
      rateLimitCache.set(cacheKey, currentHits + 1, windowSeconds);
    }

    next();
  };
};
