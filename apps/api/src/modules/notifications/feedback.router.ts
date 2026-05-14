import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/rbac.middleware.js';
import * as service from './feedback.service.js';

export const feedbackRouter = Router();

const FeedbackSchema = z.object({ content: z.string().min(1).max(2000) });

// Public: submit feedback (no auth required, but userId attached if logged in)
feedbackRouter.post('/', optionalAuth, validate(FeedbackSchema), async (req, res) => {
  const feedback = await service.submitFeedback(
    (req.body as { content: string }).content,
    req.user?.sub,
  );
  res.status(201).json({ success: true, data: feedback });
});

// Admin only: list feedback
feedbackRouter.get('/', requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
  const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10));
  const { feedbacks, total } = await service.listFeedback(page, limit);
  res.json({ success: true, data: feedbacks, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
