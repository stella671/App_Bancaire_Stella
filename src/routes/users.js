import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import * as ctrl from '../controllers/userController.js';

const router = Router();

router.get('/', authenticate, adminOnly, ctrl.getAll);
router.post('/', authenticate, adminOnly, ctrl.create);
router.delete('/:id', authenticate, adminOnly, ctrl.remove);

export default router;
