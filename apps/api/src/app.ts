import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';

import { validateEnv } from './lib/env.js';
import { helmetMiddleware, corsMiddleware } from './middleware/security.middleware.js';
import { apiRateLimit, initRateLimiters } from './middleware/rate-limit.middleware.js';
import { authenticate } from './middleware/auth.middleware.js';
import { connectRedis } from './lib/redis.js';
import { initSocket } from './lib/socket.js';
import { logger } from './lib/logger.js';

import { authRouter } from './modules/auth/auth.router.js';
import { usersRouter } from './modules/users/users.router.js';
import { boardsRouter } from './modules/boards/boards.router.js';
import { listsRouter } from './modules/boards/lists.router.js';
import { cardsRouter } from './modules/cards/cards.router.js';
import { catalogsRouter } from './modules/catalogs/catalogs.router.js';
import { projectsRouter } from './modules/projects/projects.router.js';
import { tasksRouter } from './modules/projects/tasks.router.js';
import { socialLinksRouter, publicSocialLinksRouter } from './modules/social-links/social-links.router.js';
import { publicUsersRouter } from './modules/users/public-users.router.js';
import { publicBoardsRouter } from './modules/boards/public-boards.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { feedbackRouter } from './modules/notifications/feedback.router.js';

const app = express();
const server = createServer(app);

// Security
app.use(helmetMiddleware());
app.use(corsMiddleware());
app.set('trust proxy', 1);

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check (no auth, no rate limit)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.use('/api/auth', authRouter);
app.use('/api/social-links', publicSocialLinksRouter);
app.use('/api/public/users', publicUsersRouter);
app.use('/api/public', publicBoardsRouter);

// Authenticated API routes
app.use('/api', authenticate, apiRateLimit);
app.use('/api/users', usersRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/lists', listsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/catalogs', catalogsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/me/social-links', socialLinksRouter);
app.use('/api/admin', adminRouter);
app.use('/api/feedback', feedbackRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
  });
});

const PORT = parseInt(process.env['PORT'] ?? '4000', 10);

async function start() {
  validateEnv();
  await connectRedis();
  initRateLimiters();
  initSocket(server);
  server.listen(PORT, () => {
    logger.info(`Bethflow API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});

export { app };
