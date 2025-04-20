import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  amount: string;
  icon?: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  amount, 
  icon, 
  description, 
  trend = "neutral",
  className
}) => {  
  // Get gradient based on trend
  const getGradient = () => {
    if (trend === "up") {
      return "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-900/20";
    } else if (trend === "down") {
      return "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-900/20";
    } else {
      return "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20";
    }
  };

  // Get border color based on trend
  const getBorder = () => {
    if (trend === "up") {
      return "border-green-200 dark:border-green-800";
    } else if (trend === "down") {
      return "border-red-200 dark:border-red-800";
    } else {
      return "border-gray-200 dark:border-gray-800";
    }
  };

  // Get text color based on trend
  const getTextColor = () => {
    if (trend === "up") {
      return "text-green-600 dark:text-green-400";
    } else if (trend === "down") {
      return "text-red-600 dark:text-red-400";
    } else {
      return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300", 
        getGradient(),
        getBorder(),
        "hover:shadow-lg hover:translate-y-[-2px]",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{title}</span>
          {icon && <div className="rounded-full bg-background/80 p-1 backdrop-blur-sm">{icon}</div>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">
            {amount}
          </div>
          {description && (
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{description}</span>
              {trend === "up" && <TrendingUp className="ml-1 h-3 w-3 text-green-500" />}
              {trend === "down" && <TrendingDown className="ml-1 h-3 w-3 text-red-500" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
