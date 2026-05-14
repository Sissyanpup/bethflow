import { Router } from 'express';
import { searchUsers } from './public-users.controller.js';

export const publicUsersRouter = Router();

publicUsersRouter.get('/search', searchUsers);
