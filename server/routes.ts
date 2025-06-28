import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contractGenerator } from "./services/contractGenerator";
import { pdfGenerator } from "./services/pdfGenerator";
import { deploymentSchema } from "@shared/schema";
import { StorageContract } from "./storage";
import { z } from "zod";

const OWNER_WALLET = "0xE29BD5797Bde889ab2a12A631E80821f30fB716a";

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

      // Calculate total cost
      const baseCost = 5;
      const featureCost = data.features.reduce((sum, feature) => {
        return sum + (FEATURE_PRICES[feature as keyof typeof FEATURE_PRICES] || 0);
      }, 0);
      const totalCost = baseCost + featureCost;
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

      res.json({
        contractId: contract.id,
        contractCode,
        totalCost: contract.totalCost,
        isOwnerDeployment,
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

  // Get feature pricing
  app.get("/api/feature-prices", (req, res) => {
    res.json({
      baseCost: 5,
      features: FEATURE_PRICES,
      ownerWallet: OWNER_WALLET,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
