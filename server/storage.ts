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
}

export class MemStorage implements IStorage {
  private contracts: Map<number, StorageContract>;
  private contractFeatures: Map<number, StorageContractFeature>;
  private currentContractId: number;
  private currentFeatureId: number;

  constructor() {
    this.contracts = new Map();
    this.contractFeatures = new Map();
    this.currentContractId = 1;
    this.currentFeatureId = 1;
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
}

export const storage = new MemStorage();