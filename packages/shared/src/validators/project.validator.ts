import { z } from 'zod';

const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']);

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: TaskStatusEnum.optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  position: z.number().int().min(0).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
