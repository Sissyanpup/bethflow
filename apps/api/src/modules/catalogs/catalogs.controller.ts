import type { Request, Response } from 'express';
import * as catalogsService from './catalogs.service.js';

function handleServiceError(err: unknown, res: Response): boolean {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } }); return true; }
  if (e.code === 'FORBIDDEN') { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: e.message } }); return true; }
  return false;
}

export async function listCatalogs(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10));
  const { catalogs, total } = await catalogsService.listCatalogs(req.user!.sub, page, limit);
  res.json({ success: true, data: catalogs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getCatalog(req: Request, res: Response): Promise<void> {
  try {
    const catalog = await catalogsService.getCatalog((req.params['id'] as string), req.user!.sub);
    res.json({ success: true, data: catalog });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function createCatalog(req: Request, res: Response): Promise<void> {
  const catalog = await catalogsService.createCatalog(req.user!.sub, req.body as Parameters<typeof catalogsService.createCatalog>[1]);
  res.status(201).json({ success: true, data: catalog });
}

export async function updateCatalog(req: Request, res: Response): Promise<void> {
  try {
    const catalog = await catalogsService.updateCatalog((req.params['id'] as string), req.user!.sub, req.body as Parameters<typeof catalogsService.updateCatalog>[2]);
    res.json({ success: true, data: catalog });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function deleteCatalog(req: Request, res: Response): Promise<void> {
  try {
    await catalogsService.deleteCatalog((req.params['id'] as string), req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}
