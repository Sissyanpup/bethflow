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

export async function createList(req: Request, res: Response): Promise<void> {
  try {
    const list = await boardsService.createList((req.params['id'] as string), req.user!.sub, req.body as { title: string });
    res.status(201).json({ success: true, data: list });
  } catch (err) {
    if (!handleServiceError(err, res)) throw err;
  }
}

export async function updateList(req: Request, res: Response): Promise<void> {
  try {
    const list = await boardsService.updateList((req.params['id'] as string), req.user!.sub, req.body as { title?: string; position?: number });
    res.json({ success: true, data: list });
  } catch (err) {
    if (!handleServiceError(err, res)) throw err;
  }
}

export async function deleteList(req: Request, res: Response): Promise<void> {
  try {
    await boardsService.deleteList((req.params['id'] as string), req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) {
    if (!handleServiceError(err, res)) throw err;
  }
}
