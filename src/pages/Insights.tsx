import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Brain,
  TrendingDown,
  TrendingUp,
  Target,
  Search,
  DollarSign,
  Save,
  Filter,
  BarChart2,
  Sparkles,
  AlertCircle,
  MessageCircle,
  Settings,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OpenAIConfig } from "@/integrations/openai/config";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'expense-reduction' | 'savings-increase' | 'behavioral-insight' | 'budget-adjustment';
  impact: 'low' | 'medium' | 'high';
  date: string;
  saved: boolean;
}

const Insights: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('insights');

  // Fetch AI-generated insights based on user's transaction data
  const { data: insights = [], refetch } = useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      // This would fetch actual insights from an AI service in production
      // For now, using mock data
      return [
        {
          id: '1',
          title: 'Reduce dining out expenses',
          description: 'You spent ₹4,200 on dining out last month, which is 40% more than the previous month. Consider cooking at home more often to save around ₹1,500 monthly. Based on your transaction history, you typically dine out 3 times a week.',
          type: 'expense-reduction',
          impact: 'medium',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          saved: false
        },
        {
          id: '2',
          title: 'Set up automatic savings',
          description: 'Based on your income patterns, you could automatically transfer ₹3,000 to savings each month without affecting your lifestyle. This represents approximately 15% of your monthly income and could add up to ₹36,000 in savings per year.',
          type: 'savings-increase',
          impact: 'high',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          saved: true
        },
        {
          id: '3',
          title: 'Weekend spending pattern detected',
          description: 'You tend to spend 40% more on weekends. Consider planning weekend activities in advance to control impulse spending. Setting a weekend budget of ₹1,500 could potentially save you ₹2,000 per month.',
          type: 'behavioral-insight',
          impact: 'medium',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          saved: false
        },
        {
          id: '4',
          title: 'Entertainment budget exceeded',
          description: 'Your entertainment budget was exceeded by 35% this month. Consider adjusting your budget from ₹2,000 to ₹2,700 or finding more cost-effective entertainment options.',
          type: 'budget-adjustment',
          impact: 'low',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          saved: false
        },
        {
          id: '5',
          title: 'Subscription services optimization',
          description: 'You\'re spending ₹1,800 monthly on subscription services, some of which appear to be rarely used. Cancelling unused subscriptions could save approximately ₹850 per month.',
          type: 'expense-reduction',
          impact: 'high',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          saved: false
        },
        {
          id: '6',
          title: 'Potential for tax savings',
          description: 'Based on your income and expenses, you might be eligible for additional tax deductions. Consider investing in tax-saving instruments to potentially save up to ₹15,000 annually in taxes.',
          type: 'savings-increase',
          impact: 'high',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          saved: false
        }
      ] as Insight[];
    },
    enabled: !!user,
  });

  const handleSaveInsight = (id: string) => {
    // This would update the saved status in the database in production
    toast({
      title: "Insight Saved",
      description: "Financial insight has been saved to your action items.",
    });
    refetch();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense-reduction':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'savings-increase':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'behavioral-insight':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'budget-adjustment':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return "bg-blue-100 text-blue-800";
      case 'medium':
        return "bg-yellow-100 text-yellow-800";
      case 'high':
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'expense-reduction':
        return "Reduce Expenses";
      case 'savings-increase':
        return "Increase Savings";
      case 'behavioral-insight':
        return "Behavioral Insight";
      case 'budget-adjustment':
        return "Budget Adjustment";
      default:
        return type;
    }
  };

  // Filter insights based on search query and type filter
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = searchQuery === "" || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = selectedType === null || insight.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">AI Financial Insights</h1>
            <p className="text-muted-foreground">
              Personalized recommendations based on your spending patterns
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('settings')}
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              API Settings
            </Button>
            
            <Button variant="outline" onClick={() => refetch()} className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate New Insights
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights" className="flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              Financial Insights
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Key className="h-4 w-4 mr-2" />
              API Configuration
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-6 mt-6">
            {/* Search and filter section */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9" 
                  placeholder="Search insights..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  All
                </Button>
                <Button 
                  variant={selectedType === "expense-reduction" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("expense-reduction")}
                  className="flex items-center"
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Expenses
                </Button>
                <Button 
                  variant={selectedType === "savings-increase" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("savings-increase")}
                  className="flex items-center"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Savings
                </Button>
                <Button 
                  variant={selectedType === "behavioral-insight" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("behavioral-insight")}
                  className="flex items-center"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  Behavioral
                </Button>
                <Button 
                  variant={selectedType === "budget-adjustment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("budget-adjustment")}
                  className="flex items-center"
                >
                  <Target className="h-4 w-4 mr-1" />
                  Budget
                </Button>
              </div>
            </div>

            {/* Insights cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredInsights.length === 0 ? (
                <Card className="col-span-1 lg:col-span-2">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-2" />
                    <p className="text-center text-muted-foreground">
                      No financial insights match your search criteria.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedType(null);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredInsights.map((insight) => (
                  <Card key={insight.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {new Date(insight.date).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="flex items-start gap-3">
                        <div className="mt-1">
                          {getTypeIcon(insight.type)}
                        </div>
                        <div>{insight.title}</div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">
                        {insight.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">
                          {getTypeLabel(insight.type)}
                        </Badge>
                        <Button
                          variant={insight.saved ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleSaveInsight(insight.id)}
                          className="flex items-center"
                          disabled={insight.saved}
                        >
                          {insight.saved ? (
                            <>
                              <DollarSign className="h-4 w-4 mr-1" />
                              Saved to Actions
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save Action
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* AI Chat section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                  Ask Financial Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Have a specific financial question? Ask our AI assistant for personalized advice based on your financial data.
                </p>
                <div className="flex gap-2">
                  <Input placeholder="Ask a financial question..." className="flex-1" />
                  <Button>
                    <Brain className="h-4 w-4 mr-2" />
                    Ask
                  </Button>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-muted-foreground text-sm">
                  <p className="italic">Example questions:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>"How can I reduce my monthly expenses?"</li>
                    <li>"What's the best way to save for retirement based on my income?"</li>
                    <li>"Should I pay off my debt or invest more?"</li>
                    <li>"How am I spending compared to people like me?"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    OpenAI API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Configure your OpenAI API key to enable AI-powered financial insights. Your API key is stored securely in your browser and never sent to our servers.
                  </p>
                  
                  <OpenAIConfig />
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Why do I need to provide an API key?</h3>
                    <p className="text-sm text-muted-foreground">
                      ArthaFlow uses OpenAI to generate personalized financial insights based on your transaction data. 
                      By using your own API key, you maintain complete control over your data and AI usage.
                    </p>
                    <h3 className="text-sm font-medium mt-4 mb-2">How to get an OpenAI API key?</h3>
                    <p className="text-sm text-muted-foreground">
                      You can get an API key by signing up at <a href="https://platform.openai.com/signup" className="text-primary underline" target="_blank" rel="noopener noreferrer">OpenAI's platform</a>. Once logged in, navigate to API keys in your account settings and create a new secret key.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Insights;