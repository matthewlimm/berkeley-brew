import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Debug auth headers
    console.log('Auth headers received:', {
      authorization: !!req.headers.authorization,
      cookie: !!req.headers.cookie
    });
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 10) + '...');
    
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('Auth error:', error.message);
      return next(new AppError('Invalid or expired token', 401));
    }
    
    if (!data.user) {
      console.log('No user found with token');
      return next(new AppError('User not found', 401));
    }
    
    console.log('User authenticated:', data.user.email);
    
    // Add user to request object
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    next(new AppError('Authentication failed', 401));
  }
};
