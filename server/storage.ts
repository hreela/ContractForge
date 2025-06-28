export interface StorageContract {
  id: number;
  name: string;
  symbol: string;
  initialSupply: string;
  decimals: number;
  features: string[];
  deployerAddress: string;
  contractAddress: string | null;
  transactionHash: string | null;
  totalCost: number;
  isPaid: boolean;
  isOwnerDeployment: boolean;
  createdAt: Date;
  deployedAt: Date | null;
}

export interface StorageContractFeature {
  id: number;
  contractId: number | null;
  featureName: string;
  featureConfig: string | null;
}

export interface StorageFeaturePricing {
  id: number;
  featureName: string;
  price: number;
  description: string;
  isActive: boolean;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface IStorage {
  // Contract operations
  createContract(contract: Omit<StorageContract, 'id' | 'createdAt' | 'deployedAt'>): Promise<StorageContract>;
  getContract(id: number): Promise<StorageContract | undefined>;
  getContractByAddress(address: string): Promise<StorageContract | undefined>;
  updateContract(id: number, updates: Partial<StorageContract>): Promise<StorageContract | undefined>;
  getContractsByDeployer(deployerAddress: string): Promise<StorageContract[]>;
  
  // Contract feature operations
  createContractFeature(feature: Omit<StorageContractFeature, 'id'>): Promise<StorageContractFeature>;
  getContractFeatures(contractId: number): Promise<StorageContractFeature[]>;
  
  // Feature pricing operations
  createFeaturePricing(pricing: Omit<StorageFeaturePricing, 'id' | 'updatedAt'>): Promise<StorageFeaturePricing>;
  updateFeaturePricing(featureName: string, updates: Partial<Omit<StorageFeaturePricing, 'id' | 'featureName' | 'updatedAt'>>, updatedBy: string): Promise<StorageFeaturePricing | undefined>;
  getFeaturePricing(featureName: string): Promise<StorageFeaturePricing | undefined>;
  getAllFeaturePricing(): Promise<StorageFeaturePricing[]>;
  getActiveFeaturePricing(): Promise<StorageFeaturePricing[]>;
}

export class MemStorage implements IStorage {
  private contracts: Map<number, StorageContract>;
  private contractFeatures: Map<number, StorageContractFeature>;
  private featurePricing: Map<string, StorageFeaturePricing>;
  private currentContractId: number;
  private currentFeatureId: number;
  private currentPricingId: number;

  constructor() {
    this.contracts = new Map();
    this.contractFeatures = new Map();
    this.featurePricing = new Map();
    this.currentContractId = 1;
    this.currentFeatureId = 1;
    this.currentPricingId = 1;
    
    // Initialize default feature pricing
    this.initializeDefaultPricing();
  }
  
  private initializeDefaultPricing() {
    const defaultFeatures = [
      { name: "pausable", price: 5, description: "Ability to pause/unpause contract operations" },
      { name: "tax", price: 10, description: "Automatic tax collection on token transfers" },
      { name: "reflection", price: 10, description: "Automatic reward distribution to holders" },
      { name: "antiwhale", price: 20, description: "Maximum transaction and wallet limits" },
      { name: "blacklist", price: 10, description: "Block specific addresses from transfers" },
      { name: "maxsupply", price: 5, description: "Set maximum token supply limit" },
      { name: "timelock", price: 25, description: "Time-delayed execution of admin functions" },
      { name: "governance", price: 35, description: "Voting and proposal system for token holders" },
    ];
    
    defaultFeatures.forEach(feature => {
      const pricing: StorageFeaturePricing = {
        id: this.currentPricingId++,
        featureName: feature.name,
        price: feature.price,
        description: feature.description,
        isActive: true,
        updatedAt: new Date(),
        updatedBy: null,
      };
      this.featurePricing.set(feature.name, pricing);
    });
  }

  async createContract(contractData: Omit<StorageContract, 'id' | 'createdAt' | 'deployedAt'>): Promise<StorageContract> {
    const id = this.currentContractId++;
    const contract: StorageContract = {
      ...contractData,
      id,
      createdAt: new Date(),
      deployedAt: null,
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async getContract(id: number): Promise<StorageContract | undefined> {
    return this.contracts.get(id);
  }

  async getContractByAddress(address: string): Promise<StorageContract | undefined> {
    return Array.from(this.contracts.values()).find(
      (contract) => contract.contractAddress === address
    );
  }

  async updateContract(id: number, updates: Partial<StorageContract>): Promise<StorageContract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    const updatedContract = { ...contract, ...updates };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  async getContractsByDeployer(deployerAddress: string): Promise<StorageContract[]> {
    return Array.from(this.contracts.values()).filter(
      (contract) => contract.deployerAddress === deployerAddress
    );
  }

  async createContractFeature(featureData: Omit<StorageContractFeature, 'id'>): Promise<StorageContractFeature> {
    const id = this.currentFeatureId++;
    const feature: StorageContractFeature = {
      ...featureData,
      id,
    };
    this.contractFeatures.set(id, feature);
    return feature;
  }

  async getContractFeatures(contractId: number): Promise<StorageContractFeature[]> {
    return Array.from(this.contractFeatures.values()).filter(
      (feature) => feature.contractId === contractId
    );
  }
  
  // Feature pricing operations
  async createFeaturePricing(pricingData: Omit<StorageFeaturePricing, 'id' | 'updatedAt'>): Promise<StorageFeaturePricing> {
    const pricing: StorageFeaturePricing = {
      id: this.currentPricingId++,
      ...pricingData,
      updatedAt: new Date(),
    };
    
    this.featurePricing.set(pricing.featureName, pricing);
    return pricing;
  }
  
  async updateFeaturePricing(
    featureName: string, 
    updates: Partial<Omit<StorageFeaturePricing, 'id' | 'featureName' | 'updatedAt'>>, 
    updatedBy: string
  ): Promise<StorageFeaturePricing | undefined> {
    const existing = this.featurePricing.get(featureName);
    if (!existing) return undefined;
    
    const updated: StorageFeaturePricing = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      updatedBy,
    };
    
    this.featurePricing.set(featureName, updated);
    return updated;
  }
  
  async getFeaturePricing(featureName: string): Promise<StorageFeaturePricing | undefined> {
    return this.featurePricing.get(featureName);
  }
  
  async getAllFeaturePricing(): Promise<StorageFeaturePricing[]> {
    return Array.from(this.featurePricing.values());
  }
  
  async getActiveFeaturePricing(): Promise<StorageFeaturePricing[]> {
    return Array.from(this.featurePricing.values()).filter(pricing => pricing.isActive);
  }
}

export const storage = new MemStorage();