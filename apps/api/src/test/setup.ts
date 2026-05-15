import { beforeAll, afterAll } from 'vitest';
import { connectRedis, redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { initRateLimiters } from '../middleware/rate-limit.middleware.js';

beforeAll(async () => {
  await connectRedis();
  initRateLimiters();
});

afterAll(async () => {
  await redis.quit().catch(() => {});
  await prisma.$disconnect();
});
