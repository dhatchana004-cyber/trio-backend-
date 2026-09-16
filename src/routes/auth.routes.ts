import { Router } from 'express';
import { signup, login, refresh } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { signupSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);

export default router;
