import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import SpendingTrendChart from "@/components/dashboard/SpendingTrendChart";
import BudgetProgressCard from "@/components/dashboard/BudgetProgressCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import CsvUploadCard from "@/components/dashboard/CsvUploadCard";
import TransactionForm from "@/components/transactions/TransactionForm";
import ChallengesCard from "@/components/dashboard/ChallengesCard";
import UserAchievements from "@/components/dashboard/UserAchievements";
import AiSuggestionsCard from "@/components/dashboard/AiSuggestionsCard";
import { Wallet, TrendingUp, PiggyBank, CreditCard, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
}

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
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: 'expense-reduction' | 'savings-increase' | 'behavioral-insight' | 'budget-adjustment';
  impact: 'low' | 'medium' | 'high';
}

// Helper component for loading states
const LoadingCard = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm p-6 ${className}`}>
    <div className="space-y-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-12 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Helper component for error states
const ErrorCard = ({ 
  message, 
  retry 
}: { 
  message: string; 
  retry: () => void 
}) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="flex flex-col gap-2">
      <p>{message}</p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={retry} 
        className="w-fit"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
);

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return `₹${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const Index: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Function to refresh all dashboard data
  const refreshData = async () => {
    // Invalidate all key queries that affect financial overview cards
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['budgets'] });
    await queryClient.invalidateQueries({ queryKey: ['monthly-transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['spending-trends'] });
    await queryClient.invalidateQueries({ queryKey: ['challenges'] });
    
    toast({
      title: "Data refreshed",
      description: "Your financial dashboard has been updated.",
    });
  };
  
  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch transactions data
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['transactions', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Calculate date range based on selection
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', now.toISOString())
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(t => ({
        id: t.id,
        description: t.description || '',
        amount: t.amount,
        date: new Date(t.transaction_date).toLocaleDateString(),
        category: t.category,
        type: t.type
      }));
    },
    enabled: !!user,
  });
  // Fetch budget categories data
  const { 
    data: budgetCategories = [], 
    isLoading: isLoadingBudgets,
    error: budgetsError,
    refetch: refetchBudgets
  } = useQuery({
    queryKey: ['budgets', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Calculate spent amount per category from transactions
      return data.map(budget => {
        const spent = transactions
          .filter(t => t.category === budget.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          id: budget.id,
          name: budget.category,
          budget: budget.target_amount,
          spent: spent,
          color: getRandomColor(budget.category),
        };
      });
    },
    enabled: !!user && transactions.length > 0,
  });
  // Fetch challenges data
  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      // Mock API call for challenges until the actual table is available
      return [
        {
          id: '1',
          title: 'Save 10% of your income',
          description: 'Save at least 10% of your monthly income',
          category: 'Savings',
          target_amount: 5000,
          current_amount: 2500,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          points_reward: 50,
        },
        {
          id: '2',
          title: 'Reduce dining expenses',
          description: 'Keep your dining expenses under ₹3000 this month',
          category: 'Expense',
          target_amount: 3000,
          current_amount: 1200,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          points_reward: 30,
        }
      ] as Challenge[];
    },
    enabled: !!user,
  });

  // Fetch user points and badges
  const { data: userPoints = { points: 120, level: 2 } } = useQuery({
    queryKey: ['points', user?.id],
    queryFn: async () => {
      // Mock user points - will be replaced with actual API call
      return { points: 120, level: 2 };
    },
    enabled: !!user,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: async () => {
      // Mock badges - will be replaced with actual API call
      return [
        {
          id: '1',
          name: 'Budget Master',
          description: 'Stayed under budget for 3 consecutive months',
          icon: 'award',
          category: 'Budget',
          awarded_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Smart Saver',
          description: 'Saved over 20% of income',
          icon: 'star',
          category: 'Savings',
          awarded_at: new Date().toISOString(),
        }
      ];
    },
    enabled: !!user,
  });

  // Generate AI suggestions based on transaction data
  const { data: aiSuggestions = [] } = useQuery({
    queryKey: ['suggestions', transactions.length],
    queryFn: async () => {
      // Generate AI-based suggestions from transaction patterns
      // This would eventually connect to an actual AI-powered service
      
      // Mock suggestions for now
      return [
        {
          id: '1',
          title: 'Reduce dining out expenses',
          description: 'You spent ₹4,200 on dining out last month. Consider cooking at home more often to save around ₹1,500 monthly.',
          type: 'expense-reduction',
          impact: 'medium',
        },
        {
          id: '2',
          title: 'Set up automatic savings',
          description: 'Based on your income patterns, you could automatically transfer ₹3,000 to savings each month without affecting your lifestyle.',
          type: 'savings-increase',
          impact: 'high',
        },
        {
          id: '3',
          title: 'Weekend spending pattern detected',
          description: 'You tend to spend 40% more on weekends. Consider planning weekend activities in advance to control impulse spending.',
          type: 'behavioral-insight',
          impact: 'medium',
        }
      ] as Suggestion[];
    },
    enabled: transactions.length > 0,
  });

  // Calculate monthly metrics from actual transactions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  // Prepare data for expense chart
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const expenseData = Object.entries(expensesByCategory).map(([name, value], index) => ({
    name,
    value,
    color: getRandomColor(name),
  }));

  // Prepare data for spending trend chart
  const spendingTrendData = generateSpendingTrendData();

  // Handle join challenge action
  const handleJoinChallenge = (id: string) => {
    toast({
      title: "Challenge Joined",
      description: "You've successfully joined the challenge.",
    });
  };

  // Handle AI suggestion action
  const handleSaveAction = (id: string) => {
    toast({
      title: "Action Saved",
      description: "The financial action has been added to your goals.",
    });
  };

  // Helper function to get consistent colors for categories
  function getRandomColor(seed: string) {
    const colors = [
      "#6E59A5",
      "#0EA5E9",
      "#9B87F5",
      "#4A3D7C",
      "#F97316",
      "#10B981",
      "#F43F5E",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
    ];
    
    // Simple hash function to get consistent colors for the same category
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // Generate mock spending trend data
  function generateSpendingTrendData() {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const currentMonth = new Date().getMonth();
    
    return months
      .slice(Math.max(0, currentMonth - 5), currentMonth + 1)
      .map((month, index) => {
        // Generate some realistic looking data with a general upward trend for income
        // and some variation in expenses
        const baseIncome = 10000 + index * 200;
        const income = baseIncome + Math.random() * 1000;
        
        const baseExpense = 7000 + Math.random() * 2000;
        const spending = baseExpense - index * 100; // Slight downward trend in expenses
        
        return {
          name: month,
          income: income,
          spending: spending
        };
      });
  }
  // Determine if there are any loading or error states
  const isLoading = isLoadingTransactions || isLoadingBudgets;
  const hasError = transactionsError || budgetsError;

  // Calculate previous month metrics for comparison
  const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const previousMonthEnd = new Date(currentYear, currentMonth, 0);
  
  const previousMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= previousMonthStart && transactionDate <= previousMonthEnd;
  });

  const previousIncome = previousMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const previousExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Render different content based on current path
  const renderContent = () => {
    switch (currentPath) {
      case "/dashboard":
        return (
          <>
            {/* Dashboard Overview */}
            {renderFinancialOverview()}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-12">
                <SpendingTrendChart period={dateRange} />
              </div>
            </div>
            
            {/* AI suggestions and transactions row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <AiSuggestionsCard 
                  suggestions={aiSuggestions} 
                  onSaveAction={handleSaveAction} 
                />
              </div>
              <div className="md:col-span-2">
                <RecentTransactions transactions={transactions.slice(0, 5)} />
              </div>
            </div>
          </>
        );
      
      case "/transactions":
        return (
          <>
            {renderFinancialOverview()}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-12 md:col-span-6">
                <RecentTransactions transactions={transactions} />
              </div>
              <div className="col-span-12 md:col-span-6 space-y-4">
                <TransactionForm />
                <CsvUploadCard />
              </div>
            </div>
          </>
        );
      
      case "/budgets":
        return (
          <>
            {renderFinancialOverview()}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-6">
                <ExpenseChart period={dateRange} />
              </div>
              <div className="col-span-6">
                <BudgetProgressCard period={dateRange} />
              </div>
            </div>
          </>
        );
      
      case "/trends":
        return (
          <>
            {renderFinancialOverview()}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-12">
                <SpendingTrendChart period={dateRange} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-6">
                <ExpenseChart period={dateRange} />
              </div>
              <div className="col-span-6">
                <AiSuggestionsCard 
                  suggestions={aiSuggestions} 
                  onSaveAction={handleSaveAction} 
                />
              </div>
            </div>
          </>
        );
      
      case "/goals":
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4">Financial Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-6">
                <BudgetProgressCard period={dateRange} />
              </div>
              <div className="col-span-6">
                <AiSuggestionsCard 
                  suggestions={aiSuggestions} 
                  onSaveAction={handleSaveAction}
                />
              </div>
            </div>
          </>
        );
      
      case "/upload":
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4">Upload Financial Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-12 md:col-span-6">
                <CsvUploadCard />
              </div>
            </div>
          </>
        );
      
      default:
        // Full dashboard as fallback
        return (
          <>
            {/* Dashboard Overview */}
            {renderFinancialOverview()}
            
            {/* Visualization row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-12">
                <SpendingTrendChart period={dateRange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className="col-span-6">
                <ExpenseChart period={dateRange} />
              </div>
              <div className="col-span-6">
                <BudgetProgressCard period={dateRange} />
              </div>
            </div>

            {/* Gamification row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <ChallengesCard 
                  challenges={challenges} 
                  onJoinChallenge={handleJoinChallenge} 
                />
              </div>
              <div className="md:col-span-2">
                <UserAchievements 
                  points={userPoints.points} 
                  level={userPoints.level} 
                  badges={userBadges} 
                />
              </div>
            </div>

            {/* AI suggestions and transactions row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <AiSuggestionsCard 
                  suggestions={aiSuggestions} 
                  onSaveAction={handleSaveAction} 
                />
              </div>
              <div className="md:col-span-2">
                <RecentTransactions transactions={transactions.slice(0, 5)} />
              </div>
            </div>

            {/* Transactions input row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2 space-y-4">
                <TransactionForm />
                <CsvUploadCard />
              </div>
            </div>
          </>
        );
    }
  };

  // Helper function to render financial overview section
  const renderFinancialOverview = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      );
    }
    
    if (hasError) {
      return (
        <div className="mb-6">
          <ErrorCard 
            message="Failed to load financial overview" 
            retry={() => {
              refetchTransactions();
              refetchBudgets();
            }} 
          />
        </div>
      );
    }
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Financial Overview</h2>
          <Select
            value={dateRange}
            onValueChange={(value: 'week' | 'month' | 'year') => setDateRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Income"
            amount={formatCurrency(totalIncome)}
            icon={<TrendingUp className="h-4 w-4 text-green-500" />}
            description={`${totalIncome > previousIncome ? '+' : ''}${Math.abs(((totalIncome / (previousIncome || 1) - 1) * 100)).toFixed(1)}% vs. last month`}
            trend={totalIncome > previousIncome ? 'up' : 'down'}
          />
          
          <StatCard
            title="Monthly Expenses"
            amount={formatCurrency(totalExpenses)}
            icon={<TrendingDown className="h-4 w-4 text-red-500" />}
            description={`${totalExpenses < previousExpenses ? '-' : '+'}${Math.abs(((totalExpenses / (previousExpenses || 1) - 1) * 100)).toFixed(1)}% vs. last month`}
            trend={totalExpenses < previousExpenses ? 'up' : 'down'}
          />
          
          <StatCard
            title="Savings Rate"
            amount={`${savingsRate}%`}
            icon={<PiggyBank className="h-4 w-4 text-purple-500" />}
            description={`Target: 20%`}
            trend={savingsRate >= 20 ? 'up' : 'down'}
          />
          
          <StatCard
            title="Budget Status"
            amount={formatCurrency(Math.max(0, totalIncome - totalExpenses))}
            icon={<Wallet className="h-4 w-4 text-blue-500" />}
            description={`${totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0}% of income spent`}
            trend={totalIncome > 0 && totalExpenses / totalIncome <= 0.8 ? 'up' : 'down'}
          />
        </div>
      </div>
    );
  };

  // Get page title based on current path
  const getPageTitle = () => {
    switch (currentPath) {
      case "/dashboard":
        return "Dashboard";
      case "/transactions":
        return "Transactions";
      case "/budgets":
        return "Budget Management";
      case "/trends":
        return "Financial Trends";
      case "/goals":
        return "Financial Goals";
      case "/upload":
        return "Upload Data";
      default:
        return "Financial Dashboard";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        <p className="text-muted-foreground">
          {currentPath === "/dashboard" 
            ? "Track your income, expenses, and savings at a glance" 
            : `Manage your ${getPageTitle().toLowerCase()} and financial data`
          }
        </p>
        
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Index;
