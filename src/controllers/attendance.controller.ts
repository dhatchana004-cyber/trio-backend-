import { Response } from "express";
import prisma from "../utils/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { AuthRequest } from "../middlewares/auth";
import path from "path";
import { compareFacesLocal } from "../utils/faceMatcher";

export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const org_id = req.user!.org_id;
    
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        user_id,
        clock_out_at: null,
      },
    });

    if (activeAttendance) {
      return res.status(400).json(errorResponse("You are already clocked in"));
    }

    const { lat, lng, notes } = req.body;
    let selfie_url = null;
    let selfieFilename = null;

    if (req.file) {
      selfieFilename = (req.file as any).filename;
      selfie_url = `${req.protocol}://${req.get("host")}/uploads/${selfieFilename}`;
    }

    if (!selfie_url || !selfieFilename) {
      return res.status(400).json(errorResponse("Selfie is required for attendance"));
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user || !user.profile_photo_url) {
      return res.status(400).json(errorResponse("Please set up your profile photo first"));
    }

    // Local Facial Recognition Verification
    const profileUrlParts = user.profile_photo_url.split("/uploads/");
    if (profileUrlParts.length === 2) {
      const profileFilename = profileUrlParts[1];
      const uploadsDir = path.join(__dirname, "../../uploads");
      const profilePhotoPath = path.join(uploadsDir, profileFilename);
      const selfiePhotoPath = path.join(uploadsDir, selfieFilename);
      
      try {
        const isMatch = await compareFacesLocal(profilePhotoPath, selfiePhotoPath);
        if (!isMatch) {
          return res.status(400).json(errorResponse("Face verification failed. Faces do not match."));
        }
      } catch (err: any) {
        return res.status(400).json(errorResponse(err.message));
      }
    } else {
       return res.status(400).json(errorResponse("Invalid profile photo format, unable to verify face."));
    }

    let within_geofence = true;

    const attendance = await prisma.attendance.create({
      data: {
        user_id,
        clock_in_at: new Date(),
        clock_in_lat: lat ? parseFloat(lat) : null,
        clock_in_lng: lng ? parseFloat(lng) : null,
        selfie_url,
        is_within_geofence: within_geofence,
        notes,
      },
    });

    return res.status(201).json(successResponse(attendance));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const clockOut = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;

    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        user_id,
        clock_out_at: null,
      },
    });

    if (!activeAttendance) {
      return res.status(400).json(errorResponse("No active clock-in found"));
    }

    const { lat, lng, notes } = req.body;
    let selfie_url = null;
    let selfieFilename = null;

    if (req.file) {
      selfieFilename = (req.file as any).filename;
      selfie_url = `${req.protocol}://${req.get("host")}/uploads/${selfieFilename}`;
    }

    if (!selfie_url || !selfieFilename) {
      return res.status(400).json(errorResponse("Selfie is required for clock out"));
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user || !user.profile_photo_url) {
      return res.status(400).json(errorResponse("Please set up your profile photo first"));
    }

    // Local Facial Recognition Verification
    const profileUrlParts = user.profile_photo_url.split("/uploads/");
    if (profileUrlParts.length === 2) {
      const profileFilename = profileUrlParts[1];
      const uploadsDir = require('path').join(__dirname, "../../uploads");
      const profilePhotoPath = require('path').join(uploadsDir, profileFilename);
      const selfiePhotoPath = require('path').join(uploadsDir, selfieFilename);
      
      try {
        const isMatch = await compareFacesLocal(profilePhotoPath, selfiePhotoPath);
        if (!isMatch) {
          return res.status(400).json(errorResponse("Face verification failed. Faces do not match."));
        }
      } catch (err: any) {
        return res.status(400).json(errorResponse(err.message));
      }
    } else {
       return res.status(400).json(errorResponse("Invalid profile photo format, unable to verify face."));
    }

    const attendance = await prisma.attendance.update({
      where: { id: activeAttendance.id },
      data: {
        clock_out_at: new Date(),
        clock_out_lat: lat ? parseFloat(lat) : null,
        clock_out_lng: lng ? parseFloat(lng) : null,
        notes: notes ? `${activeAttendance.notes ? activeAttendance.notes + "\\n" : ""}${notes}` : activeAttendance.notes,
      },
    });

    return res.status(200).json(successResponse(attendance));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};


