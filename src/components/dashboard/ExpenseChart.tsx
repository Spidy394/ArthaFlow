import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Import the custom Chart component
import { Chart } from "@/components/ui/chart";

interface ExpenseChartProps {
  className?: string;
  period?: 'week' | 'month' | 'year';
}

// Define the chart config type
interface ChartConfig {
  type: 'pie' | 'bar' | 'line';
  options?: Record<string, any>;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ className, period: initialPeriod = 'month' }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>(initialPeriod);
  
  // Update internal period state when prop changes
  useEffect(() => {
    if (initialPeriod !== period) {
      setPeriod(initialPeriod);
    }
  }, [initialPeriod]);

  // Fetch transactions data
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id, period],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
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
        .eq('type', 'expense')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', now.toISOString());
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user,
  });

  // Prepare data for pie chart
  const expenseData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(transaction.amount);
    });
    
    // Sort by amount (highest first) and convert to array
    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Generate colors for pie chart
  const COLORS = ['#6E59A5', '#0EA5E9', '#9B87F5', '#4A3D7C', '#F97316', '#10B981', '#F43F5E', '#8B5CF6'];

  const getColor = (index: number) => {
    return COLORS[index % COLORS.length];
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Calculate total expenses
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);

  // Define chart configuration for the Chart component
  const chartConfig: ChartConfig = {
    type: 'pie',
    options: {
      // Any additional options for the chart
      responsive: true,
      maintainAspectRatio: false,
    }
  };
  
  // Handle period change
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    if (newPeriod !== period) {
      setPeriod(newPeriod);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn("col-span-1 md:col-span-2 h-96 overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg", className)}>
        <CardHeader className="bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-arthaflow-purple" />
              <span className="bg-gradient-to-r from-arthaflow-purple to-arthaflow-teal bg-clip-text text-transparent">
                Expense Breakdown
              </span>
            </CardTitle>
            <Select 
              value={period}
              onValueChange={(value: 'week' | 'month' | 'year') => handlePeriodChange(value)}
            >
              <SelectTrigger className="w-[120px] border-arthaflow-purple/20 hover:border-arthaflow-purple/40 transition-colors">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="relative h-[270px] p-6">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-arthaflow-purple" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-muted-foreground">Error loading expense data</p>
            </div>
          ) : expenseData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <Wallet className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No expense data available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Background decorative element */}
              <div className="absolute -z-10 right-0 bottom-0 h-48 w-48 rounded-full bg-gradient-to-r from-arthaflow-purple/5 to-arthaflow-teal/5 blur-xl opacity-70"></div>
              
              <Chart config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Chart>
            </div>
          )}
          
          {expenseData.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Total Expenses: <span className="font-semibold bg-gradient-to-r from-arthaflow-purple to-arthaflow-teal bg-clip-text text-transparent">{formatCurrency(totalExpenses)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseChart;
