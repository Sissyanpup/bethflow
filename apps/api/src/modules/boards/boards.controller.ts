import type { Request, Response } from 'express';
import * as boardsService from './boards.service.js';

function handleServiceError(err: unknown, res: Response): boolean {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } });
    return true;
  }
  if (e.code === 'FORBIDDEN') {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: e.message } });
    return true;
  }
  return false;
}

export async function listBoards(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10));
  const { boards, total } = await boardsService.listBoards(req.user!.sub, page, limit);
  res.json({ success: true, data: boards, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getBoard(req: Request, res: Response): Promise<void> {
  try {
    const board = await boardsService.getBoard((req.params['id'] as string), req.user!.sub);
    res.json({ success: true, data: board });
  } catch (err) {
    if (!handleServiceError(err, res)) throw err;
  }
}

export async function createBoard(req: Request, res: Response): Promise<void> {
  const board = await boardsService.createBoard(req.user!.sub, req.body as { title: string; description?: string; color?: string });
  res.status(201).json({ success: true, data: board });
}

export async function updateBoard(req: Request, res: Response): Promise<void> {
  try {
    const board = await boardsService.updateBoard((req.params['id'] as string), req.user!.sub, req.body as { title?: string; description?: string; color?: string; isPublic?: boolean });
    res.json({ success: true, data: board });
  } catch (err) {
    if (!handleServiceError(err, res)) throw err;
  }
}

export async function deleteBoard(req: Request, res: Response): Promise<void> {
  try {
    await boardsService.deleteBoard((req.params['id'] as string), req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) {
    if (!handleServiceError(err, res)) throw err;
  }
}
