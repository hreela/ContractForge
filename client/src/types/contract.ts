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
