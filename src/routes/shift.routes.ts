import { Router } from 'express';
import { createShift, getShifts, assignShift } from '../controllers/shift.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createShiftSchema, assignShiftSchema } from '../schemas/shift.schema';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireRole(['ADMIN', 'MANAGER']), validate(createShiftSchema), createShift);
router.get('/', getShifts);
router.post('/assign', requireRole(['ADMIN', 'MANAGER']), validate(assignShiftSchema), assignShift);

export default router;
