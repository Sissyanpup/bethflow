import type { Request, Response } from 'express';
import * as cardsService from './cards.service.js';

function handleServiceError(err: unknown, res: Response): boolean {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } }); return true; }
  if (e.code === 'FORBIDDEN') { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: e.message } }); return true; }
  return false;
}

export async function getCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.getCardDetail(req.params['id']!, req.user!.sub);
    res.json({ success: true, data: card });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function createCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.createCard(req.params['listId']!, req.user!.sub, req.body as Parameters<typeof cardsService.createCard>[2]);
    res.status(201).json({ success: true, data: card });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function updateCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.updateCard(req.params['id']!, req.user!.sub, req.body as Parameters<typeof cardsService.updateCard>[2]);
    res.json({ success: true, data: card });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function deleteCard(req: Request, res: Response): Promise<void> {
  try {
    await cardsService.deleteCard(req.params['id']!, req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function reorderCard(req: Request, res: Response): Promise<void> {
  try {
    await cardsService.reorderCard(req.user!.sub, req.body as Parameters<typeof cardsService.reorderCard>[1]);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

// Checklist
export async function addChecklistItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await cardsService.createChecklistItem(req.params['id']!, req.user!.sub, req.body as { text: string });
    res.status(201).json({ success: true, data: item });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function updateChecklistItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await cardsService.updateChecklistItem(req.params['id']!, req.params['itemId']!, req.user!.sub, req.body as { text?: string; isChecked?: boolean });
    res.json({ success: true, data: item });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function deleteChecklistItem(req: Request, res: Response): Promise<void> {
  try {
    await cardsService.deleteChecklistItem(req.params['id']!, req.params['itemId']!, req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

// Comments
export async function addComment(req: Request, res: Response): Promise<void> {
  try {
    const comment = await cardsService.createComment(req.params['id']!, req.user!.sub, req.body as { content: string });
    res.status(201).json({ success: true, data: comment });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  try {
    await cardsService.deleteComment(req.params['id']!, req.params['commentId']!, req.user!.sub);
    res.json({ success: true, data: null });
  } catch (err) { if (!handleServiceError(err, res)) throw err; }
}
