import { prisma } from '../../lib/prisma.js';
import bcrypt from 'bcrypt';
import type { Role } from '@bethflow/shared';

export async function adminListUsers(page: number, limit: number, search?: string) {
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id, email: u.email, username: u.username, displayName: u.displayName,
      role: u.role, isActive: u.isActive, isVerified: u.isVerified,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
  };
}

export async function adminGetStats() {
  const [totalUsers, activeUsers, totalBoards, totalCards] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.board.count(),
    prisma.card.count(),
  ]);
  return { totalUsers, activeUsers, totalBoards, totalCards };
}

export async function adminUpdateUser(id: string, data: { role?: string; isActive?: boolean; isVerified?: boolean }) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.role !== undefined && { role: data.role as Role }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
    },
  });
  return { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive, isVerified: user.isVerified };
}

export async function adminSoftDeleteUser(id: string) {
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}

export async function adminCreateUser(data: { email: string; username: string; password: string; displayName?: string; role?: string }) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { username: data.username }] },
  });
  if (existing) throw Object.assign(new Error('Email or username already taken'), { code: 'CONFLICT' });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      role: (data.role as Role) ?? 'USER',
      displayName: data.displayName ?? null,
      isVerified: true,
    },
  });
  return {
    id: user.id, email: user.email, username: user.username,
    displayName: user.displayName, role: user.role,
    isActive: user.isActive, isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}
