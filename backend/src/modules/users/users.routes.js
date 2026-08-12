import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema, getUserByIdSchema } from './users.schema.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', usersController.list);
router.post('/', validate(createUserSchema), usersController.create);
router.get('/:id', validate(getUserByIdSchema), usersController.get);
router.put('/:id', validate(updateUserSchema), usersController.update);
router.delete('/:id', validate(getUserByIdSchema), usersController.delete);

export default router;
