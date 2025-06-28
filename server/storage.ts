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

export interface StorageAchievement {
  id: number;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  requirement: string;
  isActive: boolean;
  createdAt: Date;
}

export interface StorageUserAchievement {
  id: number;
  userAddress: string;
  badgeId: string;
  unlockedAt: Date;
  contractId: number | null;
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

  // Achievement operations
  createAchievement(achievement: Omit<StorageAchievement, 'id' | 'createdAt'>): Promise<StorageAchievement>;
  getAchievements(): Promise<StorageAchievement[]>;
  getActiveAchievements(): Promise<StorageAchievement[]>;
  
  // User achievement operations
  createUserAchievement(userAchievement: Omit<StorageUserAchievement, 'id' | 'unlockedAt'>): Promise<StorageUserAchievement>;
  getUserAchievements(userAddress: string): Promise<StorageUserAchievement[]>;
  checkAndUnlockAchievements(userAddress: string, contractId?: number): Promise<StorageUserAchievement[]>;
  hasUserAchievement(userAddress: string, badgeId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private contracts: Map<number, StorageContract>;
  private contractFeatures: Map<number, StorageContractFeature>;
  private featurePricing: Map<string, StorageFeaturePricing>;
  private achievements: Map<string, StorageAchievement>;
  private userAchievements: Map<string, StorageUserAchievement[]>;
  private currentContractId: number;
  private currentFeatureId: number;
  private currentPricingId: number;
  private currentAchievementId: number;
  private currentUserAchievementId: number;

  constructor() {
    this.contracts = new Map();
    this.contractFeatures = new Map();
    this.featurePricing = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.currentContractId = 1;
    this.currentFeatureId = 1;
    this.currentPricingId = 1;
    this.currentAchievementId = 1;
    this.currentUserAchievementId = 1;
    
    // Initialize default feature pricing
    this.initializeDefaultPricing();
    this.initializeDefaultAchievements();
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

  private initializeDefaultAchievements() {
    const defaultAchievements = [
      {
        badgeId: "first-deployment",
        name: "First Steps",
        description: "Deploy your first smart contract",
        icon: "🚀",
        color: "bg-blue-500",
        category: "deployment",
        requirement: JSON.stringify({ type: "contract_count", value: 1 }),
        isActive: true,
      },
      {
        badgeId: "veteran-deployer",
        name: "Veteran Deployer",
        description: "Deploy 10 smart contracts",
        icon: "⭐",
        color: "bg-yellow-500",
        category: "deployment",
        requirement: JSON.stringify({ type: "contract_count", value: 10 }),
        isActive: true,
      },
      {
        badgeId: "feature-explorer",
        name: "Feature Explorer",
        description: "Use 5 different features in contracts",
        icon: "🔬",
        color: "bg-purple-500",
        category: "features",
        requirement: JSON.stringify({ type: "unique_features", value: 5 }),
        isActive: true,
      },
      {
        badgeId: "governance-master",
        name: "Governance Master",
        description: "Deploy a contract with governance features",
        icon: "🏛️",
        color: "bg-green-500",
        category: "features",
        requirement: JSON.stringify({ type: "has_feature", value: "governance" }),
        isActive: true,
      },
      {
        badgeId: "whale-protector",
        name: "Whale Protector",
        description: "Deploy a contract with anti-whale protection",
        icon: "🛡️",
        color: "bg-red-500",
        category: "features",
        requirement: JSON.stringify({ type: "has_feature", value: "antiwhale" }),
        isActive: true,
      },
      {
        badgeId: "volume-trader",
        name: "Volume Trader",
        description: "Deploy contracts worth 100+ POL in total",
        icon: "💎",
        color: "bg-indigo-500",
        category: "volume",
        requirement: JSON.stringify({ type: "total_spent", value: 100 }),
        isActive: true,
      },
    ];

    defaultAchievements.forEach(achievement => {
      const storedAchievement: StorageAchievement = {
        id: this.currentAchievementId++,
        ...achievement,
        createdAt: new Date(),
      };
      this.achievements.set(achievement.badgeId, storedAchievement);
    });
  }

  // Achievement operations
  async createAchievement(achievementData: Omit<StorageAchievement, 'id' | 'createdAt'>): Promise<StorageAchievement> {
    const achievement: StorageAchievement = {
      id: this.currentAchievementId++,
      ...achievementData,
      createdAt: new Date(),
    };
    
    this.achievements.set(achievement.badgeId, achievement);
    return achievement;
  }

  async getAchievements(): Promise<StorageAchievement[]> {
    return Array.from(this.achievements.values());
  }

  async getActiveAchievements(): Promise<StorageAchievement[]> {
    return Array.from(this.achievements.values()).filter(achievement => achievement.isActive);
  }

  // User achievement operations
  async createUserAchievement(userAchievementData: Omit<StorageUserAchievement, 'id' | 'unlockedAt'>): Promise<StorageUserAchievement> {
    const userAchievement: StorageUserAchievement = {
      id: this.currentUserAchievementId++,
      ...userAchievementData,
      unlockedAt: new Date(),
    };
    
    const userAchievements = this.userAchievements.get(userAchievementData.userAddress) || [];
    userAchievements.push(userAchievement);
    this.userAchievements.set(userAchievementData.userAddress, userAchievements);
    
    return userAchievement;
  }

  async getUserAchievements(userAddress: string): Promise<StorageUserAchievement[]> {
    return this.userAchievements.get(userAddress.toLowerCase()) || [];
  }

  async hasUserAchievement(userAddress: string, badgeId: string): Promise<boolean> {
    const userAchievements = this.userAchievements.get(userAddress.toLowerCase()) || [];
    return userAchievements.some(achievement => achievement.badgeId === badgeId);
  }

  async checkAndUnlockAchievements(userAddress: string, contractId?: number): Promise<StorageUserAchievement[]> {
    const newAchievements: StorageUserAchievement[] = [];
    const activeAchievements = await this.getActiveAchievements();
    const userContracts = await this.getContractsByDeployer(userAddress);
    
    for (const achievement of activeAchievements) {
      // Skip if user already has this achievement
      if (await this.hasUserAchievement(userAddress, achievement.badgeId)) {
        continue;
      }
      
      const requirement = JSON.parse(achievement.requirement);
      let shouldUnlock = false;
      
      switch (requirement.type) {
        case "contract_count":
          shouldUnlock = userContracts.length >= requirement.value;
          break;
          
        case "unique_features":
          const uniqueFeatures = new Set();
          userContracts.forEach(contract => {
            contract.features.forEach(feature => uniqueFeatures.add(feature));
          });
          shouldUnlock = uniqueFeatures.size >= requirement.value;
          break;
          
        case "has_feature":
          shouldUnlock = userContracts.some(contract => 
            contract.features.includes(requirement.value)
          );
          break;
          
        case "total_spent":
          const totalSpent = userContracts.reduce((sum, contract) => sum + contract.totalCost, 0);
          shouldUnlock = totalSpent >= requirement.value;
          break;
      }
      
      if (shouldUnlock) {
        const newAchievement = await this.createUserAchievement({
          userAddress: userAddress.toLowerCase(),
          badgeId: achievement.badgeId,
          contractId: contractId || null,
        });
        newAchievements.push(newAchievement);
      }
    }
    
    return newAchievements;
  }
}

export const storage = new MemStorage();