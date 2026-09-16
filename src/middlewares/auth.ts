import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    org_id: string;
    role: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
      if (err) {
        console.error('JWT Verify Error:', err);
        return res.status(403).json(errorResponse('Forbidden: Invalid token. Error: ' + err.message));
      }

      req.user = user as { id: string; org_id: string; role: string };
      next();
    });
  } else {
    res.status(401).json(errorResponse('Unauthorized: Missing token'));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('Forbidden: Insufficient permissions'));
    }

    next();
  };
};
