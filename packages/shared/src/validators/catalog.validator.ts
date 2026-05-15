import { z } from 'zod';

export const CreateCatalogSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(5000).optional(),
  mediaUrl: z.string().url().refine((val) => /^https?:\/\//i.test(val), { message: 'URL must use http or https' }).optional(),
  group: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const UpdateCatalogSchema = CreateCatalogSchema.partial();

export type CreateCatalogInput = z.infer<typeof CreateCatalogSchema>;
export type UpdateCatalogInput = z.infer<typeof UpdateCatalogSchema>;
