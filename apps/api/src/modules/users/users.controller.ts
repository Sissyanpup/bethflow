import type { Request, Response } from 'express';
import * as usersService from './users.service.js';

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await usersService.getUserById(req.user!.sub);
  res.json({ success: true, data: user });
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const user = await usersService.getUserById((req.params['id'] as string));
    res.json({ success: true, data: user });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } });
      return;
    }
    throw err;
  }
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = await usersService.updateUser(req.user!.sub, req.body as { displayName?: string; bio?: string; avatarUrl?: string });
  res.json({ success: true, data: user });
}

export async function exportMe(req: Request, res: Response): Promise<void> {
  const data = await usersService.exportUserData(req.user!.sub);
  const filename = `bethflow-export-${data.profile.username}-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, data });
}

export async function deleteMe(req: Request, res: Response): Promise<void> {
  await usersService.deleteUserAccount(req.user!.sub);
  res.json({ success: true, data: { message: 'Account deactivated. Your data has been retained per our retention policy.' } });
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const q = String(req.query['q'] ?? '');
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)));
  const { users, total } = await usersService.searchUsers(q, page, limit);
  res.json({
    success: true,
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
