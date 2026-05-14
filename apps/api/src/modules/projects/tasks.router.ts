import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { UpdateTaskSchema } from '@bethflow/shared';
import * as ctrl from './tasks.controller.js';

export const tasksRouter = Router();

tasksRouter.patch('/:id', validate(UpdateTaskSchema), ctrl.updateTask);
tasksRouter.delete('/:id', ctrl.deleteTask);
