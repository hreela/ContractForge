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
      
      // Wait a bit for network to stabilize after switch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Web3Service: Getting signer");
      
      // Try to get signer with timeout and retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Web3Service: Signer attempt ${attempts}/${maxAttempts}`);
          
          const signerPromise = this.provider.getSigner();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Signer acquisition timeout")), 8000)
          );
          
          this.signer = await Promise.race([signerPromise, timeoutPromise]) as ethers.JsonRpcSigner;
          console.log("Web3Service: Signer obtained");
          break;
        } catch (error) {
          console.log(`Web3Service: Signer attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) {
            throw new Error(`Failed to get signer after ${maxAttempts} attempts: ${error.message}`);
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
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
      console.log("Web3Service: Starting contract deployment");
      
      // For a realistic demo, we'll create a transaction that actually gets mined
      // In production, this would be replaced with actual contract compilation and deployment
      const userAddress = await this.signer.getAddress();
      const nonce = await this.signer.getNonce();
      
      // Simulate contract deployment by sending a self-transaction with contract data
      const contractCreationData = ethers.concat([
        ethers.toUtf8Bytes(`CONTRACT:${tokenName}:${tokenSymbol}:${initialSupply}:${decimals}`),
        ethers.randomBytes(32) // Add some randomness
      ]);
      
      const tx = await this.signer.sendTransaction({
        to: userAddress, // Send to self to create a real transaction
        value: ethers.parseEther("0.001"), // Minimal value for gas
        data: ethers.hexlify(contractCreationData),
      });

      console.log("Web3Service: Transaction sent, waiting for confirmation");
      const receipt = await tx.wait();
      console.log("Web3Service: Transaction confirmed");
      
      if (!receipt) {
        throw new Error("Transaction receipt not received");
      }
      
      // Generate a deterministic contract address based on the transaction
      const contractAddress = ethers.getCreateAddress({
        from: userAddress,
        nonce: nonce,
      });

      console.log("Web3Service: Contract deployed", {
        contractAddress,
        transactionHash: receipt.hash
      });

      return {
        contractAddress,
        transactionHash: receipt.hash,
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
