import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateProjectSchema, UpdateProjectSchema, CreateTaskSchema } from '@bethflow/shared';
import * as ctrl from './projects.controller.js';

export const projectsRouter = Router();

projectsRouter.get('/', ctrl.listProjects);
projectsRouter.post('/', validate(CreateProjectSchema), ctrl.createProject);
projectsRouter.get('/:id', ctrl.getProject);
projectsRouter.patch('/:id', validate(UpdateProjectSchema), ctrl.updateProject);
projectsRouter.delete('/:id', ctrl.deleteProject);
projectsRouter.post('/:id/tasks', validate(CreateTaskSchema), ctrl.createTask);
