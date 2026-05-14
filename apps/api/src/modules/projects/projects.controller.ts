import type { Request, Response } from 'express';
import * as projectsService from './projects.service.js';

function handleServiceError(err: unknown, res: Response): boolean {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } }); return true; }
  if (e.code === 'FORBIDDEN') { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: e.message } }); return true; }
  return false;
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10));
  const { projects, total } = await projectsService.listProjects(req.user!.sub, page, limit);
  res.json({ success: true, data: projects, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectsService.getProject(req.params['id']!, req.user!.sub);
    res.json({ success: true, data: project });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const project = await projectsService.createProject(req.user!.sub, req.body as { title: string; description?: string });
  res.status(201).json({ success: true, data: project });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectsService.updateProject(req.params['id']!, req.user!.sub, req.body as { title?: string; description?: string });
    res.json({ success: true, data: project });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    await projectsService.deleteProject(req.params['id']!, req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const task = await projectsService.createTask(req.params['id']!, req.user!.sub, req.body as Parameters<typeof projectsService.createTask>[2]);
    res.status(201).json({ success: true, data: task });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}
