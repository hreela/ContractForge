import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contractGenerator } from "./services/contractGenerator";
import { pdfGenerator } from "./services/pdfGenerator";
import { deploymentSchema, updateFeaturePricingSchema } from "@shared/schema";
import { StorageContract } from "./storage";
import { z } from "zod";

const OWNER_WALLET = "0xE29BD5797Bde889ab2a12A631E80821f30fB716a";

// Fallback pricing if database fails  
const FEATURE_PRICES = {
  pausable: 5,
  tax: 10,
  reflection: 10,
  antiwhale: 20,
  blacklist: 10,
  maxsupply: 5,
  timelock: 25,
  governance: 35,
};

// Admin authentication - in production, this should be more secure
const isAdmin = (address: string): boolean => {
  return address.toLowerCase() === OWNER_WALLET.toLowerCase();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate contract code
  app.post("/api/generate-contract", async (req, res) => {
    try {
      const data = deploymentSchema.parse(req.body);
      
      const contractCode = contractGenerator.generateContract(
        data.name,
        data.symbol,
        data.initialSupply,
        data.decimals,
        data.features,
        data.featureConfig
      );

      // Calculate total cost using dynamic pricing
      const baseCost = 5;
      const pricing = await storage.getActiveFeaturePricing();
      console.log("Dynamic pricing retrieved:", pricing);
      
      const featurePrices = pricing.reduce((acc, p) => {
        acc[p.featureName] = p.price;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("Feature prices map:", featurePrices);
      console.log("Selected features:", data.features);
      
      const featureCost = data.features.reduce((sum, feature) => {
        const dynamicPrice = featurePrices[feature];
        const fallbackPrice = FEATURE_PRICES[feature as keyof typeof FEATURE_PRICES];
        const finalPrice = dynamicPrice !== undefined ? dynamicPrice : (fallbackPrice || 0);
        console.log(`Feature ${feature}: dynamic=${dynamicPrice}, fallback=${fallbackPrice}, final=${finalPrice}`);
        return sum + finalPrice;
      }, 0);
      const totalCost = baseCost + featureCost;
      console.log("Total cost calculated:", totalCost);
      const isOwnerDeployment = data.deployerAddress.toLowerCase() === OWNER_WALLET.toLowerCase();

      // Create contract record
      const contract = await storage.createContract({
        name: data.name,
        symbol: data.symbol,
        initialSupply: data.initialSupply,
        decimals: data.decimals,
        features: data.features,
        deployerAddress: data.deployerAddress,
        contractAddress: null,
        transactionHash: null,
        totalCost: isOwnerDeployment ? 0 : totalCost,
        isPaid: isOwnerDeployment,
        isOwnerDeployment,
      });

      // Store feature configurations
      if (data.featureConfig) {
        for (const [featureName, config] of Object.entries(data.featureConfig)) {
          await storage.createContractFeature({
            contractId: contract.id,
            featureName,
            featureConfig: JSON.stringify(config),
          });
        }
      }

      // Check for achievements after contract creation
      const newAchievements = await storage.checkAndUnlockAchievements(data.deployerAddress, contract.id);

      res.json({
        contractId: contract.id,
        contractCode,
        totalCost: contract.totalCost,
        isOwnerDeployment,
        newAchievements,
      });
    } catch (error) {
      console.error("Error generating contract:", error);
      res.status(400).json({ 
        error: error instanceof z.ZodError ? error.errors : "Invalid request data" 
      });
    }
  });

  // Handle payment for contract deployment
  app.post("/api/contracts/:id/payment", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { paymentTxHash, amount } = req.body;

      if (!paymentTxHash || !amount) {
        return res.status(400).json({ error: "Payment transaction hash and amount are required" });
      }

      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (contract.isOwnerDeployment) {
        return res.status(400).json({ error: "Owner deployments don't require payment" });
      }

      if (amount < contract.totalCost) {
        return res.status(400).json({ error: "Insufficient payment amount" });
      }

      // Update contract as paid
      const updatedContract = await storage.updateContract(contractId, {
        isPaid: true,
      });

      res.json({ success: true, contract: updatedContract });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // Update contract with deployment info
  app.post("/api/contracts/:id/deployed", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { contractAddress, transactionHash } = req.body;

      if (!contractAddress || !transactionHash) {
        return res.status(400).json({ error: "Contract address and transaction hash are required" });
      }

      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Check if payment is required and completed
      if (!contract.isOwnerDeployment && !contract.isPaid) {
        return res.status(402).json({ error: "Payment required before deployment" });
      }

      const updatedContract = await storage.updateContract(contractId, {
        contractAddress,
        transactionHash,
        deployedAt: new Date(),
      });

      res.json(updatedContract);
    } catch (error) {
      console.error("Error updating contract deployment:", error);
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  // Generate PDF documentation
  app.get("/api/contracts/:id/pdf", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (!contract.contractAddress || !contract.transactionHash) {
        return res.status(400).json({ error: "Contract not yet deployed" });
      }

      // Generate contract code
      const contractCode = contractGenerator.generateContract(
        contract.name,
        contract.symbol,
        contract.initialSupply,
        contract.decimals,
        contract.features
      );

      // Generate verification instructions
      const verificationInstructions = contractGenerator.getVerificationInstructions(
        contract.contractAddress,
        [contract.name, contract.symbol, contract.initialSupply, contract.decimals.toString()]
      );

      // Generate PDF content
      const pdfContent = pdfGenerator.generateContractPDF({
        contractName: contract.name,
        contractAddress: contract.contractAddress,
        transactionHash: contract.transactionHash,
        sourceCode: contractCode,
        verificationInstructions,
        features: contract.features,
        deploymentDate: contract.deployedAt?.toISOString() || new Date().toISOString(),
      });

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${contract.name}_Contract.html"`);
      
      // Use the properly formatted HTML from pdfGenerator
      res.send(pdfContent);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Get contract details
  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      const features = await storage.getContractFeatures(contractId);
      
      res.json({
        ...contract,
        features: features,
      });
    } catch (error) {
      console.error("Error getting contract:", error);
      res.status(500).json({ error: "Failed to get contract" });
    }
  });

  // Get feature pricing (updated to use dynamic pricing)
  app.get("/api/feature-prices", async (req, res) => {
    try {
      console.log("Fetching active feature pricing...");
      const pricing = await storage.getActiveFeaturePricing();
      console.log("Active pricing from database:", pricing);
      
      const featurePrices = pricing.reduce((acc, p) => {
        acc[p.featureName] = p.price;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("Processed feature prices:", featurePrices);
      
      res.json({
        baseCost: 5,
        features: featurePrices,
        ownerWallet: OWNER_WALLET,
      });
    } catch (error) {
      console.error("Error fetching dynamic pricing, falling back to hardcoded:", error);
      // Fallback to hardcoded prices if database fails
      res.json({
        baseCost: 5,
        features: FEATURE_PRICES,
        ownerWallet: OWNER_WALLET,
      });
    }
  });

  // Admin: Get all feature pricing including inactive
  app.get("/api/admin/features/pricing", async (req, res) => {
    try {
      const adminAddress = req.headers['x-admin-address'] as string;
      if (!adminAddress || !isAdmin(adminAddress)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const pricing = await storage.getAllFeaturePricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching admin feature pricing:", error);
      res.status(500).json({ error: "Failed to fetch feature pricing" });
    }
  });

  // Admin: Update feature pricing
  app.put("/api/admin/features/:featureName/pricing", async (req, res) => {
    try {
      const adminAddress = req.headers['x-admin-address'] as string;
      if (!adminAddress || !isAdmin(adminAddress)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const featureName = req.params.featureName;
      const updates = updateFeaturePricingSchema.parse(req.body);

      const updated = await storage.updateFeaturePricing(featureName, updates, adminAddress);
      
      if (!updated) {
        return res.status(404).json({ error: "Feature not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error updating feature pricing:", error);
      res.status(500).json({ error: "Failed to update feature pricing" });
    }
  });

  // Achievement endpoints
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getActiveAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/users/:address/achievements", async (req, res) => {
    try {
      const userAddress = req.params.address;
      const userAchievements = await storage.getUserAchievements(userAddress);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/users/:address/check-achievements", async (req, res) => {
    try {
      const userAddress = req.params.address;
      const { contractId } = req.body;
      
      const newAchievements = await storage.checkAndUnlockAchievements(userAddress, contractId);
      res.json({ newAchievements });
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
