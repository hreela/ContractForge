import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut, Network } from "lucide-react";
import { web3Service } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { OWNER_WALLET } from "@/lib/constants";

interface WalletConnectionProps {
  onConnectionChange: (connected: boolean, address?: string, isOwner?: boolean) => void;
}

export default function WalletConnection({ onConnectionChange }: WalletConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (web3Service.isConnected()) {
      // Get current account if already connected
      try {
        const accounts = await window.ethereum?.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          const userAddress = accounts[0];
          const isOwnerWallet = userAddress.toLowerCase() === OWNER_WALLET.toLowerCase();
          setAddress(userAddress);
          setIsOwner(isOwnerWallet);
          setIsConnected(true);
          onConnectionChange(true, userAddress, isOwnerWallet);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    console.log("Starting wallet connection...");
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to connect your wallet");
      }
      
      console.log("MetaMask detected, connecting...");
      const { address: walletAddress, isOwner: ownerStatus } = await web3Service.connectWallet();
      
      console.log("Wallet connected:", walletAddress, "isOwner:", ownerStatus);
      
      setAddress(walletAddress);
      setIsOwner(ownerStatus);
      setIsConnected(true);
      onConnectionChange(true, walletAddress, ownerStatus);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      });

      if (ownerStatus) {
        toast({
          title: "Owner Wallet Detected",
          description: "You have free access to all deployments!",
        });
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      
      let errorMessage = "Failed to connect wallet";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 4001) {
        errorMessage = "Connection rejected by user";
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
    setIsOwner(false);
    onConnectionChange(false);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-300">
          <Network className="w-4 h-4 text-accent" />
          <span>Polygon Network</span>
        </div>
        
        {isOwner && (
          <Badge className="bg-gradient-to-r from-accent to-green-400 text-dark font-semibold">
            <span className="mr-1">👑</span>
            Owner - FREE Deployment
          </Badge>
        )}
        
        <div className="glass-effect px-4 py-2 rounded-lg flex items-center space-x-2">
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
          <span className="text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnectWallet}
            className="text-gray-400 hover:text-white p-1"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center space-x-2"
    >
      <Wallet className="w-4 h-4" />
      <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
    </Button>
  );
}
