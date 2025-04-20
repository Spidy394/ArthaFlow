import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Zap, Medal, Star } from "lucide-react";

const UserAchievements: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch user points and level from database
  const { data: userPoints = { points: 0, level: 1 }, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return { points: 0, level: 1 };
      
      try {
        const { data, error } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .single()
          .throwOnError(); // Add throwOnError to get better error handling
          
        return data || { points: 0, level: 1 };
      } catch (error: any) {
        console.error('Error fetching user points:', error);
        
        // If there's a 406 error or no record exists, create a new user_points record
        if (error.status === 406 || error.code === 'PGRST116') {
          // Try to insert a new record for this user
          try {
            const { data: newData } = await supabase
              .from('user_points')
              .insert([{ user_id: user.id, points: 0, level: 1 }])
              .select('*')
              .single();
              
            return newData || { points: 0, level: 1 };
          } catch (insertError) {
            console.error('Error creating user points:', insertError);
            return { points: 0, level: 1 };
          }
        }
        
        // For other errors, return default values
        return { points: 0, level: 1 };
      }
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
            category
          )
        `)
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false })
        .limit(6);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Transform the data to match the expected shape
      return (data || []).map(item => ({
        id: item.id,
        name: item.badges?.name || '',
        description: item.badges?.description || '',
        icon: item.badges?.icon || 'award',
        category: item.badges?.category || '',
        awarded_at: item.awarded_at
      }));
    },
    enabled: !!user,
  });

  const pointsToNextLevel = userPoints.level * 100;
  const progressToNextLevel = Math.min(Math.round((userPoints.points % pointsToNextLevel) / pointsToNextLevel * 100), 100);

  const renderBadgeIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "award": <Award className="h-4 w-4" />,
      "zap": <Zap className="h-4 w-4" />,
      "medal": <Medal className="h-4 w-4" />,
      "star": <Star className="h-4 w-4" />,
    };
    
    return iconMap[icon] || <Award className="h-4 w-4" />;
  };
  
  return (
    <Card className="col-span-1 md:col-span-2 h-96 overflow-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Medal className="h-5 w-5 mr-2 text-arthaflow-teal" />
          Your Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Level {userPoints.level}</h3>
            <span className="text-sm text-muted-foreground">{userPoints.points} total points</span>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to Level {userPoints.level + 1}</span>
              <span className="text-muted-foreground">
                {userPoints.points % pointsToNextLevel} / {pointsToNextLevel} points
              </span>
            </div>
            <Progress 
              value={progressToNextLevel}
              className="h-2"
              indicatorColor="bg-arthaflow-teal"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-3">Badges Earned ({userBadges.length})</h3>
          
          {userBadges.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>No badges earned yet</p>
              <p className="text-sm">Complete challenges to earn badges</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userBadges.map((badge) => (
                <div 
                  key={badge.id} 
                  className="flex flex-col items-center p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-center"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    {renderBadgeIcon(badge.icon)}
                  </div>
                  <h4 className="font-medium text-sm">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{badge.category}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserAchievements;
