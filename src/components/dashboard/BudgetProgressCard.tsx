import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Wallet } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Budget = Tables<"budgets">;
type Transaction = Tables<"transactions">;

import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { DatabaseService } from "@/services/database";

interface BudgetProgressCardProps {
  period?: 'week' | 'month' | 'year';
}

const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({ period = 'month' }) => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  // Fetch budgets using DatabaseService
  const { 
    data: budgets = [], 
    isLoading: isLoadingBudgets, 
    error: budgetsError,
    refetch: refetchBudgets
  } = useQuery({
    queryKey: ['budgets', user?.id, period],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const result = await DatabaseService.fetchUserData<Budget>('budgets', user.id);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user,
  });

  // Fetch transactions for current month using DatabaseService
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['monthly-transactions', user?.id, period],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date();
          startDate.setDate(now.getDate() - 7);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      const firstDay = startDate.toISOString();
      const lastDay = now.toISOString();
      
      const result = await DatabaseService.fetchUserData<Transaction>('transactions', user.id, {
        filters: {
          type: 'expense',
        }
      });
      
      if (result.error) throw result.error;
      
      // Filter by date client-side since the filters object doesn't support complex date queries
      const filteredTransactions = result.data ? result.data.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= new Date(firstDay) && transactionDate <= new Date(lastDay);
      }) : [];
      
      return filteredTransactions;
    },
    enabled: !!user,
  });
  
  // Handle errors
  if (budgetsError || transactionsError) {
    const error = budgetsError || transactionsError;
    handleError(error, "Failed to load budget data");
    return (
      <Card className="col-span-1 md:col-span-2 h-96 overflow-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-arthaflow-teal" />
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay 
            message="Failed to load budget data" 
            retry={() => {
              refetchBudgets();
              refetchTransactions();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate spending by category
  const spendingByCategory: Record<string, number> = {};
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      const { category, amount } = transaction;
      spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
    });
  }

  // Calculate budget progress
  const budgetWithProgress = Array.isArray(budgets) ? budgets.map(budget => {
    const spent = spendingByCategory[budget.category] || 0;
    const percentage = Math.min(Math.round((spent / budget.target_amount) * 100), 100);
    const remaining = Math.max(budget.target_amount - spent, 0);
    
    return {
      ...budget,
      spent,
      percentage,
      remaining
    };
  }) : [];

  // Sort budgets by percentage (highest first)
  const sortedBudgets = [...budgetWithProgress].sort((a, b) => b.percentage - a.percentage);

  // Get overall budget status
  const totalBudget = Array.isArray(budgets) ? budgets.reduce((sum, budget) => sum + budget.target_amount, 0) : 0;
  const totalSpent = Array.isArray(transactions) ? transactions.reduce((sum, transaction) => sum + transaction.amount, 0) : 0;
  const overallPercentage = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  if (isLoadingBudgets || isLoadingTransactions) {
    return (
      <Card className="col-span-1 md:col-span-2 h-96 overflow-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-arthaflow-teal" />
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <p>Loading budget data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2 h-96 overflow-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-arthaflow-teal" />
          Budget Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!budgets || budgets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <PieChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>No budgets set up yet</p>
            <p className="text-sm">Create budget categories to track your spending</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Budget</span>
                <span className="text-muted-foreground">
                  ₹{totalSpent.toFixed(0)} / ₹{totalBudget.toFixed(0)}
                </span>
              </div>
              <Progress value={overallPercentage} className="h-2" />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Categories</h3>
              {sortedBudgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{budget.category}</span>
                    <span className={budget.percentage >= 100 ? "text-red-500" : ""}>
                      ₹{budget.spent.toFixed(0)} / ₹{budget.target_amount.toFixed(0)}
                    </span>
                  </div>
                  <Progress 
                    value={budget.percentage} 
                    className="h-1.5" 
                    indicatorColor={
                      budget.percentage >= 100 ? "bg-red-500" : 
                      budget.percentage >= 80 ? "bg-yellow-500" : 
                      "bg-arthaflow-teal"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {budget.percentage >= 100 ? (
                      <span className="text-red-500">Over budget by ₹{(budget.spent - budget.target_amount).toFixed(0)}</span>
                    ) : (
                      `₹${budget.remaining.toFixed(0)} remaining`
                    )}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetProgressCard;
