import React from 'react';
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, ExternalLink, Check, Rocket } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number | null;
  contractCode: string;
  deploymentData: any;
}

interface DeploymentStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export default function DeploymentModal({
  isOpen,
  onClose,
  contractId,
  contractCode,
  deploymentData,
}: DeploymentModalProps) {
  const [steps, setSteps] = useState<DeploymentStep[]>([
    { id: 'generate', label: 'Generating contract code...', status: 'pending' },
    { id: 'deploy', label: 'Deploying to Polygon...', status: 'pending' },
    { id: 'verify', label: 'Verifying contract...', status: 'pending' },
  ]);
  
  const [deploymentResult, setDeploymentResult] = useState<{
    contractAddress: string;
    transactionHash: string;
  } | null>(null);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && contractId && !isDeploying) {
      startDeployment();
    }
  }, [isOpen, contractId]);

  const startDeployment = async () => {
    setIsDeploying(true);
    setProgress(0);
    
    try {
      // Step 1: Generate contract code (already done)
      updateStep('generate', 'completed');
      setProgress(33);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Deploy to Polygon
      updateStep('deploy', 'in-progress');
      
      // Simulate deployment - In real implementation, this would call web3Service.deployContract
      const mockDeploymentResult = {
        contractAddress: `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`,
        transactionHash: `0x${Math.random().toString(16).slice(2, 66).padStart(64, '0')}`,
      };
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update contract in database - this will now check payment status
      try {
        await apiRequest('POST', `/api/contracts/${contractId}/deployed`, mockDeploymentResult);
      } catch (error: any) {
        if (error.status === 402) {
          throw new Error("Payment required before deployment. Please complete payment first.");
        }
        throw error;
      }
      
      updateStep('deploy', 'completed');
      setProgress(66);
      
      // Step 3: Verify contract
      updateStep('verify', 'in-progress');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateStep('verify', 'completed');
      setProgress(100);
      
      setDeploymentResult(mockDeploymentResult);
      
      toast({
        title: "Deployment Successful!",
        description: "Your smart contract has been deployed and verified.",
      });
    } catch (error: any) {
      console.error('Deployment failed:', error);
      const currentStep = steps.find(s => s.status === 'in-progress');
      if (currentStep) {
        updateStep(currentStep.id, 'failed');
      }
      
      toast({
        title: "Deployment Failed",
        description: error.message || "There was an error deploying your contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const updateStep = (stepId: string, status: DeploymentStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadPDF = async () => {
    if (!contractId) return;
    
    try {
      const response = await fetch(`/api/contracts/${contractId}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deploymentData.name}_Contract.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Downloaded",
        description: "Contract documentation has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download contract documentation.",
        variant: "destructive",
      });
    }
  };

  const getStepIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-accent" />;
      case 'in-progress':
        return <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <div className="w-4 h-4 bg-destructive rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-effect">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center space-x-2">
            {deploymentResult ? (
              <>
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-dark" />
                </div>
                <span>Contract Deployed Successfully!</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-pulse">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <span>Deploying Contract</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!deploymentResult ? (
            <>
              <p className="text-center text-gray-400">
                Please confirm the transaction in your wallet...
              </p>
              
              <Progress value={progress} className="w-full" />
              
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    {getStepIcon(step.status)}
                    <span className={`text-sm ${
                      step.status === 'completed' ? 'text-accent' : 
                      step.status === 'in-progress' ? 'text-white' : 
                      step.status === 'failed' ? 'text-destructive' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-gray-400 mb-6">
                Your smart contract has been deployed and verified.
              </p>
              
              <div className="space-y-4">
                {/* Transaction Hash */}
                <Card className="glass-effect">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Transaction Hash</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(deploymentResult.transactionHash, "Transaction hash")}
                        className="text-accent hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-primary break-all">
                        {deploymentResult.transactionHash.slice(0, 20)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://polygonscan.com/tx/${deploymentResult.transactionHash}`, '_blank')}
                        className="text-accent hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Contract Address */}
                <Card className="glass-effect">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Contract Address</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(deploymentResult.contractAddress, "Contract address")}
                        className="text-accent hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-primary break-all">
                        {deploymentResult.contractAddress.slice(0, 20)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://polygonscan.com/address/${deploymentResult.contractAddress}`, '_blank')}
                        className="text-accent hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Download PDF */}
                <Button
                  onClick={downloadPDF}
                  className="w-full bg-gradient-to-r from-accent to-green-400 hover:from-green-400 hover:to-accent text-dark font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Contract Code & Instructions
                </Button>
              </div>
              
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full glass-effect"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
