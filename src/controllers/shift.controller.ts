import { Response } from 'express';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const createShift = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { name, start_time, end_time } = req.body;

    const shift = await prisma.shift.create({
      data: {
        org_id,
        name,
        start_time,
        end_time,
      },
    });

    return res.status(201).json(successResponse(shift));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const getShifts = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;

    const shifts = await prisma.shift.findMany({
      where: { org_id },
    });

    return res.status(200).json(successResponse(shifts));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const assignShift = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { shift_id, user_id, date } = req.body;

    // Verify shift belongs to org
    const shift = await prisma.shift.findFirst({ where: { id: shift_id, org_id } });
    if (!shift) {
      return res.status(404).json(errorResponse('Shift not found'));
    }

    // Verify user belongs to org
    const user = await prisma.user.findFirst({ where: { id: user_id, org_id } });
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const assignment = await prisma.shiftAssignment.create({
      data: {
        shift_id,
        user_id,
        date: new Date(date),
      },
      include: {
        shift: true,
        user: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json(successResponse(assignment));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};
