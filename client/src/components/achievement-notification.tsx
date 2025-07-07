import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trophy } from "lucide-react";
import { Achievement } from "@/types/achievements";

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function AchievementNotification({ 
  achievement, 
  onDismiss, 
  autoHide = true, 
  duration = 5000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation after mount
    setTimeout(() => setIsAnimating(true), 100);
    
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
      isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    }`}>
      <Card className="w-80 bg-gradient-to-r from-accent/20 to-accent/10 border-accent shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="text-accent w-5 h-5" />
              <span className="text-accent font-semibold">Achievement Unlocked!</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="w-6 h-6 p-0 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`${achievement.color} rounded-lg p-3 flex-shrink-0`}>
              <span className="text-white text-xl">{achievement.icon}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
              <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
              <Badge variant="outline" className="text-xs border-accent text-accent">
                {achievement.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
