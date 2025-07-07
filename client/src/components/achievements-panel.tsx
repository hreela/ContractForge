import React from 'react';
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Target, TrendingUp, Users, X } from "lucide-react";
import AchievementBadge from "./achievement-badge";
import { Achievement, UserAchievement, AchievementWithStatus } from "@/types/achievements";
import { apiRequest } from "@/lib/queryClient";

interface AchievementsPanelProps {
  userAddress: string;
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  deployment: Trophy,
  features: Award,
  volume: TrendingUp,
  social: Users,
};

const categoryColors = {
  deployment: "text-blue-500",
  features: "text-purple-500", 
  volume: "text-green-500",
  social: "text-orange-500",
};

export default function AchievementsPanel({ userAddress, isOpen, onClose }: AchievementsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    enabled: isOpen,
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ["/api/users", userAddress, "achievements"],
    enabled: isOpen && !!userAddress,
  });

  const achievementsWithStatus: AchievementWithStatus[] = achievements.map((achievement: Achievement) => {
    const userAchievement = userAchievements.find(
      (ua: UserAchievement) => ua.badgeId === achievement.badgeId
    );
    return {
      ...achievement,
      isUnlocked: !!userAchievement,
      unlockedAt: userAchievement?.unlockedAt,
    };
  });

  const filteredAchievements = selectedCategory === "all" 
    ? achievementsWithStatus
    : achievementsWithStatus.filter(a => a.category === selectedCategory);

  const unlockedCount = achievementsWithStatus.filter(a => a.isUnlocked).length;
  const totalCount = achievementsWithStatus.length;
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const categories = Array.from(new Set(achievements.map((a: Achievement) => a.category)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-surface border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="text-accent w-6 h-6" />
              <div>
                <CardTitle className="text-white">Achievements</CardTitle>
                <p className="text-sm text-gray-400">
                  {unlockedCount} of {totalCount} achievements unlocked ({progressPercentage.toFixed(1)}%)
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-accent to-secondary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${categories.length + 1}, 1fr)` }}>
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map((category) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || Target;
                const count = achievementsWithStatus.filter(a => a.category === category && a.isUnlocked).length;
                const total = achievementsWithStatus.filter(a => a.category === category).length;
                
                return (
                  <TabsTrigger key={category} value={category} className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${categoryColors[category as keyof typeof categoryColors]}`} />
                    <span className="capitalize">{category}</span>
                    <Badge variant="outline" className="ml-1">{count}/{total}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAchievements.map((achievement) => (
                  <div key={achievement.badgeId} className="flex flex-col items-center">
                    <AchievementBadge achievement={achievement} size="lg" />
                  </div>
                ))}
              </div>

              {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No achievements in this category yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
