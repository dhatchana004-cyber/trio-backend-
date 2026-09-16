import { Response } from 'express';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const applyLeave = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { type, start_date, end_date } = req.body;

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        user_id,
        type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      },
    });

    return res.status(201).json(successResponse(leaveRequest));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const approveLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const approver_id = req.user!.id;
    
    // Ensure the leave request exists and belongs to a user in the same org
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!leaveRequest || leaveRequest.user.org_id !== req.user!.org_id) {
       return res.status(404).json(errorResponse('Leave request not found'));
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approved_by: approver_id,
      },
    });

    return res.status(200).json(successResponse(updatedLeave));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const rejectLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const approver_id = req.user!.id;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!leaveRequest || leaveRequest.user.org_id !== req.user!.org_id) {
       return res.status(404).json(errorResponse('Leave request not found'));
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approved_by: approver_id,
      },
    });

    return res.status(200).json(successResponse(updatedLeave));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const getLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { status } = req.query;

    const query: any = {
      user: {
        org_id
      }
    };

    if (status) {
      query.status = status as string;
    }

    if (req.user!.role === 'EMPLOYEE') {
      // Employees can only see their own leaves
      query.user_id = req.user!.id;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: query,
      include: {
        user: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    return res.status(200).json(successResponse(leaves));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};
