import { ethers } from "ethers";
import { POLYGON_CHAIN_ID, POLYGON_RPC_URL, OWNER_WALLET } from "./constants";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<{ address: string; isOwner: boolean }> {
    console.log("Web3Service: Starting wallet connection");
    
    if (!window.ethereum) {
      console.error("Web3Service: MetaMask not detected");
      throw new Error("Please install MetaMask to use this application");
    }

    try {
      console.log("Web3Service: Creating provider");
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      console.log("Web3Service: Requesting account access");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("Web3Service: Accounts received:", accounts);
      
      console.log("Web3Service: Switching to Polygon network");
      await this.switchToPolygon();
      console.log("Web3Service: Network switch completed");
      
      console.log("Web3Service: Getting signer");
      this.signer = await this.provider.getSigner();
      console.log("Web3Service: Signer obtained");
      
      console.log("Web3Service: Getting address");
      const address = await this.signer.getAddress();
      console.log("Web3Service: Address obtained:", address);
      
      const isOwner = address.toLowerCase() === OWNER_WALLET.toLowerCase();
      console.log("Web3Service: Owner check:", { address, isOwner, ownerWallet: OWNER_WALLET });

      console.log("Web3Service: Connection successful", { address, isOwner });
      return { address, isOwner };
    } catch (error: any) {
      console.error("Web3Service: Error connecting wallet:", error);
      console.error("Web3Service: Error details:", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      throw error;
    }
  }

  async switchToPolygon(): Promise<void> {
    if (!window.ethereum) return;

    try {
      console.log("Web3Service: Attempting to switch to Polygon chain");
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${POLYGON_CHAIN_ID.toString(16)}` }],
      });
      console.log("Web3Service: Successfully switched to Polygon chain");
    } catch (error: any) {
      console.log("Web3Service: Error switching chain, code:", error.code);
      // If chain is not added, add it
      if (error.code === 4902) {
        console.log("Web3Service: Chain not found, adding Polygon network");
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${POLYGON_CHAIN_ID.toString(16)}`,
              chainName: "Polygon",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              rpcUrls: [POLYGON_RPC_URL],
              blockExplorerUrls: ["https://polygonscan.com/"],
            },
          ],
        });
        console.log("Web3Service: Polygon network added successfully");
      } else {
        console.error("Web3Service: Error switching to Polygon:", error);
        throw error;
      }
    }
  }

  async deployContract(
    contractCode: string,
    tokenName: string,
    tokenSymbol: string,
    initialSupply: string,
    decimals: number
  ): Promise<{ contractAddress: string; transactionHash: string }> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      // In a real implementation, you would compile the contract and deploy it
      // For this demo, we'll simulate the deployment
      const tx = await this.signer.sendTransaction({
        to: "0x0000000000000000000000000000000000000000",
        value: ethers.parseEther("0.01"), // Gas fee simulation
        data: "0x", // Contract bytecode would go here
      });

      const receipt = await tx.wait();
      
      // In a real deployment, the contract address would come from the receipt
      const contractAddress = ethers.getCreateAddress({
        from: await this.signer.getAddress(),
        nonce: await this.signer.getNonce() - 1,
      });

      return {
        contractAddress,
        transactionHash: receipt!.hash,
      };
    } catch (error) {
      console.error("Error deploying contract:", error);
      throw error;
    }
  }

  async payDeploymentFee(amount: number): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: OWNER_WALLET,
        value: ethers.parseEther(amount.toString()),
      });

      const receipt = await tx.wait();
      return receipt!.hash;
    } catch (error) {
      console.error("Error paying deployment fee:", error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  async getBalance(): Promise<string> {
    if (!this.signer) return "0";
    
    try {
      const balance = await this.provider!.getBalance(await this.signer.getAddress());
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  }
}

export const web3Service = new Web3Service();
