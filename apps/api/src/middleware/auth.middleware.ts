import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import type { TokenPayload } from '@bethflow/shared';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

function getPublicKey(): string {
  const key = process.env['JWT_PUBLIC_KEY'];
  if (!key) throw new Error('JWT_PUBLIC_KEY is not set');
  return key.replace(/\\n/g, '\n');
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
    });
    return;
  }

  const token = header.slice(7);

  // Try JWT first (fast, no DB)
  try {
    const payload = jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as TokenPayload;
    req.user = payload;
    next();
    return;
  } catch {
    // not a JWT — fall through
  }

  // Bot tokens are exactly 64 hex chars
  if (!/^[0-9a-f]{64}$/.test(token)) {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Access token is invalid or expired' },
    });
    return;
  }

  // DB lookup for bot token
  try {
    const botToken = await prisma.botToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!botToken || botToken.expiresAt < new Date() || !botToken.user.isActive) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Access token is invalid or expired' },
      });
      return;
    }

    // Fire-and-forget lastUsedAt update
    prisma.botToken
      .update({ where: { id: botToken.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    req.user = {
      sub: botToken.user.id,
      email: botToken.user.email,
      role: botToken.user.role as TokenPayload['role'],
    } as TokenPayload;

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Access token is invalid or expired' },
    });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as TokenPayload;
    req.user = payload;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
