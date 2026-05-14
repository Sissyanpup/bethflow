import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { UpdateUserSchema } from '@bethflow/shared';
import * as ctrl from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/me', ctrl.getMe);
usersRouter.patch('/me', validate(UpdateUserSchema), ctrl.updateMe);
usersRouter.get('/search', ctrl.searchUsers);
usersRouter.get('/:id', ctrl.getUserById);
