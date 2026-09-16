import { Router } from 'express';
import { getAttendanceSummary, getOvertime, exportReport } from '../controllers/report.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);
router.use(requireRole(['ADMIN', 'MANAGER']));

router.get('/attendance-summary', getAttendanceSummary);
router.get('/overtime', getOvertime);
router.get('/export', exportReport);

export default router;
