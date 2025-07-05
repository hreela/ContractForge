import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const achievements = await storage.getActiveAchievements();
      res.status(200).json(achievements);
    } else if (req.method === 'POST') {
      const achievement = await storage.createAchievement(req.body);
      res.status(201).json(achievement);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Achievement API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}