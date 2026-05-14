import type { Request, Response } from 'express';
import * as projectsService from './projects.service.js';

function handleServiceError(err: unknown, res: Response): boolean {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } }); return true; }
  if (e.code === 'FORBIDDEN') { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: e.message } }); return true; }
  return false;
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    const task = await projectsService.updateTask(req.params['id']!, req.user!.sub, req.body as Parameters<typeof projectsService.updateTask>[2]);
    res.json({ success: true, data: task });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    await projectsService.deleteTask(req.params['id']!, req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}
