import type { Request, Response } from 'express';
import * as service from './public-users.service.js';

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const q = String(req.query['q'] ?? '').trim();
  if (!q || q.length < 2) {
    res.json({ success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    return;
  }
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const limit = Math.min(20, parseInt(String(req.query['limit'] ?? '10'), 10));
  const { users, total } = await service.searchPublicUsers(q, page, limit);
  res.json({ success: true, data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
