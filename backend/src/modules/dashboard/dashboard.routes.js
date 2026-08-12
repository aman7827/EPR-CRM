import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'));

router.get('/summary', dashboardController.summary);
router.get('/low-stock', dashboardController.lowStock);

export default router;
