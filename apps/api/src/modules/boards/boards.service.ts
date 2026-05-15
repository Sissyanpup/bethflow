import { prisma } from '../../lib/prisma.js';
import type { CreateBoardInput, UpdateBoardInput, CreateListInput, UpdateListInput } from '@bethflow/shared';

export async function listBoards(userId: string, page: number, limit: number) {
  const where = { ownerId: userId };
  const [boards, total] = await Promise.all([
    prisma.board.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.board.count({ where }),
  ]);
  return { boards: boards.map(serializeBoard), total };
}

export async function getBoard(id: string, userId: string) {
  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      lists: {
        where: { isArchived: false },
        orderBy: { position: 'asc' },
        include: {
          cards: {
            where: { isArchived: false },
            orderBy: { position: 'asc' },
            include: { linkedTask: { select: { status: true } } },
          },
        },
      },
    },
  });
  if (!board) throw Object.assign(new Error('Board not found'), { code: 'NOT_FOUND' });
  if (board.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  return {
    ...board,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    lists: board.lists.map((list) => ({
      ...list,
      cards: list.cards.map((card) => ({
        ...card,
        taskId: card.taskId ?? null,
        taskStatus: card.linkedTask?.status ?? null,
        startDate: card.startDate?.toISOString() ?? null,
        endDate: card.endDate?.toISOString() ?? null,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      })),
    })),
  };
}

export async function createBoard(ownerId: string, data: CreateBoardInput) {
  const board = await prisma.board.create({
    data: {
      title: data.title,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color !== undefined && { color: data.color }),
      ownerId,
    },
  });
  return serializeBoard(board);
}

export async function updateBoard(id: string, userId: string, data: UpdateBoardInput) {
  await assertOwner(id, userId);
  const board = await prisma.board.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });
  return serializeBoard(board);
}

export async function deleteBoard(id: string, userId: string) {
  await assertOwner(id, userId);
  await prisma.board.delete({ where: { id } });
}

// Lists
export async function createList(boardId: string, userId: string, data: CreateListInput) {
  await assertOwner(boardId, userId);
  const maxPos = await prisma.list.aggregate({ where: { boardId }, _max: { position: true } });
  const position = (maxPos._max.position ?? -1) + 1;
  return prisma.list.create({ data: { ...data, boardId, position } });
}

export async function updateList(id: string, userId: string, data: UpdateListInput) {
  await assertListOwner(id, userId);
  return prisma.list.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
    },
  });
}

export async function deleteList(id: string, userId: string) {
  await assertListOwner(id, userId);
  await prisma.list.delete({ where: { id } });
}

async function assertOwner(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw Object.assign(new Error('Board not found'), { code: 'NOT_FOUND' });
  if (board.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
}

async function assertListOwner(listId: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw Object.assign(new Error('List not found'), { code: 'NOT_FOUND' });
  if (list.board.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
}

export async function getPublicBoards(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  const boards = await prisma.board.findMany({
    where: { ownerId: user.id, isPublic: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      lists: {
        where: { isArchived: false },
        orderBy: { position: 'asc' },
        include: { cards: { where: { isArchived: false }, orderBy: { position: 'asc' }, select: { id: true, title: true, description: true, color: true, position: true } } },
      },
    },
  });
  return boards.map((b) => ({ ...serializeBoard(b), lists: b.lists }));
}

function serializeBoard(b: { id: string; title: string; description: string | null; color: string | null; isPublic: boolean; ownerId: string; createdAt: Date; updatedAt: Date }) {
  return { ...b, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString() };
}
