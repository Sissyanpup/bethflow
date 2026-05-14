import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import {
  CreateCardSchema, UpdateCardSchema, ReorderCardsSchema,
  CreateChecklistItemSchema, UpdateChecklistItemSchema, CreateCardCommentSchema,
} from '@bethflow/shared';
import * as ctrl from './cards.controller.js';

export const cardsRouter = Router();

cardsRouter.post('/list/:listId', validate(CreateCardSchema), ctrl.createCard);
cardsRouter.get('/:id', ctrl.getCard);
cardsRouter.patch('/:id', validate(UpdateCardSchema), ctrl.updateCard);
cardsRouter.delete('/:id', ctrl.deleteCard);
cardsRouter.post('/reorder', validate(ReorderCardsSchema), ctrl.reorderCard);

// Checklist
cardsRouter.post('/:id/checklist', validate(CreateChecklistItemSchema), ctrl.addChecklistItem);
cardsRouter.patch('/:id/checklist/:itemId', validate(UpdateChecklistItemSchema), ctrl.updateChecklistItem);
cardsRouter.delete('/:id/checklist/:itemId', ctrl.deleteChecklistItem);

// Comments
cardsRouter.post('/:id/comments', validate(CreateCardCommentSchema), ctrl.addComment);
cardsRouter.delete('/:id/comments/:commentId', ctrl.deleteComment);
