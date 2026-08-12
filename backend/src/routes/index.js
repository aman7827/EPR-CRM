import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import customersRoutes from '../modules/customers/customers.routes.js';
import productsRoutes from '../modules/products/products.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/customers', customersRoutes);
router.use('/products', productsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
