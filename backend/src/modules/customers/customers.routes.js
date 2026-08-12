import { Router } from 'express';
import { customersController } from './customers.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomerByIdSchema,
} from './customers.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), customersController.list);
router.post('/', authorize('ADMIN', 'SALES'), validate(createCustomerSchema), customersController.create);
router.get('/:id', authorize('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), validate(getCustomerByIdSchema), customersController.get);
router.put('/:id', authorize('ADMIN', 'SALES'), validate(updateCustomerSchema), customersController.update);
router.delete('/:id', authorize('ADMIN'), validate(getCustomerByIdSchema), customersController.delete);

export default router;
