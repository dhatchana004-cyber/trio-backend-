import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, uploadProfilePhoto } from '../controllers/user.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createUserSchema, updateUserSchema, deleteUserSchema } from '../schemas/user.schema';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticateJWT);

router.get('/', getUsers);
router.post('/profile-photo', upload.single('photo'), uploadProfilePhoto);
router.post('/', requireRole(['ADMIN', 'MANAGER']), validate(createUserSchema), createUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', requireRole(['ADMIN', 'MANAGER']), validate(deleteUserSchema), deleteUser);

export default router;
