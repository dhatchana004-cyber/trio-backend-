import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/response';

const generateTokens = (user: { id: string; org_id: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, org_id: user.org_id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { org_name, name, email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json(errorResponse('Email already in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Org and Admin User in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: { name: org_name },
      });

      const user = await tx.user.create({
        data: {
          org_id: org.id,
          name,
          email,
          password_hash: hashedPassword,
          role: 'ADMIN',
        },
      });

      return { org, user };
    });

    const tokens = generateTokens(result.user);

    return res.status(201).json(
      successResponse({
        user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, department: result.user.department, employee_id: result.user.employee_id, join_date: result.user.join_date, profile_photo_url: result.user.profile_photo_url },
        organization: { id: result.org.id, name: result.org.name },
        ...tokens,
      })
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    const tokens = generateTokens(user);

    return res.status(200).json(
      successResponse({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, org_id: user.org_id, department: user.department, employee_id: user.employee_id, join_date: user.join_date, profile_photo_url: user.profile_photo_url },
        ...tokens,
      })
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    const payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET as string) as any;

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json(errorResponse('User not found'));
    }

    const tokens = generateTokens(user);

    return res.status(200).json(successResponse(tokens));
  } catch (error: any) {
    return res.status(401).json(errorResponse('Invalid refresh token'));
  }
};
