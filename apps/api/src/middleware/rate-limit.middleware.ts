import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RequestHandler } from 'express';
import { redis } from '../lib/redis.js';

// Stable references registered on routers at import time.
// Delegates to real handlers once initRateLimiters() is called (after Redis connects).
let _auth: RateLimitRequestHandler | undefined;
let _api: RateLimitRequestHandler | undefined;

export const authRateLimit: RequestHandler = (req, res, next) => _auth!(req, res, next);
export const apiRateLimit: RequestHandler = (req, res, next) => _api!(req, res, next);

export function initRateLimiters(): void {
  function makeStore(prefix: string) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redis.sendCommand(args),
      prefix,
    });
  }

  _auth = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('auth_rl:'),
    // Key = IP + email so each credential pair gets its own bucket.
    // Prevents Docker-gateway IP collapse where all sessions share one bucket.
    keyGenerator: (req) => {
      const email = (req.body as { email?: string })?.email?.toLowerCase() ?? '';
      return `${req.ip ?? 'unknown'}:${email}`;
    },
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many login attempts. Try again after 15 minutes.',
      },
    },
  });

  _api = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('api_rl:'),
    keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'unknown',
    message: {
      success: false,
      error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded. Slow down.' },
    },
  });
}
