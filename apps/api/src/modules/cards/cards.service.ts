import { prisma } from '../../lib/prisma.js';
import { emitBoardEvent } from '../../lib/socket.js';
import type {
  CreateCardInput, UpdateCardInput, ReorderCardsInput,
  CreateChecklistItemInput, UpdateChecklistItemInput, CreateCardCommentInput,
} from '@bethflow/shared';

async function getBoardIdForList(listId: string): Promise<string> {
  const list = await prisma.list.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw Object.assign(new Error('List not found'), { code: 'NOT_FOUND' });
  return list.boardId;
}

async function assertCardOwner(cardId: string, userId: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { list: { include: { board: true } } } });
  if (!card) throw Object.assign(new Error('Card not found'), { code: 'NOT_FOUND' });
  if (card.list.board.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  return card;
}

export async function getCardDetail(id: string, userId: string) {
  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      list: { include: { board: true } },
      catalog: { select: { id: true, title: true } },
      checklist: { orderBy: { position: 'asc' } },
      comments: {
        include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!card) throw Object.assign(new Error('Card not found'), { code: 'NOT_FOUND' });
  if (card.list.board.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  return {
    ...card,
    startDate: card.startDate?.toISOString() ?? null,
    endDate: card.endDate?.toISOString() ?? null,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    comments: card.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    checklist: card.checklist.map((ci) => ({
      ...ci,
      createdAt: ci.createdAt.toISOString(),
    })),
  };
}

export async function createCard(listId: string, userId: string, data: CreateCardInput) {
  const list = await prisma.list.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw Object.assign(new Error('List not found'), { code: 'NOT_FOUND' });
  if (list.board.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

  const maxPos = await prisma.card.aggregate({ where: { listId }, _max: { position: true } });
  const position = (maxPos._max.position ?? -1) + 1;

  const card = await prisma.card.create({
    data: {
      ...data,
      listId,
      position,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  emitBoardEvent(list.boardId, 'card:created', card);
  return card;
}

export async function updateCard(id: string, userId: string, data: UpdateCardInput) {
  await assertCardOwner(id, userId);
  const card = await prisma.card.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
    },
  });

  const boardId = await getBoardIdForList(card.listId);
  emitBoardEvent(boardId, 'card:updated', card);
  return card;
}

export async function deleteCard(id: string, userId: string) {
  const card = await assertCardOwner(id, userId);
  const boardId = card.list.boardId;
  await prisma.card.delete({ where: { id } });
  emitBoardEvent(boardId, 'card:deleted', { id });
}

export async function reorderCard(userId: string, input: ReorderCardsInput) {
  const { cardId, sourceListId, destinationListId, newPosition } = input;

  const sourceList = await prisma.list.findUnique({ where: { id: sourceListId }, include: { board: true } });
  if (!sourceList || sourceList.board.ownerId !== userId) {
    throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.card.updateMany({
      where: { listId: destinationListId, position: { gte: newPosition }, id: { not: cardId } },
      data: { position: { increment: 1 } },
    });
    await tx.card.update({
      where: { id: cardId },
      data: { listId: destinationListId, position: newPosition },
    });
    if (sourceListId !== destinationListId) {
      const remaining = await tx.card.findMany({ where: { listId: sourceListId }, orderBy: { position: 'asc' } });
      await Promise.all(remaining.map((c, i) => tx.card.update({ where: { id: c.id }, data: { position: i } })));
    }
  });

  emitBoardEvent(sourceList.boardId, 'card:moved', { cardId, sourceListId, destinationListId, newPosition });
}

// Checklist
export async function createChecklistItem(cardId: string, userId: string, data: CreateChecklistItemInput) {
  await assertCardOwner(cardId, userId);
  const maxPos = await prisma.checklistItem.aggregate({ where: { cardId }, _max: { position: true } });
  const position = (maxPos._max.position ?? -1) + 1;
  const item = await prisma.checklistItem.create({ data: { cardId, text: data.text, position } });
  return { ...item, createdAt: item.createdAt.toISOString() };
}

export async function updateChecklistItem(cardId: string, itemId: string, userId: string, data: UpdateChecklistItemInput) {
  await assertCardOwner(cardId, userId);
  const item = await prisma.checklistItem.update({ where: { id: itemId }, data });
  return { ...item, createdAt: item.createdAt.toISOString() };
}

export async function deleteChecklistItem(cardId: string, itemId: string, userId: string) {
  await assertCardOwner(cardId, userId);
  await prisma.checklistItem.delete({ where: { id: itemId, cardId } });
}

// Comments
export async function createComment(cardId: string, userId: string, data: CreateCardCommentInput) {
  await assertCardOwner(cardId, userId);
  const comment = await prisma.cardComment.create({
    data: { cardId, userId, content: data.content },
    include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
  });
  return { ...comment, createdAt: comment.createdAt.toISOString(), updatedAt: comment.updatedAt.toISOString() };
}

export async function deleteComment(cardId: string, commentId: string, userId: string) {
  const comment = await prisma.cardComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.cardId !== cardId) throw Object.assign(new Error('Comment not found'), { code: 'NOT_FOUND' });
  if (comment.userId !== userId) {
    // Card owner can also delete any comment
    const card = await prisma.card.findUnique({ where: { id: cardId }, include: { list: { include: { board: true } } } });
    if (card?.list.board.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  }
  await prisma.cardComment.delete({ where: { id: commentId } });
}
