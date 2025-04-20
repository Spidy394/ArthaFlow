import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, AlertCircle, Loader2, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chart } from "@/components/ui/chart";
import { motion } from "framer-motion";

interface SpendingTrendChartProps {
  className?: string;
  period?: 'week' | 'month' | 'year';
}

// Define the chart config type
interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  options?: Record<string, any>;
}

const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ className, period: initialPeriod = 'month' }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>(initialPeriod);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { user } = useAuth();

  // Fetch transaction data
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id, period],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          // Get data for the last 6 months
          startDate.setMonth(now.getMonth() - 5, 1);
          break;
        case 'year':
          // Get data for the last year
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', now.toISOString())
        .order('transaction_date', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user,
  });

  // Prepare data for the trend chart
  const chartData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Create date groups based on period
    const dateFormat = period === 'week' ? 'day' : period === 'month' ? 'week' : 'month';
    const groupedData: Record<string, { income: number; spending: number }> = {};
    
    // Get month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      let groupKey;
      
      if (dateFormat === 'day') {
        // Format as "Mon 01" (day of week + day of month)
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        groupKey = `${dayOfWeek} ${date.getDate()}`;
      } else if (dateFormat === 'week') {
        // Format as "Week 1 Apr" (week number + month)
        const weekNumber = Math.ceil(date.getDate() / 7);
        groupKey = `W${weekNumber} ${monthNames[date.getMonth()]}`;
      } else {
        // Format as month name
        groupKey = monthNames[date.getMonth()];
      }
      
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = { income: 0, spending: 0 };
      }
      
      if (transaction.type === 'income') {
        groupedData[groupKey].income += transaction.amount;
      } else {
        groupedData[groupKey].spending += Math.abs(transaction.amount);
      }
    });
    
    // Convert to array and sort by date
    const keys = Object.keys(groupedData);
    
    // Different sorting logic based on period
    if (dateFormat === 'day') {
      // Sort days of week
      const dayOrder = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
      keys.sort((a, b) => {
        const dayA = a.split(' ')[0];
        const dayB = b.split(' ')[0];
        return dayOrder[dayA as keyof typeof dayOrder] - dayOrder[dayB as keyof typeof dayOrder];
      });
    } else if (dateFormat === 'week') {
      // Sort weeks
      keys.sort((a, b) => {
        const weekA = parseInt(a.split(' ')[0].substring(1));
        const weekB = parseInt(b.split(' ')[0].substring(1));
        const monthA = a.split(' ')[1];
        const monthB = b.split(' ')[1];
        const monthOrderA = monthNames.indexOf(monthA);
        const monthOrderB = monthNames.indexOf(monthB);
        
        if (monthOrderA !== monthOrderB) {
          return monthOrderA - monthOrderB;
        }
        return weekA - weekB;
      });
    } else {
      // Sort months
      keys.sort((a, b) => {
        return monthNames.indexOf(a) - monthNames.indexOf(b);
      });
    }
    
    return keys.map(key => ({
      name: key,
      income: groupedData[key].income,
      spending: groupedData[key].spending,
      savings: groupedData[key].income - groupedData[key].spending
    }));
  }, [transactions, period]);

  // Get summary statistics
  const financialSummary = React.useMemo(() => {
    if (chartData.length === 0) {
      return {
        totalIncome: 0,
        totalSpending: 0,
        totalSavings: 0,
        savingsRate: 0,
        trend: 'neutral' as 'up' | 'down' | 'neutral'
      };
    }
    
    const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
    const totalSpending = chartData.reduce((sum, item) => sum + item.spending, 0);
    const totalSavings = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
    
    // Determine trend by comparing first and last periods
    const firstPeriodSavings = chartData[0].income - chartData[0].spending;
    const lastPeriodSavings = chartData[chartData.length - 1].income - chartData[chartData.length - 1].spending;
    const trend = lastPeriodSavings > firstPeriodSavings ? 'up' : lastPeriodSavings < firstPeriodSavings ? 'down' : 'neutral';
    
    return {
      totalIncome,
      totalSpending,
      totalSavings,
      savingsRate,
      trend
    };
  }, [chartData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as 'week' | 'month' | 'year');
  };

  // Handle mouse hover on chart
  const handleMouseMove = (state: any) => {
    if (state.activeTooltipIndex !== undefined) {
      setActiveIndex(state.activeTooltipIndex);
    }
  };

  // Handle mouse leave from chart
  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Define custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg border shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 bg-[#10B981] rounded-full mr-2"></span>
              Income: <span className="ml-1 font-medium">{formatCurrency(payload[0].value)}</span>
            </p>
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 bg-[#F43F5E] rounded-full mr-2"></span>
              Spending: <span className="ml-1 font-medium">{formatCurrency(payload[1].value)}</span>
            </p>
            <p className="text-xs flex items-center font-medium text-arthaflow-teal pt-1 border-t mt-1">
              Savings: {formatCurrency(payload[0].value - payload[1].value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn("col-span-1 md:col-span-2 overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg", className)}>
        <CardHeader className="bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-arthaflow-purple" />
              <span className="bg-gradient-to-r from-arthaflow-purple to-arthaflow-teal bg-clip-text text-transparent">
                Income vs. Spending
              </span>
            </CardTitle>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[120px] border-arthaflow-purple/20 hover:border-arthaflow-purple/40 transition-colors">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">Last 6 Months</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                Total Income
              </div>
              <div className="text-lg font-bold text-green-700">
                {formatCurrency(financialSummary.totalIncome)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-3 rounded-lg border border-red-100">
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-red-500" />
                Total Spending
              </div>
              <div className="text-lg font-bold text-red-700">
                {formatCurrency(financialSummary.totalSpending)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-100">
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                {financialSummary.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                ) : financialSummary.trend === 'down' ? (
                  <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
                ) : (
                  <span className="h-3 w-3 mr-1" />
                )}
                Savings Rate
              </div>
              <div className="text-lg font-bold text-arthaflow-purple">
                {financialSummary.savingsRate}%
              </div>
            </div>
          </div>

          {/* Chart section */}
          <div className="h-80 relative z-0"> {/* Increased height from h-64 to h-80 and added z-0 to establish a stacking context */}
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-arthaflow-purple" />
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                <p className="text-muted-foreground">Error loading trend data</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No transaction data available</p>
              </div>
            ) : (
              <div className="relative h-full"> {/* Added h-full to ensure the container takes full height */}
                {/* Background decorative element */}
                <div className="absolute -z-10 left-0 bottom-0 h-48 w-48 rounded-full bg-gradient-to-r from-arthaflow-purple/5 to-arthaflow-teal/5 blur-xl opacity-70"></div>
                
                <ResponsiveContainer width="100%" height="100%"> {/* Ensure this takes full height */}
                  <AreaChart 
                    data={chartData} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${value / 1000}k`} 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      name="Income" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="spending" 
                      name="Spending" 
                      stroke="#F43F5E" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSpending)"
                      activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Data insights section */}
          {!isLoading && !error && chartData.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-arthaflow-purple"></span>
                <span>
                  {financialSummary.savingsRate >= 20 ? (
                    "Great job! Your savings rate is excellent."
                  ) : financialSummary.savingsRate >= 10 ? (
                    "Good progress on your savings rate."
                  ) : (
                    "Consider reducing expenses to improve your savings rate."
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SpendingTrendChart;
