import React from 'react';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut, Network, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { web3Service } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { OWNER_WALLET } from "@/lib/constants";

interface WalletConnectionProps {
  onConnectionChange: (connected: boolean, address?: string, isOwner?: boolean) => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

export default function WalletConnection({ onConnectionChange }: WalletConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        console.log("MetaMask not detected");
        return;
      }

      if (web3Service.isConnected()) {
        // Get current account if already connected
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        console.log("Existing accounts found:", accounts);
        
        if (accounts && accounts.length > 0) {
          const userAddress = accounts[0];
          const isOwnerWallet = userAddress.toLowerCase() === OWNER_WALLET.toLowerCase();
          
          console.log("Auto-connecting to existing account:", userAddress);
          
          setAddress(userAddress);
          setIsOwner(isOwnerWallet);
          setIsConnected(true);
          onConnectionChange(true, userAddress, isOwnerWallet);
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setShowAnimation(true);
    console.log("Starting wallet connection...");
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to connect your wallet");
      }
      
      console.log("MetaMask detected, connecting...");
      const { address: walletAddress, isOwner: ownerStatus } = await web3Service.connectWallet();
      
      console.log("Wallet connected:", walletAddress, "isOwner:", ownerStatus);
      
      // Show success animation
      setConnectionStatus('success');
      
      // Wait for animation before updating state
      setTimeout(() => {
        setAddress(walletAddress);
        setIsOwner(ownerStatus);
        setIsConnected(true);
        onConnectionChange(true, walletAddress, ownerStatus);
        setShowAnimation(false);
        setConnectionStatus('idle');
      }, 1500);

      toast({
        title: "Wallet Connected Successfully",
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
      
      // Show error animation
      setConnectionStatus('error');
      
      let errorMessage = "Failed to connect wallet";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 4001) {
        errorMessage = "Connection rejected by user";
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending";
      }
      
      // Hide animation after showing error
      setTimeout(() => {
        setShowAnimation(false);
        setConnectionStatus('idle');
      }, 2000);
      
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
        
        <div className="glass-effect px-4 py-2 rounded-lg flex items-center space-x-2 animate-fadeIn">
          <div className="relative">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-accent rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-sm font-mono transition-all duration-300 hover:text-accent">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnectWallet}
            className="text-gray-400 hover:text-white p-1 transition-all duration-200 hover:scale-110"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const getButtonContent = () => {
    if (showAnimation) {
      switch (connectionStatus) {
        case 'connecting':
          return (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          );
        case 'success':
          return (
            <>
              <CheckCircle className="w-4 h-4 text-green-400 animate-pulse" />
              <span>Connected!</span>
            </>
          );
        case 'error':
          return (
            <>
              <XCircle className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Failed</span>
            </>
          );
        default:
          return (
            <>
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </>
          );
      }
    }
    
    return (
      <>
        <Wallet className="w-4 h-4" />
        <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
      </>
    );
  };

  const getButtonClassName = () => {
    let baseClasses = "px-6 py-2 rounded-lg font-semibold text-white transition-all duration-500 flex items-center space-x-2 transform";
    
    if (showAnimation) {
      switch (connectionStatus) {
        case 'connecting':
          return `${baseClasses} bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse scale-105`;
        case 'success':
          return `${baseClasses} bg-gradient-to-r from-green-500 to-emerald-500 animate-bounceIn shadow-lg shadow-green-500/25`;
        case 'error':
          return `${baseClasses} bg-gradient-to-r from-red-500 to-pink-500 animate-shake shadow-lg shadow-red-500/25`;
        default:
          return `${baseClasses} bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary`;
      }
    }
    
    return `${baseClasses} bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary hover:scale-105`;
  };

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting || showAnimation}
      className={getButtonClassName()}
    >
      {getButtonContent()}
    </Button>
  );
}
