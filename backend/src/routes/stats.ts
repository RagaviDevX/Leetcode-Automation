import { Router } from 'express';
import { getUserStats } from '../services/supabase';
import type { Request, Response } from 'express';

export const statsRouter = Router();

statsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const stats = await getUserStats(userId);
    return res.json(stats || {
      total_attempts: 0, total_solved: 0,
      easy_solved: 0, medium_solved: 0, hard_solved: 0,
      accuracy_percent: 0, total_tokens_used: 0,
      avg_attempts_to_solve: 0, last_solved_at: null,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
