import { Response } from 'express';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;

    const org = await prisma.organization.findUnique({
      where: { id: org_id },
    });

    if (!org) {
      return res.status(404).json(errorResponse('Organization not found'));
    }

    return res.status(200).json(successResponse(org));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { name, geofence_radius_m, work_start, work_end } = req.body;

    const org = await prisma.organization.update({
      where: { id: org_id },
      data: {
        name,
        geofence_radius_m,
        work_start,
        work_end,
      },
    });

    return res.status(200).json(successResponse(org));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};
