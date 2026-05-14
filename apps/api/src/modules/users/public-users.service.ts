import { prisma } from '../../lib/prisma.js';

export async function searchPublicUsers(query: string, page: number, limit: number) {
  const where = {
    isActive: true,
    OR: [
      { username: { contains: query, mode: 'insensitive' as const } },
      { displayName: { contains: query, mode: 'insensitive' as const } },
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: { select: { projects: true, boards: true } },
      },
      orderBy: { username: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      createdAt: u.createdAt.toISOString(),
      projectCount: u._count.projects,
      boardCount: u._count.boards,
    })),
    total,
  };
}
