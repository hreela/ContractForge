export interface Achievement {
  id: number;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  requirement: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserAchievement {
  id: number;
  userAddress: string;
  badgeId: string;
  unlockedAt: string;
  contractId: number | null;
}

export interface AchievementWithStatus extends Achievement {
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface NewAchievementNotification {
  achievement: Achievement;
  unlockedAt: string;
}