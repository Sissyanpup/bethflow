import type { Request, Response } from 'express';
import * as service from './social-links.service.js';

function handleServiceError(err: unknown, res: Response): boolean {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } }); return true; }
  if (e.code === 'FORBIDDEN') { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: e.message } }); return true; }
  return false;
}

export async function getPublicLinks(req: Request, res: Response): Promise<void> {
  try {
    const data = await service.getPublicLinks((req.params['username'] as string));
    res.json({ success: true, data });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function getMyLinks(req: Request, res: Response): Promise<void> {
  const links = await service.getMyLinks(req.user!.sub);
  res.json({ success: true, data: links });
}

export async function createLink(req: Request, res: Response): Promise<void> {
  const link = await service.createLink(req.user!.sub, req.body as Parameters<typeof service.createLink>[1]);
  res.status(201).json({ success: true, data: link });
}

export async function updateLink(req: Request, res: Response): Promise<void> {
  try {
    const link = await service.updateLink((req.params['id'] as string), req.user!.sub, req.body as Parameters<typeof service.updateLink>[2]);
    res.json({ success: true, data: link });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function deleteLink(req: Request, res: Response): Promise<void> {
  try {
    await service.deleteLink((req.params['id'] as string), req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function reorderLinks(req: Request, res: Response): Promise<void> {
  await service.reorderLinks(req.user!.sub, (req.body as { orderedIds: string[] }).orderedIds);
  res.json({ success: true, data: null });
}
