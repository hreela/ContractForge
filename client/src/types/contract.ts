export interface ContractFeature {
  name: string;
  price: number;
  description: string;
  icon: string;
  color: string;
  configurable?: boolean;
}

export interface FeatureConfig {
  tax?: {
    percentage: number;
    recipient: string;
  };
  antiwhale?: {
    maxTransaction: number;
    maxWallet: number;
  };
  maxsupply?: {
    maxSupply: string;
  };
  timelock?: {
    delay: number; // in hours
    proposers: string[]; // array of addresses that can propose
    executors: string[]; // array of addresses that can execute
  };
  governance?: {
    votingDelay: number; // blocks to wait before voting starts
    votingPeriod: number; // blocks voting is active
    proposalThreshold: string; // minimum tokens to create proposal
    quorumPercentage: number; // percentage of total supply needed for quorum
  };
}

export interface TokenConfig {
  name: string;
  symbol: string;
  initialSupply: string;
  decimals: number;
}

export interface DeploymentResult {
  contractId: number;
  contractAddress: string;
  transactionHash: string;
  totalCost: number;
  isOwnerDeployment: boolean;
}

export interface Web3State {
  isConnected: boolean;
  address: string;
  isOwner: boolean;
  chainId: number;
}
