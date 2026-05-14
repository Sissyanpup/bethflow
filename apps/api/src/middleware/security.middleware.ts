import helmet from 'helmet';
import cors from 'cors';
import type { RequestHandler } from 'express';

export function helmetMiddleware(): RequestHandler {
  return helmet({
    // API serves JSON only — CSP applies to HTML documents, not API responses.
    // Setting CSP on JSON responses is meaningless and causes issues when
    // Vite dev-server proxies these headers back to the browser.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
}

export function corsMiddleware(): RequestHandler {
  const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173').split(',');
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
