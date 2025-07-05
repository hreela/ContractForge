import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const pricing = await storage.getAllFeaturePricing();
      res.status(200).json(pricing);
    } else if (req.method === 'PUT') {
      const { featureName, updates, updatedBy } = req.body;
      
      if (!featureName || !updates || !updatedBy) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const updated = await storage.updateFeaturePricing(featureName, updates, updatedBy);
      res.status(200).json(updated);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Feature pricing API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}