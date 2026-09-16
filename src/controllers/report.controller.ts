import { Response } from 'express';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const getAttendanceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.org_id;
    const { from, to } = req.query;

    const query: any = {
      user: { org_id }
    };

    if (from || to) {
      query.clock_in_at = {};
      if (from) query.clock_in_at.gte = new Date(from as string);
      if (to) query.clock_in_at.lte = new Date(to as string);
    }

    const attendances = await prisma.attendance.findMany({
      where: query,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Calculate basic summary
    const summary = attendances.reduce((acc: any, curr: any) => {
      const date = curr.clock_in_at.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total_clock_ins: 0, users: new Set() };
      }
      acc[date].total_clock_ins += 1;
      acc[date].users.add(curr.user_id);
      return acc;
    }, {});

    // Convert Sets to counts for JSON serialization
    for (const key in summary) {
      summary[key].unique_users = summary[key].users.size;
      delete summary[key].users;
    }

    return res.status(200).json(successResponse(summary));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const getOvertime = async (req: AuthRequest, res: Response) => {
  try {
    // Basic mock logic for overtime: hours > 8 per day
    return res.status(200).json(successResponse({
      message: "Overtime report calculation logic to be implemented based on org work hours.",
      data: []
    }));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const exportReport = async (req: AuthRequest, res: Response) => {
  try {
    const { format } = req.query;
    
    if (format !== 'pdf' && format !== 'excel') {
       return res.status(400).json(errorResponse('Invalid format. Use pdf or excel.'));
    }

    // Mocking export logic
    return res.status(200).json(successResponse({
      message: `Export triggered for ${format}. URL will be sent to email.`,
      url: `https://dummy-url.com/report.${format}`
    }));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};
