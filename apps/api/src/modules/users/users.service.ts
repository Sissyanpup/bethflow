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
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.bio !== undefined && { bio: sanitizeHtml(data.bio, { allowedTags: [], allowedAttributes: {} }) }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
  });
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

export async function exportUserData(userId: string) {
  const [user, boards, projects, catalogs, socialLinks] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.board.findMany({
      where: { ownerId: userId },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                catalog: { select: { title: true } },
                linkedTask: { select: { status: true } },
                checklist: { orderBy: { position: 'asc' }, select: { text: true, isChecked: true, createdAt: true } },
              },
            },
          },
        },
      },
    }),
    prisma.project.findMany({
      where: { ownerId: userId },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            linkedCard: {
              select: {
                title: true,
                list: { select: { title: true, board: { select: { title: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.catalog.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'asc' } }),
    prisma.socialLink.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
  ]);

  const d = (dt: Date | null | undefined) => dt?.toISOString() ?? null;

  return {
    profile: {
      id: user.id, email: user.email, username: user.username,
      displayName: user.displayName, avatarUrl: user.avatarUrl, bio: user.bio,
      role: user.role, createdAt: d(user.createdAt),
    },
    boards: boards.map((b) => ({
      id: b.id, title: b.title, description: b.description, color: b.color, isPublic: b.isPublic,
      createdAt: d(b.createdAt), updatedAt: d(b.updatedAt),
      lists: b.lists.map((l) => ({
        id: l.id, title: l.title, position: l.position, isArchived: l.isArchived,
        cards: l.cards.map((c) => ({
          id: c.id, title: c.title, description: c.description, color: c.color,
          isArchived: c.isArchived, mediaUrl: c.mediaUrl,
          catalogName: c.catalog?.title ?? null,
          taskStatus: c.linkedTask?.status ?? null,
          startDate: d(c.startDate), endDate: d(c.endDate),
          createdAt: d(c.createdAt), updatedAt: d(c.updatedAt),
          checklist: c.checklist.map((ci) => ({
            text: ci.text, isChecked: ci.isChecked, createdAt: d(ci.createdAt),
          })),
        })),
      })),
    })),
    projects: projects.map((p) => ({
      id: p.id, title: p.title, description: p.description,
      createdAt: d(p.createdAt), updatedAt: d(p.updatedAt),
      tasks: p.tasks.map((t) => ({
        id: t.id, title: t.title, description: t.description, status: t.status,
        startDate: d(t.startDate), endDate: d(t.endDate),
        createdAt: d(t.createdAt), updatedAt: d(t.updatedAt),
        linkedCard: t.linkedCard ? {
          title: t.linkedCard.title,
          listTitle: t.linkedCard.list.title,
          boardTitle: t.linkedCard.list.board.title,
        } : null,
      })),
    })),
    catalogs: catalogs.map((c) => ({
      id: c.id, title: c.title, content: c.content, mediaUrl: c.mediaUrl, group: c.group,
      startDate: d(c.startDate), endDate: d(c.endDate),
      createdAt: d(c.createdAt), updatedAt: d(c.updatedAt),
    })),
    socialLinks: socialLinks.map((l) => ({
      platform: l.platform, label: l.label, url: l.url, isVisible: l.isVisible,
    })),
    exportedAt: new Date().toISOString(),
  };
}

export async function deleteUserAccount(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId } }),
    prisma.botToken.deleteMany({ where: { userId } }),
    prisma.otpToken.deleteMany({ where: { email: user.email } }),
    prisma.user.update({ where: { id: userId }, data: { isActive: false } }),
  ]);
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
