import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const users = await prisma.user.findMany({
      where: { org_id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        employee_id: true,
        join_date: true,
        profile_photo_url: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' }
    });

    return res.status(200).json(successResponse(users));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json(errorResponse('Email already in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        org_id,
        name,
        email,
        password_hash: hashedPassword,
        role: role || 'EMPLOYEE',
      },
      select: { id: true, name: true, email: true, role: true, created_at: true }
    });

    return res.status(201).json(successResponse(user));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { id } = req.params as { id: string };
    const { name, role, department, employee_id, join_date, profile_photo_url } = req.body;

    if (req.user!.role === 'EMPLOYEE' && req.user!.id !== id) {
      return res.status(403).json(errorResponse('Forbidden: You can only update your own profile'));
    }

    const user = await prisma.user.findFirst({ where: { id, org_id } });
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, role, department, employee_id, join_date, profile_photo_url },
      select: { id: true, name: true, email: true, role: true, department: true, employee_id: true, join_date: true, profile_photo_url: true, created_at: true }
    });

    return res.status(200).json(successResponse(updatedUser));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { id } = req.params as { id: string };

    const user = await prisma.user.findFirst({ where: { id, org_id } });
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (user.id === req.user!.id) {
      return res.status(400).json(errorResponse('You cannot delete yourself'));
    }

    await prisma.user.delete({ where: { id } });

    return res.status(200).json(successResponse({ deletedId: id }));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;

    if (!req.file) {
      return res.status(400).json(errorResponse('No image uploaded'));
    }

    let profile_photo_url = (req.file as any).location;
    if (!profile_photo_url) {
      // Local storage: build URL from file path
      const filename = (req.file as any).filename;
      profile_photo_url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    }

    const user = await prisma.user.update({
      where: { id: user_id },
      data: { profile_photo_url },
      select: { id: true, name: true, email: true, profile_photo_url: true }
    });

    return res.status(200).json(successResponse(user));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};
