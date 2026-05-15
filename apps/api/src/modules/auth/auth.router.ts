import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { authRateLimit, otpRateLimit } from '../../middleware/rate-limit.middleware.js';
import { LoginSchema, RegisterSchema, SendOtpSchema, VerifyOtpSchema } from '@bethflow/shared';
import * as ctrl from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, validate(RegisterSchema), ctrl.register);
authRouter.post('/login', authRateLimit, validate(LoginSchema), ctrl.login);
authRouter.post('/refresh', ctrl.refresh);
authRouter.post('/logout', ctrl.logout);
authRouter.post('/send-otp', authRateLimit, validate(SendOtpSchema), ctrl.sendOtp);
authRouter.post('/verify-otp', otpRateLimit, validate(VerifyOtpSchema), ctrl.verifyOtp);
