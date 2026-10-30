import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'scholarmesh_ultra_secure_jwt_secret_token_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  institution?: string;
  research_role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is required. Please log in or use the demo account.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Your session has expired or the token is invalid. Please log in again.'
    });
  }
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      institution: user.institution,
      research_role: user.research_role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
