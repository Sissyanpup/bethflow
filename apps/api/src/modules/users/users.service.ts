import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../lib/prisma.js';

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  return sanitizeUser(user);
}

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  return sanitizeUser(user);
}

export async function updateUser(
  id: string,
  data: { displayName?: string; bio?: string; avatarUrl?: string },
) {
  const sanitized = {
    displayName: data.displayName,
    bio: data.bio ? sanitizeHtml(data.bio, { allowedTags: [], allowedAttributes: {} }) : undefined,
    avatarUrl: data.avatarUrl,
  };
  const user = await prisma.user.update({ where: { id }, data: sanitized });
  return sanitizeUser(user);
}

export async function searchUsers(query: string, page: number, limit: number) {
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
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { users: users.map(sanitizeUser), total };
}

// Admin
export async function adminListUsers(page: number, limit: number) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { users: users.map(sanitizeUser), total };
}

export async function adminSoftDeleteUser(id: string) {
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}

function sanitizeUser(u: {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    role: u.role,
    isActive: u.isActive,
    isVerified: u.isVerified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}
