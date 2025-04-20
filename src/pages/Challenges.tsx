
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { challengeSchema } from "@/lib/validations";
import { Trophy, Calendar as CalendarIcon, Plus, Target, AlertCircle, ArrowUpRight, Check, CheckCircle, ChevronRight, Clock, Flame, Gift, LucideIcon, RefreshCcw } from "lucide-react";

// Challenge interface
interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'failed';
  points_reward: number;
  created_at: string;
  user_id: string;
}

// Define category options
const CATEGORY_OPTIONS = [
  { value: "Savings", label: "Savings" },
  { value: "Expense Reduction", label: "Expense Reduction" },
  { value: "Investment", label: "Investment" },
  { value: "Income", label: "Income" },
  { value: "Debt Reduction", label: "Debt Reduction" }
];

// Helper function to format dates
const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "PPP");
};

// Helper function to calculate days remaining
const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Helper function to calculate progress percentage
const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

// Component to display each challenge card
const ChallengeCard = ({ 
  challenge, 
  onUpdateProgress,
  onMarkComplete
}: { 
  challenge: Challenge;
  onUpdateProgress: (id: string, amount: number) => void;
  onMarkComplete: (id: string) => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressAmount, setProgressAmount] = useState("");
  const daysRemaining = calculateDaysRemaining(challenge.end_date);
  const progress = calculateProgress(challenge.current_amount, challenge.target_amount);
  const isCompleted = challenge.status === 'completed';
  const isFailed = challenge.status === 'failed';
  const isActive = challenge.status === 'active';
  
  const handleUpdate = () => {
    if (!progressAmount || isNaN(Number(progressAmount))) return;
    
    setIsUpdating(false);
    onUpdateProgress(challenge.id, Number(progressAmount));
    setProgressAmount("");
  };
  
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{challenge.title}</CardTitle>
            <CardDescription className="mt-1">{challenge.description}</CardDescription>
          </div>
          <Badge 
            variant={
              isCompleted ? "success" : 
              isFailed ? "destructive" : 
              "outline"
            }
          >
            {isCompleted ? "Completed" : isFailed ? "Failed" : `${daysRemaining} days left`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Target</p>
              <p className="font-semibold">{formatCurrency(challenge.target_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current</p>
              <p className="font-semibold">{formatCurrency(challenge.current_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{challenge.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reward</p>
              <p className="font-medium flex items-center">
                <Trophy className="h-4 w-4 mr-1 text-amber-500" /> 
                {challenge.points_reward} pts
              </p>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span>{formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {isActive ? (
          isUpdating ? (
            <div className="flex w-full space-x-2">
              <Input
                type="number"
                placeholder="Amount"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleUpdate}>Update</Button>
              <Button size="sm" variant="outline" onClick={() => setIsUpdating(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex w-full space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setIsUpdating(true)}
              >
                Update Progress
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onMarkComplete(challenge.id)}
                disabled={progress < 100}
              >
                Mark Complete
              </Button>
            </div>
          )
        ) : (
          <div className="w-full flex justify-end">
            <Badge variant={isCompleted ? "success" : "destructive"} className="ml-auto text-xs py-1 px-2">
              {isCompleted ? (
                <span className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" /> Completed on {formatDate(challenge.end_date)}
                </span>
              ) : (
                <span>Failed to complete</span>
              )}
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

// New Challenge Form
const NewChallengeForm = ({ onCreateChallenge }: { onCreateChallenge: (data: any) => void }) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  
  // Initialize react-hook-form with zod validation
  const form = useForm({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      target_amount: "",
      points_reward: "10",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }
  });

  // Handle date changes
  useEffect(() => {
    form.setValue('start_date', startDate.toISOString());
  }, [startDate, form]);

  useEffect(() => {
    form.setValue('end_date', endDate.toISOString());
  }, [endDate, form]);
  
  // Submit handler
  const onSubmit = (data: any) => {
    onCreateChallenge(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Challenge Title</FormLabel>
              <FormControl>
                <Input placeholder="Save for vacation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Save ₹10,000 for my summer vacation to Goa" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="target_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="10000" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {startDate ? format(startDate, "PPP") : "Select date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="end_date"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {endDate ? format(endDate, "PPP") : "Select date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      disabled={(date) => date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="points_reward"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points Reward</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="10" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Set how many points you'll earn for completing this challenge
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">Create Challenge</Button>
      </form>
    </Form>
  );
};

// Main Challenges page component
const Challenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("active");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch user challenges
  const { 
    data: challenges = [], 
    isLoading,
    refetch: refetchChallenges 
  } = useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!user,
  });

  // Fetch user points
  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Create user points record if it doesn't exist
          const { data: newData, error: insertError } = await supabase
            .from('user_points')
            .insert([{ user_id: user.id, points: 0, level: 1 }])
            .select('*')
            .single();
          
          if (insertError) throw insertError;
          return newData;
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });
  
  // Filter challenges based on active tab
  const filteredChallenges = challenges.filter(challenge => {
    if (activeTab === "active") return challenge.status === "active";
    if (activeTab === "completed") return challenge.status === "completed";
    if (activeTab === "failed") return challenge.status === "failed";
    return true;
  });
  
  // Handle challenge creation
  const handleCreateChallenge = async (data: any) => {
    try {
      if (!user?.id) throw new Error("No user found");
      
      const { error } = await supabase
        .from('challenges')
        .insert([{
          ...data,
          user_id: user.id,
          current_amount: 0,
          status: 'active'
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Challenge Created",
        description: "Your new challenge has been created successfully.",
      });
      
      setIsCreateDialogOpen(false);
      refetchChallenges();
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle updating challenge progress
  const handleUpdateProgress = async (id: string, amount: number) => {
    try {
      if (!user?.id) return;
      
      // Get current challenge data
      const { data: challengeData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const updatedAmount = challengeData.current_amount + amount;
      const isCompleted = updatedAmount >= challengeData.target_amount;
      
      // Update challenge
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ 
          current_amount: updatedAmount,
          status: isCompleted ? 'completed' : 'active'
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Award points if challenge completed
      if (isCompleted) {
        await awardChallengePoints(id, challengeData.points_reward);
      }
      
      toast({
        title: "Progress Updated",
        description: `Your progress has been updated to ${formatCurrency(updatedAmount)}.`,
      });
      
      refetchChallenges();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle marking a challenge as complete
  const handleMarkComplete = async (id: string) => {
    try {
      if (!user?.id) return;
      
      // Get challenge data
      const { data: challengeData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update challenge status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ 
          status: 'completed',
          current_amount: challengeData.target_amount // Set to target amount
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Award points
      await awardChallengePoints(id, challengeData.points_reward);
      
      toast({
        title: "Challenge Completed",
        description: `Congratulations! You've earned ${challengeData.points_reward} points.`,
      });
      
      refetchChallenges();
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast({
        title: "Error",
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Helper function to award points
  const awardChallengePoints = async (challengeId: string, points: number) => {
    if (!user?.id || !points) return;
    
    try {
      // Update user points
      if (userPoints) {
        const newTotal = userPoints.points + points;
        const newLevel = Math.floor(newTotal / 100) + 1;
        
        await supabase
          .from('user_points')
          .update({ 
            points: newTotal,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error("Error awarding points:", error);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Challenges</h1>
            <p className="text-muted-foreground mt-1">
              Create personal financial challenges to build better habits
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
                <DialogDescription>
                  Set a financial goal with a deadline to challenge yourself
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="max-h-[500px] mt-4">
                <NewChallengeForm onCreateChallenge={handleCreateChallenge} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
            <TabsTrigger value="failed" className="flex-1">Failed</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="w-full h-64 animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="h-2 bg-muted rounded w-full" />
                        <div className="grid grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j}>
                              <div className="h-3 bg-muted rounded w-1/2 mb-1" />
                              <div className="h-4 bg-muted rounded w-3/4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredChallenges.length === 0 ? (
              <Alert>
                <AlertTitle className="flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  No {activeTab} challenges found
                </AlertTitle>
                <AlertDescription>
                  {activeTab === "active" ? (
                    <>
                      You don't have any active challenges. Create a new challenge to start improving your finances!
                    </>
                  ) : activeTab === "completed" ? (
                    <>
                      You haven't completed any challenges yet. Keep working on your active challenges!
                    </>
                  ) : activeTab === "failed" ? (
                    <>
                      Good news! You haven't failed any challenges yet. Keep up the good work!
                    </>
                  ) : (
                    <>
                      You don't have any challenges yet. Create your first financial challenge to get started!
                    </>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard 
                    key={challenge.id} 
                    challenge={challenge} 
                    onUpdateProgress={handleUpdateProgress}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Challenges;
