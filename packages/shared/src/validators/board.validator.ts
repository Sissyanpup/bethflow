import { z } from 'zod';

export const CreateBoardSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const UpdateBoardSchema = CreateBoardSchema.partial().extend({
  isPublic: z.boolean().optional(),
  description: z.string().max(500).nullish(),
});

export const CreateListSchema = z.object({
  title: z.string().min(1).max(100),
});

export const UpdateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
});

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type CreateListInput = z.infer<typeof CreateListSchema>;
export type UpdateListInput = z.infer<typeof UpdateListSchema>;
