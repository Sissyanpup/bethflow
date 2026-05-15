import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RequestHandler } from 'express';
import { redis } from '../lib/redis.js';

// Stable references registered on routers at import time.
// Delegates to real handlers once initRateLimiters() is called (after Redis connects).
let _auth: RateLimitRequestHandler | undefined;
let _otp: RateLimitRequestHandler | undefined;
let _api: RateLimitRequestHandler | undefined;

export const authRateLimit: RequestHandler = (req, res, next) => _auth!(req, res, next);
// Stricter limit for OTP verify — 5 attempts per 10 min per IP+email to prevent brute force of 6-digit codes.
export const otpRateLimit: RequestHandler = (req, res, next) => _otp!(req, res, next);
export const apiRateLimit: RequestHandler = (req, res, next) => _api!(req, res, next);

export function initRateLimiters(): void {
  function makeStore(prefix: string) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redis.sendCommand(args),
      prefix,
    });
  }

  const emailKeyGen = (req: Parameters<RateLimitRequestHandler>[0]) => {
    const email = (req.body as { email?: string })?.email?.toLowerCase() ?? '';
    return `${req.ip ?? 'unknown'}:${email}`;
  };

  _auth = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('auth_rl:'),
    // Key = IP + email so each credential pair gets its own bucket.
    // Prevents Docker-gateway IP collapse where all sessions share one bucket.
    keyGenerator: emailKeyGen,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many login attempts. Try again after 15 minutes.',
      },
    },
  });

  _otp = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore('otp_rl:'),
    keyGenerator: emailKeyGen,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many verification attempts. Try again after 10 minutes.',
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
