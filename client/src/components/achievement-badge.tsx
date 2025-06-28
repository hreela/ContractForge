import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AchievementWithStatus } from "@/types/achievements";
import { format } from "date-fns";

interface AchievementBadgeProps {
  achievement: AchievementWithStatus;
  size?: "sm" | "md" | "lg";
}

export default function AchievementBadge({ achievement, size = "md" }: AchievementBadgeProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20", 
    lg: "w-24 h-24"
  };

  const iconSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className={`${sizeClasses[size]} cursor-pointer transition-all duration-200 ${
          achievement.isUnlocked 
            ? "border-accent shadow-lg hover:shadow-xl scale-100" 
            : "border-gray-600 opacity-50 grayscale"
        }`}>
          <CardContent className="p-0 flex flex-col items-center justify-center h-full">
            <div className={`${achievement.color} rounded-lg p-2 mb-1 ${
              achievement.isUnlocked ? "" : "bg-gray-600"
            }`}>
              <span className={`${iconSizes[size]} ${achievement.isUnlocked ? "text-white" : "text-gray-400"}`}>
                {achievement.icon}
              </span>
            </div>
            {size !== "sm" && (
              <span className={`text-xs font-medium text-center px-1 ${
                achievement.isUnlocked ? "text-white" : "text-gray-500"
              }`}>
                {achievement.name}
              </span>
            )}
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{achievement.icon}</span>
            <span className="font-semibold">{achievement.name}</span>
            {achievement.isUnlocked && (
              <Badge variant="secondary" className="text-xs">
                Unlocked
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-300">{achievement.description}</p>
          <div className="text-xs text-gray-400">
            <span className="capitalize">{achievement.category}</span>
            {achievement.isUnlocked && achievement.unlockedAt && (
              <div className="mt-1">
                Unlocked on {format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
              </div>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}