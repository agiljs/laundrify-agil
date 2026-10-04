import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function getClientKey(req: Request) {
  return `${req.ip ?? "unknown"}:${req.path}`;
}

export function authRateLimit(options: { limit?: number; windowMs?: number } = {}) {
  const limit = options.limit ?? 8;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = getClientKey(req);
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({
        success: false,
        message: "Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi.",
      });
    }

    current.count += 1;
    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();
