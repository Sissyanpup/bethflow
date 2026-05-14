import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { AdminCreateUserSchema, AdminUpdateUserSchema } from '@bethflow/shared';
import { requireAdmin } from '../../middleware/rbac.middleware.js';
import * as ctrl from './admin.controller.js';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/users', ctrl.listUsers);
adminRouter.post('/users', validate(AdminCreateUserSchema), ctrl.createUser);
adminRouter.get('/stats', ctrl.getStats);
adminRouter.patch('/users/:id', validate(AdminUpdateUserSchema), ctrl.updateUser);
adminRouter.delete('/users/:id', ctrl.softDeleteUser);
