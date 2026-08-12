import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  inventoryAdjustSchema,
  getInventoryByProductSchema,
} from './inventory.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), inventoryController.list);
router.get('/movements', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), inventoryController.movements);
router.get('/:productId', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), validate(getInventoryByProductSchema), inventoryController.getByProduct);
router.post('/adjust', authorize('ADMIN', 'WAREHOUSE'), validate(inventoryAdjustSchema), inventoryController.adjust);

export default router;
