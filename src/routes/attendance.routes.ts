import { Router } from 'express';
import { clockIn, clockOut, getAttendance, getTodayStats, getWeeklyStats, startBreak, endBreak } from '../controllers/attendance.controller';
import { authenticateJWT } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { clockInSchema, clockOutSchema } from '../schemas/attendance.schema';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticateJWT);

router.post('/clock-in', upload.single('selfie'), validate(clockInSchema), clockIn);
router.post('/clock-out', upload.single('selfie'), validate(clockOutSchema), clockOut);
router.post('/start-break', startBreak);
router.post('/end-break', endBreak);
router.get('/today-stats', getTodayStats);
router.get('/weekly-stats', getWeeklyStats);
router.get('/:userId', getAttendance);

export default router;


