import { Router, type Request, type Response } from 'express';
import { getPublicBoards } from './boards.service.js';

export const publicBoardsRouter = Router();

publicBoardsRouter.get('/:username/boards', async (req: Request, res: Response) => {
  try {
    const boards = await getPublicBoards(req.params.username!);
    res.json({ success: true, data: boards });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'NOT_FOUND') return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Server error' } });
  }
});
