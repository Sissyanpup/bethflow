import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@bethflow/shared';

const ROLE_RANK: Record<Role, number> = { GUEST: 0, USER: 1, ADMIN: 2 };

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const minRank = Math.min(...roles.map((r) => ROLE_RANK[r]));
    if (ROLE_RANK[user.role] < minRank && !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }

    next();
  };
}

export const requireUser = requireRole('USER', 'ADMIN');
export const requireAdmin = requireRole('ADMIN');
