import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const deployerAddress = req.query.deployer as string;
      if (!deployerAddress) {
        return res.status(400).json({ message: 'Deployer address required' });
      }
      
      const contracts = await storage.getContractsByDeployer(deployerAddress);
      res.status(200).json(contracts);
    } else if (req.method === 'POST') {
      const contract = await storage.createContract(req.body);
      res.status(201).json(contract);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Contract API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}