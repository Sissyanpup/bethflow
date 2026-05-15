import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../lib/prisma.js';
import type { CreateCatalogInput, UpdateCatalogInput } from '@bethflow/shared';

export async function listCatalogs(ownerId: string, page: number, limit: number) {
  const where = { ownerId };
  const [catalogs, total] = await Promise.all([
    prisma.catalog.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' },
      include: {
        cards: {
          where: { isArchived: false, taskId: { not: null } },
          include: { linkedTask: { select: { status: true } } },
        },
      },
    }),
    prisma.catalog.count({ where }),
  ]);
  return {
    catalogs: catalogs.map((c) => {
      const counts: Record<string, number> = {};
      for (const card of c.cards) {
        if (card.linkedTask) counts[card.linkedTask.status] = (counts[card.linkedTask.status] ?? 0) + 1;
      }
      return { ...serialize(c), taskStatusCounts: counts };
    }),
    total,
  };
}

export async function getCatalog(id: string, ownerId: string) {
  const catalog = await prisma.catalog.findUnique({ where: { id } });
  if (!catalog) throw Object.assign(new Error('Catalog not found'), { code: 'NOT_FOUND' });
  if (catalog.ownerId !== ownerId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  return serialize(catalog);
}

export async function createCatalog(ownerId: string, data: CreateCatalogInput) {
  const catalog = await prisma.catalog.create({
    data: {
      title: data.title,
      ...(data.content !== undefined && { content: sanitizeHtml(data.content) }),
      ...(data.mediaUrl !== undefined && { mediaUrl: data.mediaUrl }),
      ...(data.group !== undefined && { group: data.group }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ownerId,
    },
  });
  return serialize(catalog);
}

export async function updateCatalog(id: string, ownerId: string, data: UpdateCatalogInput) {
  await assertOwner(id, ownerId);
  const catalog = await prisma.catalog.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: sanitizeHtml(data.content) }),
      ...(data.mediaUrl !== undefined && { mediaUrl: data.mediaUrl }),
      ...(data.group !== undefined && { group: data.group }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
    },
  });
  return serialize(catalog);
}

export async function deleteCatalog(id: string, ownerId: string) {
  await assertOwner(id, ownerId);
  await prisma.catalog.delete({ where: { id } });
}

async function assertOwner(id: string, ownerId: string) {
  const catalog = await prisma.catalog.findUnique({ where: { id } });
  if (!catalog) throw Object.assign(new Error('Catalog not found'), { code: 'NOT_FOUND' });
  if (catalog.ownerId !== ownerId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
}

function serialize(c: { id: string; title: string; content: string | null; mediaUrl: string | null; group: string | null; startDate: Date | null; endDate: Date | null; ownerId: string; createdAt: Date; updatedAt: Date }) {
  return { ...c, startDate: c.startDate?.toISOString() ?? null, endDate: c.endDate?.toISOString() ?? null, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
}