export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    if (req.user!.role === "EMPLOYEE" && req.user!.id !== userId) {
       return res.status(403).json(errorResponse("Forbidden"));
    }

    const query: any = { user_id: userId };

    if (from || to) {
      query.clock_in_at = {};
      if (from) query.clock_in_at.gte = new Date(from as string);
      if (to) query.clock_in_at.lte = new Date(to as string);
    }

    const attendances = await prisma.attendance.findMany({
      where: query,
      orderBy: { clock_in_at: "desc" }
    });

    return res.status(200).json(successResponse(attendances));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

// Get today's team stats (Who's In/Out)
export const getTodayStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all attendance records for today
    const records = await prisma.attendance.findMany({
      where: {
        clock_in_at: { gte: today }
      }
    });

    let inCount = 0;
    let outCount = 0;
    let breakCount = 0; // If you implement breaks later

    records.forEach(record => {
      if (!record.clock_out_at) {
        inCount++; // Still clocked in
      } else {
        outCount++; // Clocked out
      }
    });

    res.json({
      in: inCount,
      out: outCount,
      break: breakCount
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user's weekly tracked hours
export const getWeeklyStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get start of the current week (Monday)
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1;
    const startOfWeek = new Date(curr.setDate(first));
    startOfWeek.setHours(0, 0, 0, 0);

    const records = await prisma.attendance.findMany({
      where: {
        user_id: userId,
        clock_in_at: { gte: startOfWeek }
      },
      orderBy: { clock_in_at: 'asc' }
    });

    // Initialize days (Mon-Sun)
    const weeklyData = [
      { day: 'M', workedMinutes: 0, breakMinutes: 0, overtimeMinutes: 0 },
      { day: 'T', workedMinutes: 0, breakMinutes: 0, overtimeMinutes: 0 },
      { day: 'W', workedMinutes: 0, breakMinutes: 0, overtimeMinutes: 0 },
      { day: 'T', workedMinutes: 0, breakMinutes: 0, overtimeMinutes: 0 },
      { day: 'F', workedMinutes: 0, breakMinutes: 0, overtimeMinutes: 0 },
      { day: 'S', workedMinutes: 0, breakMinutes: 0, overtimeMinutes: 0 },
      { day: 'S', workedMinutes: 0, breakMinutes: 0, overtimeMinutes: 0 },
    ];

    let totalWorkedMinutes = 0;
    let totalBreakMinutes = 0;

    records.forEach(record => {
      if (record.clock_out_at && record.clock_in_at) {
        const dayIndex = record.clock_in_at.getDay() === 0 ? 6 : record.clock_in_at.getDay() - 1; // 0 is Monday, 6 is Sunday
        const diffMs = record.clock_out_at.getTime() - record.clock_in_at.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        weeklyData[dayIndex].workedMinutes += diffMins;
        totalWorkedMinutes += diffMins;
      }
    });

    res.json({
      totalWorkedMinutes,
      totalBreakMinutes,
      dailyBreakdown: weeklyData
    });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Start a break for the currently clocked-in user
export const startBreak = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;

    // Find the active attendance (clocked in, not yet clocked out)
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        user_id,
        clock_out_at: null,
      },
    });

    if (!activeAttendance) {
      return res.status(400).json(errorResponse("You must be clocked in to start a break"));
    }

    // Check if there's already an active break (no end_at)
    const activeBreak = await (prisma as any).timeBreak.findFirst({
      where: {
        attendance_id: activeAttendance.id,
        end_at: null,
      },
    });

    if (activeBreak) {
      return res.status(400).json(errorResponse("You already have an active break"));
    }

    const newBreak = await (prisma as any).timeBreak.create({
      data: {
        attendance_id: activeAttendance.id,
        start_at: new Date(),
      },
    });

    return res.status(201).json(successResponse(newBreak));
  } catch (error: any) {
    console.error('Error starting break:', error);
    return res.status(500).json(errorResponse(error.message));
  }
};

// End the active break for the currently clocked-in user
export const endBreak = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;

    // Find the active attendance
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        user_id,
        clock_out_at: null,
      },
    });

    if (!activeAttendance) {
      return res.status(400).json(errorResponse("You must be clocked in to end a break"));
    }

    // Find the active break
    const activeBreak = await (prisma as any).timeBreak.findFirst({
      where: {
        attendance_id: activeAttendance.id,
        end_at: null,
      },
    });

    if (!activeBreak) {
      return res.status(400).json(errorResponse("No active break found to end"));
    }

    const updatedBreak = await (prisma as any).timeBreak.update({
      where: { id: activeBreak.id },
      data: {
        end_at: new Date(),
      },
    });

    return res.status(200).json(successResponse(updatedBreak));
  } catch (error: any) {
    console.error('Error ending break:', error);
    return res.status(500).json(errorResponse(error.message));
  }
};