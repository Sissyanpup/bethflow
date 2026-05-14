import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
    });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as TokenPayload;
    req.user = payload;
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
