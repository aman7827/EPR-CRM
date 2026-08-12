import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { loginSchema, refreshSchema, logoutSchema } from './auth.schema.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
