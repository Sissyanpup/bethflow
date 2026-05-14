import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateSocialLinkSchema, UpdateSocialLinkSchema, ReorderSocialLinksSchema } from '@bethflow/shared';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './social-links.controller.js';

export const socialLinksRouter = Router();

// Authenticated routes (mounted at /api/me/social-links)
socialLinksRouter.get('/', ctrl.getMyLinks);
socialLinksRouter.post('/', validate(CreateSocialLinkSchema), ctrl.createLink);
socialLinksRouter.patch('/:id', validate(UpdateSocialLinkSchema), ctrl.updateLink);
socialLinksRouter.delete('/:id', ctrl.deleteLink);
socialLinksRouter.post('/reorder', validate(ReorderSocialLinksSchema), ctrl.reorderLinks);

// Public route (mounted separately at /api/social-links/:username)
export const publicSocialLinksRouter = Router();
publicSocialLinksRouter.get('/:username', ctrl.getPublicLinks);
