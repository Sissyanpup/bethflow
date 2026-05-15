import { z } from 'zod';

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().refine((val) => /^https?:\/\//i.test(val), { message: 'URL must use http or https' }).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
