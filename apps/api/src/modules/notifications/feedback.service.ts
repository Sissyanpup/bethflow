import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../lib/prisma.js';

export async function submitFeedback(content: string, userId?: string) {
  const clean = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
  return prisma.feedback.create({ data: { content: clean, userId: userId ?? null } });
}

export async function listFeedback(page: number, limit: number) {
  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, displayName: true } } },
    }),
    prisma.feedback.count(),
  ]);
  return { feedbacks, total };
}
