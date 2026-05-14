import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { UpdateListSchema } from '@bethflow/shared';
import * as ctrl from './lists.controller.js';

export const listsRouter = Router();

listsRouter.patch('/:id', validate(UpdateListSchema), ctrl.updateList);
listsRouter.delete('/:id', ctrl.deleteList);
