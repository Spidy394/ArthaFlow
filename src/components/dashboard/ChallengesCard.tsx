
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Target, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

type Challenge = Tables<"challenges">;

const ChallengesCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch active challenges from database
  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ['active-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('end_date', { ascending: true })
        .limit(3);
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getCategoryColor = (category: string) => {
    const categories: Record<string, string> = {
      "Savings": "bg-green-100 text-green-800",
      "Budget": "bg-blue-100 text-blue-800",
      "Expense": "bg-red-100 text-red-800",
      "Investment": "bg-purple-100 text-purple-800",
      "Behavioral": "bg-yellow-100 text-yellow-800",
    };
    
    return categories[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="col-span-1 md:col-span-2 h-96 overflow-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-arthaflow-teal" />
          Active Challenges
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/challenges")}>
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <p>Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>No active challenges</p>
            <p className="text-sm mb-4">Create a challenge to start earning points</p>
            <Button onClick={() => navigate("/challenges")}>Go to Challenges</Button>
          </div>
        ) : (
          challenges.map((challenge) => {
            const percentage = Math.min(Math.round(((challenge.current_amount || 0) / (challenge.target_amount || 1)) * 100), 100);
            const daysLeft = getDaysRemaining(challenge.end_date);
            
            return (
              <div 
                key={challenge.id} 
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <Badge variant="outline" className={cn("ml-2", getCategoryColor(challenge.category))}>
                    {challenge.category}
                  </Badge>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="text-muted-foreground">
                      ₹{(challenge.current_amount || 0).toFixed(0)} / ₹{challenge.target_amount.toFixed(0)}
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2" 
                    indicatorColor="bg-arthaflow-teal"
                  />
                </div>
                
                <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" /> {daysLeft} days left
                  </div>
                  <div className="flex items-center">
                    {challenge.points_reward} points reward
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default ChallengesCard;
