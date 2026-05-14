import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { authRateLimit } from '../../middleware/rate-limit.middleware.js';
import { LoginSchema, RegisterSchema } from '@bethflow/shared';
import * as ctrl from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, validate(RegisterSchema), ctrl.register);
authRouter.post('/login', authRateLimit, validate(LoginSchema), ctrl.login);
authRouter.post('/refresh', ctrl.refresh);
authRouter.post('/logout', ctrl.logout);
