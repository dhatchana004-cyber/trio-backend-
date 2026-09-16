import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/org.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateOrgSchema } from '../schemas/org.schema';

const router = Router();

router.use(authenticateJWT);
router.use(requireRole(['ADMIN', 'MANAGER']));

router.get('/settings', getSettings);
router.patch('/settings', validate(updateOrgSchema), updateSettings);

export default router;
