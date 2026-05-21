import { Router } from 'express';
import { getSolutions, getUserStats } from '../services/supabase';
import type { Request, Response } from 'express';

export const solutionsRouter = Router();

// GET /api/solutions
solutionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { limit = '20', offset = '0', status, difficulty } = req.query;

    const solutions = await getSolutions(userId, {
      limit: Number(limit),
      offset: Number(offset),
      status: status as string,
      difficulty: difficulty as string,
    });

    return res.json({ solutions, count: solutions.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch solutions' });
  }
});

// GET /api/solutions/stats
solutionsRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stats = await getUserStats(userId);
    return res.json(stats || {});
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
