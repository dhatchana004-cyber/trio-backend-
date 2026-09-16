import { Router } from 'express';
import { applyLeave, approveLeave, rejectLeave, getLeaves } from '../controllers/leave.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { applyLeaveSchema } from '../schemas/leave.schema';

const router = Router();

router.use(authenticateJWT);

router.post('/apply', validate(applyLeaveSchema), applyLeave);
router.patch('/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveLeave);
router.patch('/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectLeave);
router.get('/', getLeaves);

export default router;
