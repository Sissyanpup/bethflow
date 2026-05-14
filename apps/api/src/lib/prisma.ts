import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? [{ emit: 'event', level: 'query' }]
        : [],
  });

if (process.env['NODE_ENV'] === 'development') {
  globalForPrisma.prisma = prisma;
  (prisma as PrismaClient).$on('query' as never, (e: { query: string; duration: number }) => {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'Prisma query');
  });
}
