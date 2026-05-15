import { prisma } from '../../lib/prisma.js';
import type { CreateProjectInput, UpdateProjectInput, CreateTaskInput, UpdateTaskInput } from '@bethflow/shared';

export async function listProjects(ownerId: string, page: number, limit: number) {
  const where = { ownerId };
  const [projects, total] = await Promise.all([
    prisma.project.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.project.count({ where }),
  ]);
  return { projects: projects.map(serializeProject), total };
}

export async function getProject(id: string, ownerId: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { position: 'asc' } } },
  });
  if (!project) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });
  if (project.ownerId !== ownerId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  return project;
}

export async function createProject(ownerId: string, data: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      title: data.title,
      ...(data.description !== undefined && { description: data.description }),
      ownerId,
    },
  });
  return serializeProject(project);
}

export async function updateProject(id: string, ownerId: string, data: UpdateProjectInput) {
  await assertOwner(id, ownerId);
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
  return serializeProject(project);
}

export async function deleteProject(id: string, ownerId: string) {
  await assertOwner(id, ownerId);
  await prisma.project.delete({ where: { id } });
}

// Tasks
export async function createTask(projectId: string, ownerId: string, data: CreateTaskInput) {
  await assertOwner(projectId, ownerId);
  const maxPos = await prisma.task.aggregate({ where: { projectId }, _max: { position: true } });
  const position = (maxPos._max.position ?? -1) + 1;
  return prisma.task.create({
    data: {
      title: data.title,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      projectId,
      position,
    },
  });
}

export async function updateTask(id: string, ownerId: string, data: UpdateTaskInput) {
  await assertTaskOwner(id, ownerId);
  return prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
    },
  });
}

export async function deleteTask(id: string, ownerId: string) {
  await assertTaskOwner(id, ownerId);
  await prisma.task.delete({ where: { id } });
}

async function assertOwner(projectId: string, ownerId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });
  if (project.ownerId !== ownerId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
}

async function assertTaskOwner(taskId: string, ownerId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) throw Object.assign(new Error('Task not found'), { code: 'NOT_FOUND' });
  if (task.project.ownerId !== ownerId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
}

function serializeProject(p: { id: string; title: string; description: string | null; ownerId: string; createdAt: Date; updatedAt: Date }) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}
