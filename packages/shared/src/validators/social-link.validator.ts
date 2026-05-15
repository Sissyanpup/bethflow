import { z } from 'zod';
import { SOCIAL_PLATFORMS } from '../types/social-platforms.js';

const platformKeys = Object.keys(SOCIAL_PLATFORMS) as [
  keyof typeof SOCIAL_PLATFORMS,
  ...Array<keyof typeof SOCIAL_PLATFORMS>,
];

export const CreateSocialLinkSchema = z.object({
  platform: z.enum(platformKeys),
  label: z.string().min(1).max(60),
  url: z.string().url().refine((val) => /^https?:\/\//i.test(val), { message: 'URL must use http or https' }),
  iconSlug: z.string().max(60).nullable().optional(),
  isVisible: z.boolean().optional(),
});

export const UpdateSocialLinkSchema = CreateSocialLinkSchema.partial();

export const ReorderSocialLinksSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});

export type CreateSocialLinkInput = z.infer<typeof CreateSocialLinkSchema>;
export type UpdateSocialLinkInput = z.infer<typeof UpdateSocialLinkSchema>;
export type ReorderSocialLinksInput = z.infer<typeof ReorderSocialLinksSchema>;
