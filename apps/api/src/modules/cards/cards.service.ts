import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../lib/prisma.js';
import { emitBoardEvent } from '../../lib/socket.js';
import type {
  CreateCardInput, UpdateCardInput, ReorderCardsInput,
  CreateChecklistItemInput, UpdateChecklistItemInput, CreateCardCommentInput,
} from '@bethflow/shared';

import type { IOptions } from 'sanitize-html';
const PLAIN_TEXT: IOptions = { allowedTags: [], allowedAttributes: {} };
const strip = (s: string) => sanitizeHtml(s, PLAIN_TEXT);

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
      linkedTask: { select: { id: true, status: true, projectId: true } },
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
    taskId: card.taskId ?? null,
    taskStatus: card.linkedTask?.status ?? null,
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
      title: strip(data.title),
      ...(data.description !== undefined && { description: strip(data.description) }),
      ...(data.mediaUrl !== undefined && { mediaUrl: data.mediaUrl }),
      ...(data.catalogId !== undefined && { catalogId: data.catalogId }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      listId,
      position,
    },
  });

  emitBoardEvent(list.boardId, 'card:created', card);
  return card;
}

export async function updateCard(id: string, userId: string, data: UpdateCardInput) {
  const existing = await assertCardOwner(id, userId);
  const card = await prisma.card.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: strip(data.title) }),
      ...(data.description !== undefined && { description: data.description ? strip(data.description) : null }),
      ...(data.mediaUrl !== undefined && { mediaUrl: data.mediaUrl }),
      ...(data.catalogId !== undefined && { catalogId: data.catalogId }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.listId !== undefined && { listId: data.listId }),
      ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
      ...(data.color !== undefined && { color: data.color }),
    },
    include: { list: true, linkedTask: { select: { id: true, status: true } } },
  });

  // Auto-link to timeline when both dates are set
  const newStart = card.startDate ?? null;
  const newEnd = card.endDate ?? null;
  if (newStart && newEnd) {
    await autoLinkToTimeline(card as typeof card & { list: { title: string }; taskId: string | null }, userId, newStart, newEnd);
  }

  const boardId = existing.list.boardId;
  emitBoardEvent(boardId, 'card:updated', { ...card, taskStatus: card.linkedTask?.status ?? null });
  return card;
}

async function autoLinkToTimeline(
  card: { id: string; title: string; taskId: string | null; list: { title: string } },
  userId: string,
  startDate: Date,
  endDate: Date,
) {
  const projectTitle = card.list.title;

  if (card.taskId) {
    // Task already linked — update dates and relocate to correct project if list changed
    const existingTask = await prisma.task.findUnique({
      where: { id: card.taskId },
      include: { project: { select: { title: true } } },
    });
    const updateData: Parameters<typeof prisma.task.update>[0]['data'] = { startDate, endDate };

    if (existingTask && existingTask.project.title !== projectTitle) {
      let destProject = await prisma.project.findFirst({ where: { ownerId: userId, title: projectTitle } });
      if (!destProject) {
        destProject = await prisma.project.create({ data: { title: projectTitle, ownerId: userId } });
      }
      const maxPos = await prisma.task.aggregate({ where: { projectId: destProject.id }, _max: { position: true } });
      updateData.projectId = destProject.id;
      updateData.position = (maxPos._max.position ?? -1) + 1;
    }

    await prisma.task.update({ where: { id: card.taskId }, data: updateData });
    return;
  }

  // No task yet — find or create project named after the list, then create task
  let project = await prisma.project.findFirst({ where: { ownerId: userId, title: projectTitle } });
  if (!project) {
    project = await prisma.project.create({ data: { title: projectTitle, ownerId: userId } });
  }

  const maxPos = await prisma.task.aggregate({ where: { projectId: project.id }, _max: { position: true } });
  const task = await prisma.task.create({
    data: {
      title: card.title,
      startDate,
      endDate,
      status: 'TODO',
      position: (maxPos._max.position ?? -1) + 1,
      projectId: project.id,
    },
  });
  await prisma.card.update({ where: { id: card.id }, data: { taskId: task.id } });
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

  // When card crosses lists, relocate its linked task to the destination list's project
  if (sourceListId !== destinationListId) {
    const card = await prisma.card.findUnique({ where: { id: cardId }, select: { taskId: true } });
    if (card?.taskId) {
      const destList = await prisma.list.findUnique({ where: { id: destinationListId }, select: { title: true } });
      if (destList) {
        let destProject = await prisma.project.findFirst({ where: { ownerId: userId, title: destList.title } });
        if (!destProject) {
          destProject = await prisma.project.create({ data: { title: destList.title, ownerId: userId } });
        }
        const maxPos = await prisma.task.aggregate({ where: { projectId: destProject.id }, _max: { position: true } });
        await prisma.task.update({
          where: { id: card.taskId },
          data: { projectId: destProject.id, position: (maxPos._max.position ?? -1) + 1 },
        });
      }
    }
  }

  emitBoardEvent(sourceList.boardId, 'card:moved', { cardId, sourceListId, destinationListId, newPosition });
}

// Checklist
export async function createChecklistItem(cardId: string, userId: string, data: CreateChecklistItemInput) {
  await assertCardOwner(cardId, userId);
  const maxPos = await prisma.checklistItem.aggregate({ where: { cardId }, _max: { position: true } });
  const position = (maxPos._max.position ?? -1) + 1;
  const item = await prisma.checklistItem.create({ data: { cardId, text: strip(data.text), position } });
  return { ...item, createdAt: item.createdAt.toISOString() };
}

export async function updateChecklistItem(cardId: string, itemId: string, userId: string, data: UpdateChecklistItemInput) {
  await assertCardOwner(cardId, userId);
  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(data.text !== undefined && { text: strip(data.text) }),
      ...(data.isChecked !== undefined && { isChecked: data.isChecked }),
    },
  });
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
    data: { cardId, userId, content: strip(data.content) },
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
