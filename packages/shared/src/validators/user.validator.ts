import { z } from 'zod';

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
