import React from 'react';
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, DollarSign, Save, RefreshCw } from "lucide-react";

interface FeaturePricing {
  id: number;
  featureName: string;
  price: number;
  description: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

interface AdminPanelProps {
  isOwner: boolean;
  userAddress: string;
}

export default function AdminPanel({ isOwner, userAddress }: AdminPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FeaturePricing>>({});

  const { data: featurePricing, isLoading } = useQuery({
    queryKey: ['/api/admin/features/pricing'],
    enabled: isOwner,
    queryFn: () => 
      fetch('/api/admin/features/pricing', {
        headers: { 'x-admin-address': userAddress }
      }).then(res => res.json())
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ featureName, updates }: { featureName: string; updates: Partial<FeaturePricing> }) =>
      fetch(`/api/admin/features/${featureName}/pricing`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-address': userAddress 
        },
        body: JSON.stringify(updates)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/features/pricing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feature-prices'] });
      setEditingFeature(null);
      setFormData({});
      toast({
        title: "Success",
        description: "Feature pricing updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update pricing.",
        variant: "destructive",
      });
    }
  });

  const startEditing = (feature: FeaturePricing) => {
    setEditingFeature(feature.featureName);
    setFormData({
      price: feature.price,
      description: feature.description,
      isActive: feature.isActive
    });
  };

  const saveChanges = (featureName: string) => {
    updatePricingMutation.mutate({ featureName, updates: formData });
  };

  const cancelEditing = () => {
    setEditingFeature(null);
    setFormData({});
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-dark text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-effect border-none">
            <CardContent className="p-8 text-center">
              <Settings className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-400">Only platform administrators can access this panel.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-accent" />
            Admin Panel
          </h1>
          <p className="text-gray-400">Manage platform feature pricing and settings</p>
        </div>

        <Card className="glass-effect border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-accent" />
              Feature Pricing Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                <span className="ml-2">Loading pricing data...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {featurePricing?.map((feature: FeaturePricing) => (
                  <div key={feature.featureName} className="glass-effect rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold capitalize">{feature.featureName}</h3>
                        <Badge variant={feature.isActive ? "default" : "secondary"}>
                          {feature.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingFeature === feature.featureName ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveChanges(feature.featureName)}
                              disabled={updatePricingMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={updatePricingMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => startEditing(feature)}
                            className="bg-primary hover:bg-primary/80"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingFeature === feature.featureName ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`price-${feature.featureName}`} className="text-sm text-gray-400">
                            Price (POL)
                          </Label>
                          <Input
                            id={`price-${feature.featureName}`}
                            type="number"
                            min="0"
                            value={formData.price || ''}
                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                            className="bg-surface-light border-gray-600"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`description-${feature.featureName}`} className="text-sm text-gray-400">
                            Description
                          </Label>
                          <Input
                            id={`description-${feature.featureName}`}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-surface-light border-gray-600"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.isActive || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          />
                          <Label className="text-sm text-gray-400">Active</Label>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Price:</span>
                          <span className="ml-2 font-semibold text-accent">{feature.price} POL</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-400">Description:</span>
                          <span className="ml-2">{feature.description}</span>
                        </div>
                      </div>
                    )}

                    {feature.updatedBy && (
                      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                        Last updated by {feature.updatedBy} on {new Date(feature.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
