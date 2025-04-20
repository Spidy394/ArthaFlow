
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Award, Medal, Star, Trophy, Zap, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

type Badge = Tables<"badges">;
type UserBadge = { 
  id: string;
  badge_id: string;
  awarded_at: string;
  badge: Badge;
};

// Define a simplified point history type since it doesn't exist in the DB schema anymore
type PointHistoryItem = {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  created_at: string;
};

const Achievements: React.FC = () => {
  const { user } = useAuth();

  // Fetch user points and level from database
  const { data: userPoints = { points: 0, level: 1 }, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return { points: 0, level: 1 };
      
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        // If no record exists, return default values
        if (error.code === 'PGRST116') {
          return { points: 0, level: 1 };
        }
        throw new Error(error.message);
      }
      
      return data || { points: 0, level: 1 };
    },
    enabled: !!user,
  });

  // Fetch user badges from database
  const { data: userBadges = [], isLoading: isLoadingBadges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id, 
          awarded_at,
          badge_id,
          badges (
            id,
            name,
            description,
            icon,
            category,
            requirement
          )
        `)
        .eq('user_id', user.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Transform the data to match the expected shape
      return (data || []).map(item => ({
        id: item.id,
        badge_id: item.badge_id,
        awarded_at: item.awarded_at,
        badge: item.badges
      }));
    },
    enabled: !!user,
  });

  // Fetch all available badges
  const { data: allBadges = [], isLoading: isLoadingAllBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category');
        
      if (error) {
        throw new Error(error.message);
      }
      
      // For each badge, check if the user has earned it
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
      
      return (data || []).map(badge => ({
        ...badge,
        awarded_at: earnedBadgeIds.has(badge.id) ? 
          userBadges.find(ub => ub.badge_id === badge.id)?.awarded_at : 
          null
      }));
    },
    enabled: !!userBadges.length,
  });

  // Mock point history data since the table was removed
  const pointsHistory: PointHistoryItem[] = [];

  // Fetch completed challenges count
  const { data: completedChallengesCount = 0 } = useQuery({
    queryKey: ['completed-challenges-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');
        
      if (error) {
        throw new Error(error.message);
      }
      
      return count || 0;
    },
    enabled: !!user,
  });

  // Calculate points required for next level
  const pointsToNextLevel = userPoints.level * 100;
  const progressToNextLevel = Math.min(Math.round((userPoints.points % pointsToNextLevel) / pointsToNextLevel * 100), 100);

  const renderBadgeIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "award": <Award className="h-5 w-5" />,
      "zap": <Zap className="h-5 w-5" />,
      "medal": <Medal className="h-5 w-5" />,
      "star": <Star className="h-5 w-5" />,
      "trophy": <Trophy className="h-5 w-5" />,
      "trending-up": <TrendingUp className="h-5 w-5" />,
    };
    
    return iconMap[icon] || <Award className="h-5 w-5" />;
  };

  const getBadgeByCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      "Budget": "bg-blue-100 text-blue-800",
      "Savings": "bg-green-100 text-green-800",
      "Consistency": "bg-yellow-100 text-yellow-800",
      "Debt": "bg-red-100 text-red-800",
      "Investment": "bg-purple-100 text-purple-800",
      "Planning": "bg-cyan-100 text-cyan-800",
    };
    
    return categories[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoadingPoints || isLoadingBadges || isLoadingAllBadges) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Loading achievements...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and earned badges
          </p>
        </div>

        {/* Level progress card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-primary" />
              Your ArthaFlow Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="text-3xl font-bold">{userPoints.level}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">Level {userPoints.level}</h3>
                  <p className="text-muted-foreground">
                    {userPoints.points} total points earned
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to Level {userPoints.level + 1}</span>
                  <span className="text-muted-foreground">
                    {userPoints.points % pointsToNextLevel} / {pointsToNextLevel} points
                  </span>
                </div>
                <Progress 
                  value={progressToNextLevel}
                  className="h-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-2xl font-bold">{userBadges.length}</div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-2xl font-bold">{userPoints.points}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-2xl font-bold">{completedChallengesCount}</div>
                <div className="text-sm text-muted-foreground">Challenges Completed</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="badges" className="w-full">
          <TabsList>
            <TabsTrigger value="badges" className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Points History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="badges" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  All Badges
                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                    ({userBadges.length}/{allBadges.length} earned)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {allBadges.map((badge) => {
                    const isEarned = !!badge.awarded_at;
                    
                    return (
                      <div 
                        key={badge.id} 
                        className={cn(
                          "p-4 rounded-lg border transition-colors flex flex-col items-center text-center",
                          isEarned ? "bg-card" : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <div 
                          className={cn(
                            "h-14 w-14 rounded-full flex items-center justify-center mb-3",
                            isEarned ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/70"
                          )}
                        >
                          {renderBadgeIcon(badge.icon)}
                        </div>
                        <h3 className="font-medium">{badge.name}</h3>
                        <p className="text-sm mt-1 mb-3">{badge.description}</p>
                        <Badge variant="outline" className={cn(isEarned ? getBadgeByCategoryName(badge.category) : "")}>
                          {badge.category}
                        </Badge>
                        {isEarned && (
                          <p className="text-xs mt-3 text-muted-foreground">
                            Earned on {new Date(badge.awarded_at!).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Points Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pointsHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No points activity yet.</p>
                      <p className="text-sm">Complete challenges to earn points!</p>
                    </div>
                  ) : (
                    pointsHistory.map((activity) => (
                      <React.Fragment key={activity.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Zap className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{activity.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-primary">
                            +{activity.amount}
                          </div>
                        </div>
                        <Separator />
                      </React.Fragment>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Achievements;
