import { prisma } from '../../lib/prisma.js';
import type { CreateSocialLinkInput, UpdateSocialLinkInput } from '@bethflow/shared';

export async function getPublicLinks(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      socialLinks: { where: { isVisible: true }, orderBy: { position: 'asc' } },
      projects: { include: { tasks: { select: { status: true, endDate: true } } } },
    },
  });
  if (!user || !user.isActive) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });

  const allTasks = user.projects.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const onTimePercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return {
    user: { username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl, bio: user.bio },
    links: user.socialLinks,
    stats: { totalTasks, doneTasks, inProgressTasks, onTimePercent },
  };
}

export async function getMyLinks(userId: string) {
  return prisma.socialLink.findMany({ where: { userId }, orderBy: { position: 'asc' } });
}

export async function createLink(userId: string, data: CreateSocialLinkInput) {
  const maxPos = await prisma.socialLink.aggregate({ where: { userId }, _max: { position: true } });
  const position = (maxPos._max.position ?? -1) + 1;
  return prisma.socialLink.create({
    data: {
      platform: data.platform,
      label: data.label,
      url: data.url,
      ...(data.iconSlug !== undefined && { iconSlug: data.iconSlug }),
      ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
      userId,
      position,
    },
  });
}

export async function updateLink(id: string, userId: string, data: UpdateSocialLinkInput) {
  await assertOwner(id, userId);
  return prisma.socialLink.update({
    where: { id },
    data: {
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.label !== undefined && { label: data.label }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.iconSlug !== undefined && { iconSlug: data.iconSlug }),
      ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
    },
  });
}

export async function deleteLink(id: string, userId: string) {
  await assertOwner(id, userId);
  await prisma.socialLink.delete({ where: { id } });
}

export async function reorderLinks(userId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.socialLink.updateMany({ where: { id, userId }, data: { position } }),
    ),
  );
}

async function assertOwner(id: string, userId: string) {
  const link = await prisma.socialLink.findUnique({ where: { id } });
  if (!link) throw Object.assign(new Error('Social link not found'), { code: 'NOT_FOUND' });
  if (link.userId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
}
