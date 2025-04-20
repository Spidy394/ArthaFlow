
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Coffee,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Monitor,
  Bus,
  Wine,
  Wifi,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { DatabaseService } from "@/services/database";

type Transaction = Tables<"transactions">;

const RecentTransactions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();

  // Fetch recent transactions using DatabaseService
  const { 
    data: transactions = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const result = await DatabaseService.fetchUserData<Transaction>('transactions', user.id, {
        order: { column: 'transaction_date', ascending: false },
        limit: 5
      });
      
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user,
  });

  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, React.ReactNode> = {
      "Food": <Utensils className="h-4 w-4" />,
      "Coffee": <Coffee className="h-4 w-4" />,
      "Shopping": <ShoppingBag className="h-4 w-4" />,
      "Housing": <Home className="h-4 w-4" />,
      "Transport": <Car className="h-4 w-4" />,
      "Entertainment": <Monitor className="h-4 w-4" />,
      "Travel": <Bus className="h-4 w-4" />,
      "Dining": <Wine className="h-4 w-4" />,
      "Utilities": <Wifi className="h-4 w-4" />,
      "Groceries": <ShoppingCart className="h-4 w-4" />,
      "Salary": <Briefcase className="h-4 w-4" />,
    };
    
    return categoryIcons[category] || <ShoppingBag className="h-4 w-4" />;
  };

  const getAmountColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  // Handle error state
  if (error) {
    handleError(error, "Failed to load transactions");
    return (
      <Card className="col-span-1 md:col-span-2 h-96 overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay 
            message="Failed to load transactions" 
            retry={() => refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2 h-96 overflow-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <p>Loading transactions...</p>
          </div>
        ) : !Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>No transactions yet</p>
            <p className="text-sm">Add your first transaction to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    {getCategoryIcon(transaction.category)}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description || transaction.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="outline"
                    className="bg-muted/50"
                  >
                    {transaction.category}
                  </Badge>
                  <p className={`font-medium ${getAmountColor(transaction.type)}`}>
                    {transaction.type === 'income' ? (
                      <span className="flex items-center">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        ₹{transaction.amount.toFixed(0)}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        ₹{transaction.amount.toFixed(0)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
