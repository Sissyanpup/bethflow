import { createClient } from 'redis';
import { logger } from './logger.js';

export const redis = createClient({
  url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
});

redis.on('error', (err) => logger.error({ err }, 'Redis client error'));
redis.on('connect', () => logger.info('Redis connected'));

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}
