import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateCatalogSchema, UpdateCatalogSchema } from '@bethflow/shared';
import * as ctrl from './catalogs.controller.js';

export const catalogsRouter = Router();

catalogsRouter.get('/', ctrl.listCatalogs);
catalogsRouter.post('/', validate(CreateCatalogSchema), ctrl.createCatalog);
catalogsRouter.get('/:id', ctrl.getCatalog);
catalogsRouter.patch('/:id', validate(UpdateCatalogSchema), ctrl.updateCatalog);
catalogsRouter.delete('/:id', ctrl.deleteCatalog);
