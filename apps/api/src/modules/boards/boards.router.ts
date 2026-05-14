import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateBoardSchema, UpdateBoardSchema, CreateListSchema } from '@bethflow/shared';
import * as boardCtrl from './boards.controller.js';
import * as listCtrl from './lists.controller.js';

export const boardsRouter = Router();

boardsRouter.get('/', boardCtrl.listBoards);
boardsRouter.post('/', validate(CreateBoardSchema), boardCtrl.createBoard);
boardsRouter.get('/:id', boardCtrl.getBoard);
boardsRouter.patch('/:id', validate(UpdateBoardSchema), boardCtrl.updateBoard);
boardsRouter.delete('/:id', boardCtrl.deleteBoard);

// Lists nested under boards
boardsRouter.post('/:id/lists', validate(CreateListSchema), listCtrl.createList);
