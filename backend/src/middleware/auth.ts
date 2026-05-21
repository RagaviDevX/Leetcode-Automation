import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow unauthenticated for demo/development
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    (req as any).user = { id: 'dev-user', email: 'dev@localhost' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    // Allow anonymous with limited features
    (req as any).user = null;
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    (req as any).user = decoded;
    next();
  } catch {
    // Supabase JWT verification
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.sub) {
        (req as any).user = { id: decoded.sub, email: decoded.email };
        return next();
      }
    } catch {}

    return res.status(401).json({ error: 'Invalid token' });
  }
}
