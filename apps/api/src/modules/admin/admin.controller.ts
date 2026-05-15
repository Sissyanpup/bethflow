import type { Request, Response } from 'express';
import * as adminService from './admin.service.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const limit = Math.min(100, parseInt(String(req.query['limit'] ?? '20'), 10));
  const search = req.query['search'] ? String(req.query['search']) : undefined;
  const { users, total } = await adminService.adminListUsers(page, limit, search);
  res.json({ success: true, data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.adminGetStats();
  res.json({ success: true, data: stats });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const user = await adminService.adminUpdateUser((req.params['id'] as string), req.body as { role?: string; isActive?: boolean; isVerified?: boolean });
  res.json({ success: true, data: user });
}

export async function softDeleteUser(req: Request, res: Response): Promise<void> {
  await adminService.adminSoftDeleteUser((req.params['id'] as string));
  res.json({ success: true, data: null });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await adminService.adminCreateUser(req.body as Parameters<typeof adminService.adminCreateUser>[0]);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'CONFLICT') {
      res.status(409).json({ success: false, error: { code: 'CONFLICT', message: e.message } });
      return;
    }
    throw err;
  }
}
