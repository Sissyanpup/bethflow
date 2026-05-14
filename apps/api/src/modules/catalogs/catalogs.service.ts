import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../lib/prisma.js';
import type { CreateCatalogInput, UpdateCatalogInput } from '@bethflow/shared';

export async function listCatalogs(ownerId: string, page: number, limit: number) {
  const where = { ownerId };
  const [catalogs, total] = await Promise.all([
    prisma.catalog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.catalog.count({ where }),
  ]);
  return { catalogs: catalogs.map(serialize), total };
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
      ...data,
      ownerId,
      content: data.content ? sanitizeHtml(data.content) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  return serialize(catalog);
}

export async function updateCatalog(id: string, ownerId: string, data: UpdateCatalogInput) {
  await assertOwner(id, ownerId);
  const catalog = await prisma.catalog.update({
    where: { id },
    data: {
      ...data,
      content: data.content ? sanitizeHtml(data.content) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
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

function serialize(c: { id: string; title: string; content: string | null; mediaUrl: string | null; startDate: Date | null; endDate: Date | null; ownerId: string; createdAt: Date; updatedAt: Date }) {
  return { ...c, startDate: c.startDate?.toISOString() ?? null, endDate: c.endDate?.toISOString() ?? null, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
}
