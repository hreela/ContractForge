import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Shield, Zap, Code, Network, Box, Settings, Trophy } from "lucide-react";
import { Link } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import WalletConnection from "@/components/wallet-connection";
import FeatureSelector from "@/components/feature-selector";
import DeploymentModal from "@/components/deployment-modal";
import AchievementsPanel from "@/components/achievements-panel";
import AchievementNotification from "@/components/achievement-notification";
import AchievementBadge from "@/components/achievement-badge";
import { TokenConfig, FeatureConfig } from "@/types/contract";
import { Achievement, UserAchievement, AchievementWithStatus } from "@/types/achievements";
import { apiRequest } from "@/lib/queryClient";
import { CONTRACT_FEATURES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { walletState, setWalletState } = useWallet();
  
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    name: "",
    symbol: "",
    initialSupply: "",
    decimals: 18,
  });
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig>({});
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentModal, setDeploymentModal] = useState({
    isOpen: false,
    contractId: null as number | null,
    contractCode: "",
    deploymentData: null as any,
  });
  
  const [achievementsPanelOpen, setAchievementsPanelOpen] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  
  const { toast } = useToast();

  // Fetch achievements data
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    enabled: walletState.isConnected,
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ["/api/users", walletState.address, "achievements"],
    enabled: walletState.isConnected && !!walletState.address,
  });

  // Get recent achievements for header display
  const recentAchievements = userAchievements
    .slice(-3)
    .map((ua: UserAchievement) => {
      const achievement = achievements.find(a => a.badgeId === ua.badgeId);
      return achievement ? { ...achievement, isUnlocked: true, unlockedAt: ua.unlockedAt } : null;
    })
    .filter(Boolean) as AchievementWithStatus[];

  const handleWalletConnection = (connected: boolean, address?: string, isOwner?: boolean) => {
    setWalletState({
      isConnected: connected,
      address: address || "",
      isOwner: isOwner || false,
    });
  };

  const handleTokenConfigChange = (field: keyof TokenConfig, value: string | number) => {
    setTokenConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateTotalCost = (features: string[]) => {
    const baseCost = 5;
    const featureCost = features.reduce((sum, feature) => {
      return sum + (CONTRACT_FEATURES.find(f => f.name === feature)?.price || 0);
    }, 0);
    return baseCost + featureCost;
  };

  const validateForm = (): boolean => {
    if (!walletState.isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to deploy a contract.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!tokenConfig.name.trim()) {
      toast({
        title: "Token Name Required",
        description: "Please enter a token name.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!tokenConfig.symbol.trim()) {
      toast({
        title: "Token Symbol Required",
        description: "Please enter a token symbol.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!tokenConfig.initialSupply.trim() || isNaN(Number(tokenConfig.initialSupply))) {
      toast({
        title: "Initial Supply Required",
        description: "Please enter a valid initial supply.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleDeploy = async () => {
    if (!validateForm()) return;
    
    setIsDeploying(true);
    
    try {
      const deploymentData = {
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        initialSupply: tokenConfig.initialSupply,
        decimals: tokenConfig.decimals,
        features: selectedFeatures,
        featureConfig,
        deployerAddress: walletState.address,
      };
      
      // Generate contract and get pricing info
      const response = await apiRequest('POST', '/api/generate-contract', deploymentData);
      const result = await response.json();
      
      // Handle new achievements
      if (result.newAchievements && result.newAchievements.length > 0) {
        const achievementDetails = result.newAchievements.map((userAchievement: any) => {
          return (achievements as Achievement[]).find(a => a.badgeId === userAchievement.badgeId);
        }).filter(Boolean);
        
        setNewAchievements(achievementDetails);
      }
      
      // Check if payment is required (not owner wallet)
      if (!walletState.isOwner && result.totalCost > 0) {
        try {
          toast({
            title: "Processing Payment",
            description: `Requesting payment of ${result.totalCost} POL. Please confirm in MetaMask...`,
          });
          
          // Initiate payment through web3Service
          const { web3Service } = await import("@/lib/web3");
          const paymentTxHash = await web3Service.payDeploymentFee(result.totalCost); // totalCost is already in POL
          
          toast({
            title: "Payment Transaction Sent",
            description: "Waiting for payment confirmation...",
          });
          
          // Update contract as paid
          await apiRequest('POST', `/api/contracts/${result.contractId}/payment`, {
            paymentTxHash,
            amount: result.totalCost,
          });
          
          toast({
            title: "Payment Successful",
            description: "Payment confirmed. Proceeding with deployment...",
          });
        } catch (paymentError: any) {
          console.error('Payment failed:', paymentError);
          throw new Error(`Payment failed: ${paymentError.message || 'User rejected transaction'}`);
        }
      } else if (walletState.isOwner) {
        toast({
          title: "Owner Deployment",
          description: "Proceeding with free deployment for admin wallet...",
        });
      }
      
      setDeploymentModal({
        isOpen: true,
        contractId: result.contractId,
        contractCode: result.contractCode,
        deploymentData: { ...deploymentData, totalCost: result.totalCost, isOwnerDeployment: result.isOwnerDeployment },
      });
      
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to start deployment process.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-surface border-b border-gray-700 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Box className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ContractForge</h1>
                <p className="text-xs text-gray-400">Smart Contract Deployment Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {walletState.isConnected && (
                <div className="flex items-center space-x-2">
                  {/* Recent achievements display */}
                  <div className="flex space-x-1">
                    {recentAchievements.slice(0, 3).map((achievement) => (
                      <AchievementBadge key={achievement.badgeId} achievement={achievement} size="sm" />
                    ))}
                  </div>
                  
                  {/* Achievements panel trigger */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setAchievementsPanelOpen(true)}
                    className="border-accent text-accent hover:bg-accent hover:text-dark"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Achievements
                    {userAchievements.length > 0 && (
                      <span className="ml-2 bg-accent text-dark rounded-full px-2 py-0.5 text-xs">
                        {userAchievements.length}
                      </span>
                    )}
                  </Button>
                </div>
              )}
              
              {walletState.isOwner && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-dark">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              <WalletConnection onConnectionChange={handleWalletConnection} />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-2 rounded-full text-sm mb-6">
              <Zap className="w-4 h-4 text-accent" />
              <span>Professional Smart Contract Deployment Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Deploy Smart Contracts
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}Without Coding
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Create and deploy feature-rich smart contracts on Polygon network with our intuitive platform. 
              Select from professional features and deploy with just a few clicks.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-accent">
                <Shield className="w-5 h-5" />
                <span>Audited Templates</span>
              </div>
              <div className="flex items-center space-x-2 text-accent">
                <Zap className="w-5 h-5" />
                <span>Instant Deployment</span>
              </div>
              <div className="flex items-center space-x-2 text-accent">
                <Code className="w-5 h-5" />
                <span>Verification Included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Feature Selection Panel */}
            <div className="lg:col-span-2">
              <FeatureSelector
                selectedFeatures={selectedFeatures}
                featureConfig={featureConfig}
                isOwner={walletState.isOwner}
                onFeaturesChange={setSelectedFeatures}
                onConfigChange={setFeatureConfig}
              />
            </div>
            
            {/* Configuration & Deployment Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                
                {/* Token Configuration */}
                <Card className="glass-effect border-none">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center mr-2">
                        <Code className="w-4 h-4 text-primary" />
                      </div>
                      Token Configuration
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="token-name" className="text-gray-300">Token Name</Label>
                        <Input
                          id="token-name"
                          name="token-name"
                          value={tokenConfig.name}
                          onChange={(e) => handleTokenConfigChange('name', e.target.value)}
                          placeholder="My Token"
                          className="bg-surface-light border-gray-600"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="token-symbol" className="text-gray-300">Token Symbol</Label>
                        <Input
                          id="token-symbol"
                          name="token-symbol"
                          value={tokenConfig.symbol}
                          onChange={(e) => handleTokenConfigChange('symbol', e.target.value)}
                          placeholder="MTK"
                          className="bg-surface-light border-gray-600"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="initial-supply" className="text-gray-300">Initial Supply</Label>
                        <Input
                          id="initial-supply"
                          name="initial-supply"
                          type="number"
                          value={tokenConfig.initialSupply}
                          onChange={(e) => handleTokenConfigChange('initialSupply', e.target.value)}
                          placeholder="1000000"
                          className="bg-surface-light border-gray-600"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="token-decimals" className="text-gray-300">Decimals</Label>
                        <Select
                          name="token-decimals"
                          value={tokenConfig.decimals.toString()}
                          onValueChange={(value) => handleTokenConfigChange('decimals', parseInt(value))}
                        >
                          <SelectTrigger id="token-decimals" className="bg-surface-light border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18">18 (Standard)</SelectItem>
                            <SelectItem value="6">6 (USDC Style)</SelectItem>
                            <SelectItem value="8">8 (Bitcoin Style)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Deploy Button */}
                <Button
                  onClick={handleDeploy}
                  disabled={!walletState.isConnected || isDeploying}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5" />
                  <span>
                    {isDeploying 
                      ? "Processing..." 
                      : walletState.isOwner 
                        ? "Deploy Free (Admin)" 
                        : `Deploy (${(() => {
                            const baseCost = 20;
                            const featureCost = selectedFeatures.reduce((sum, feature) => {
                              return sum + (CONTRACT_FEATURES.find(f => f.name === feature)?.price || 0);
                            }, 0);
                            return baseCost + featureCost;
                          })()} POL)`
                    }
                  </span>
                </Button>
                
                <p className="text-xs text-gray-400 text-center flex items-center justify-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Your contract will be automatically verified on PolygonScan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Modal */}
      <DeploymentModal
        isOpen={deploymentModal.isOpen}
        onClose={() => setDeploymentModal(prev => ({ ...prev, isOpen: false }))}
        contractId={deploymentModal.contractId}
        contractCode={deploymentModal.contractCode}
        deploymentData={deploymentModal.deploymentData}
      />

      {/* Footer */}
      <footer className="bg-surface border-t border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Box className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">ContractForge</h3>
                  <p className="text-sm text-gray-400">Smart Contract Deployment Platform</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                Deploy professional smart contracts on Polygon network without coding. 
                Choose from audited templates and advanced features.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Shield className="w-4 h-4 text-accent" />
                <span>Platform Admin:</span>
                <code className="bg-surface-light px-2 py-1 rounded text-xs">0xE29B...716a</code>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Instant Deployment</li>
                <li>• Auto Verification</li>
                <li>• Audited Templates</li>
                <li>• Feature Selection</li>
                <li>• PDF Documentation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="https://t.me/+hrP23f7XcBdiOTRl" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Community Telegram</a></li>
                <li>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="hover:text-accent transition-colors text-left">Contact Support</button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="text-sm">
                          <p className="mb-2">Get support from telegram:</p>
                          <a href="https://t.me/+hrP23f7XcBdiOTRl" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                            https://t.me/+hrP23f7XcBdiOTRl
                          </a>
                          <p className="mt-2 mb-1">or just drop an email at:</p>
                          <a href="mailto:hreela@gmail.com" className="text-blue-400 hover:text-blue-300">
                            hreela@gmail.com
                          </a>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 ContractForge. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <Network className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Achievement Notifications */}
      {newAchievements.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.badgeId}-${index}`}
          achievement={achievement}
          onDismiss={() => setNewAchievements(prev => prev.filter((_, i) => i !== index))}
        />
      ))}

      {/* Achievements Panel */}
      <AchievementsPanel
        userAddress={walletState.address}
        isOpen={achievementsPanelOpen}
        onClose={() => setAchievementsPanelOpen(false)}
      />
    </div>
  );
}
