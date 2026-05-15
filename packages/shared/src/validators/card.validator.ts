import { z } from 'zod';

export const CreateCardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  mediaUrl: z.string().url().refine((val) => /^https?:\/\//i.test(val), { message: 'URL must use http or https' }).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  catalogId: z.string().cuid().optional(),
});

export const UpdateCardSchema = CreateCardSchema.partial().extend({
  position: z.number().int().min(0).optional(),
  listId: z.string().cuid().optional(),
  isArchived: z.boolean().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});

export const ReorderCardsSchema = z.object({
  cardId: z.string().cuid(),
  sourceListId: z.string().cuid(),
  destinationListId: z.string().cuid(),
  newPosition: z.number().int().min(0),
});

export const CreateChecklistItemSchema = z.object({
  text: z.string().min(1).max(500),
});

export const UpdateChecklistItemSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  isChecked: z.boolean().optional(),
});

export const CreateCardCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type ReorderCardsInput = z.infer<typeof ReorderCardsSchema>;
export type CreateChecklistItemInput = z.infer<typeof CreateChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof UpdateChecklistItemSchema>;
export type CreateCardCommentInput = z.infer<typeof CreateCardCommentSchema>;
