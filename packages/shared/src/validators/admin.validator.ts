import { z } from 'zod';

export const AdminCreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  displayName: z.string().max(80).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export const AdminUpdateUserSchema = z.object({
  displayName: z.string().max(80).nullable().optional(),
  role: z.enum(['GUEST', 'USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export type AdminCreateUserInput = z.infer<typeof AdminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;
