import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CONTRACT_FEATURES } from "@/lib/constants";
import { FeatureConfig } from "@/types/contract";
import { 
  Pause, 
  Percent, 
  FlipHorizontal2, 
  Shield, 
  Ban, 
  Infinity, 
  Clock, 
  Vote,
  Coins,
  ArrowRightLeft
} from "lucide-react";

interface FeatureSelectorProps {
  selectedFeatures: string[];
  featureConfig: FeatureConfig;
  isOwner: boolean;
  onFeaturesChange: (features: string[]) => void;
  onConfigChange: (config: FeatureConfig) => void;
}

const FeatureIcon = ({ name, className }: { name: string; className?: string }) => {
  const iconMap = {
    pause: Pause,
    percentage: Percent,
    reflect: FlipHorizontal2,
    shield: Shield,
    ban: Ban,
    infinity: Infinity,
    clock: Clock,
    "vote-yea": Vote,
    coins: Coins,
    "exchange-alt": ArrowRightLeft,
  };
  
  const Icon = iconMap[name as keyof typeof iconMap] || Coins;
  return <Icon className={className} />;
};

export default function FeatureSelector({
  selectedFeatures,
  featureConfig,
  isOwner,
  onFeaturesChange,
  onConfigChange,
}: FeatureSelectorProps) {
  const [localConfig, setLocalConfig] = useState<FeatureConfig>(featureConfig);

  useEffect(() => {
    onConfigChange(localConfig);
  }, [localConfig, onConfigChange]);

  const handleFeatureToggle = (featureName: string) => {
    const newFeatures = selectedFeatures.includes(featureName)
      ? selectedFeatures.filter(f => f !== featureName)
      : [...selectedFeatures, featureName];
    
    onFeaturesChange(newFeatures);
  };

  const updateFeatureConfig = (featureName: string, config: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [featureName]: config,
    }));
  };

  const totalCost = 5 + selectedFeatures.reduce((sum, feature) => {
    const featureData = CONTRACT_FEATURES.find(f => f.name === feature);
    return sum + (featureData?.price || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Select Contract Features</h2>
              <p className="text-gray-400">Choose the features you want to include in your smart contract</p>
            </div>
          </div>
          
          {/* Standard Features */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center mr-2">
                <FeatureIcon name="coins" className="w-4 h-4 text-primary" />
              </div>
              Standard Features (Included)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="gradient-border">
                <div className="gradient-border-content">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FeatureIcon name="coins" className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Mint & Burn</h4>
                        <p className="text-sm text-gray-400">Token creation and destruction</p>
                      </div>
                    </div>
                    <Badge className="bg-accent text-dark">INCLUDED</Badge>
                  </div>
                </div>
              </div>
              
              <div className="gradient-border">
                <div className="gradient-border-content">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FeatureIcon name="exchange-alt" className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">ERC-20 Standard</h4>
                        <p className="text-sm text-gray-400">Full token standard compliance</p>
                      </div>
                    </div>
                    <Badge className="bg-accent text-dark">INCLUDED</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Premium Features */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-6 h-6 bg-secondary/20 rounded-lg flex items-center justify-center mr-2">
                <FeatureIcon name="coins" className="w-4 h-4 text-secondary" />
              </div>
              Premium Features
            </h3>
            
            <div className="grid gap-4">
              {CONTRACT_FEATURES.map((feature) => (
                <div key={feature.name}>
                  <Label className="cursor-pointer">
                    <div className={`glass-effect rounded-xl p-4 transition-all duration-300 hover:bg-surface-light/50 ${
                      selectedFeatures.includes(feature.name) ? 'bg-primary/20 border-primary' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center`}>
                            <FeatureIcon name={feature.icon} className={`w-5 h-5 text-${feature.color}-400`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white capitalize">{feature.name}</h4>
                            <p className="text-sm text-gray-400">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`bg-${feature.color}-500 text-white ${isOwner ? 'line-through opacity-50' : ''}`}>
                            ${feature.price} POL
                          </Badge>
                          <Checkbox
                            checked={selectedFeatures.includes(feature.name)}
                            onCheckedChange={() => handleFeatureToggle(feature.name)}
                          />
                        </div>
                      </div>
                    </div>
                  </Label>
                  
                  {/* Feature Configuration */}
                  {selectedFeatures.includes(feature.name) && feature.configurable && (
                    <div className="mt-4 ml-4 p-4 bg-surface/50 rounded-lg">
                      {feature.name === 'tax' && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-300">Tax Settings</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-gray-400">Tax Percentage (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="25"
                                value={localConfig.tax?.percentage || 5}
                                onChange={(e) => updateFeatureConfig('tax', {
                                  ...localConfig.tax,
                                  percentage: parseInt(e.target.value) || 5
                                })}
                                className="bg-surface-light border-gray-600"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-gray-400">Tax Recipient Address</Label>
                              <Input
                                type="text"
                                placeholder="0x..."
                                value={localConfig.tax?.recipient || ''}
                                onChange={(e) => updateFeatureConfig('tax', {
                                  ...localConfig.tax,
                                  recipient: e.target.value
                                })}
                                className="bg-surface-light border-gray-600 font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {feature.name === 'antiwhale' && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-300">Anti-Whale Settings</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-gray-400">Max Transaction (% of supply)</Label>
                              <Input
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={localConfig.antiwhale?.maxTransaction || 1}
                                onChange={(e) => updateFeatureConfig('antiwhale', {
                                  ...localConfig.antiwhale,
                                  maxTransaction: parseFloat(e.target.value) || 1
                                })}
                                className="bg-surface-light border-gray-600"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-gray-400">Max Wallet (% of supply)</Label>
                              <Input
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={localConfig.antiwhale?.maxWallet || 2}
                                onChange={(e) => updateFeatureConfig('antiwhale', {
                                  ...localConfig.antiwhale,
                                  maxWallet: parseFloat(e.target.value) || 2
                                })}
                                className="bg-surface-light border-gray-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {feature.name === 'maxsupply' && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-300">Max Supply Settings</h4>
                          <div>
                            <Label className="text-sm text-gray-400">Maximum Supply</Label>
                            <Input
                              type="text"
                              placeholder="1000000000"
                              value={localConfig.maxsupply?.maxSupply || ''}
                              onChange={(e) => updateFeatureConfig('maxsupply', {
                                maxSupply: e.target.value
                              })}
                              className="bg-surface-light border-gray-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Summary */}
      <Card className="glass-effect border-none">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-6 h-6 bg-accent/20 rounded-lg flex items-center justify-center mr-2">
              <FeatureIcon name="coins" className="w-4 h-4 text-accent" />
            </div>
            Deployment Cost
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Base Platform Fee</span>
              <span className={`text-white font-semibold ${isOwner ? 'line-through opacity-50' : ''}`}>
                $5 POL
              </span>
            </div>
            
            {selectedFeatures.map(featureName => {
              const feature = CONTRACT_FEATURES.find(f => f.name === featureName);
              if (!feature) return null;
              
              return (
                <div key={featureName} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 capitalize">{feature.name}</span>
                  <span className={`text-white ${isOwner ? 'line-through opacity-50' : ''}`}>
                    ${feature.price} POL
                  </span>
                </div>
              );
            })}
            
            <Separator className="my-3" />
            
            <div className="flex justify-between items-center text-lg">
              <span className="text-white font-semibold">Total Cost</span>
              <span className={`font-bold ${isOwner ? 'text-accent' : 'text-accent'}`}>
                {isOwner ? 'FREE' : `$${totalCost} POL`}
              </span>
            </div>
            
            {!isOwner && totalCost > 0 && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mt-3">
                <div className="flex items-center space-x-2 text-amber-400 text-sm">
                  <FeatureIcon name="coins" className="w-4 h-4" />
                  <span className="font-medium">Payment Required</span>
                </div>
                <p className="text-amber-300 text-xs mt-1">
                  You will be prompted to pay ${totalCost} POL before deployment.
                </p>
              </div>
            )}
            
            <div className="text-xs text-gray-400 mt-2 flex items-center">
              <FeatureIcon name="coins" className="w-3 h-3 mr-1" />
              Plus network gas fees for deployment
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
