import { Router } from 'express';
import { getUserSettings, updateUserSettings } from '../services/supabase';
import type { Request, Response } from 'express';

export const settingsRouter = Router();

settingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const settings = await getUserSettings(userId);
    return res.json(settings || {});
  } catch {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

settingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await updateUserSettings(userId, req.body);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});
