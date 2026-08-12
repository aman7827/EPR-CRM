import { Router } from 'express';
import { productsController } from './products.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
} from './products.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), productsController.list);
router.post('/', authorize('ADMIN', 'WAREHOUSE'), validate(createProductSchema), productsController.create);
router.get('/:id', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), validate(getProductByIdSchema), productsController.get);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), validate(updateProductSchema), productsController.update);
router.delete('/:id', authorize('ADMIN'), validate(getProductByIdSchema), productsController.delete);

export default router;
