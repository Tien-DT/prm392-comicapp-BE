import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

/**
 * Optional Auth Middleware
 * - If token exists and valid → attach user to request
 * - If token missing or invalid → continue without user (public access)
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue as public user
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.user = decoded;
      console.log('✅ [optionalAuth] User authenticated:', decoded.id);
    } catch (err) {
      // Invalid token, continue as public
      console.log('⚠️ [optionalAuth] Invalid token, continue as public');
    }

    next();
  } catch (error) {
    console.error('❌ [optionalAuth] Error:', error);
    next();
  }
};
