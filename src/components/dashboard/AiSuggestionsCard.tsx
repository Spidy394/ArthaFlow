import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, Sparkles, ThumbsDown, ThumbsUp, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

type Suggestion = Tables<"suggestions">;

const API_KEY_STORAGE_KEY = 'arthaflow_openai_api_key';

const AiSuggestionsCard: React.FC = () => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, "liked" | "disliked" | null>>({});
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check if OpenAI API key is configured
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      setHasApiKey(!!apiKey && apiKey.length > 0);
    };
    
    checkApiKey();
    
    // Listen for storage events (in case API key is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === API_KEY_STORAGE_KEY) {
        checkApiKey();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch suggestions from Supabase
  const { data: suggestions = [], isLoading, refetch } = useQuery<Suggestion[]>({
    queryKey: ['ai-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: !!user && hasApiKey,
  });

  // Handle user feedback on suggestions
  const handleFeedback = async (suggestionId: string, type: "liked" | "disliked") => {
    if (!user?.id) return;
    
    // Update local state for immediate UI feedback
    setFeedback(prev => ({ ...prev, [suggestionId]: type }));
    
    // Update database with user feedback
    const { error } = await supabase
      .from('suggestions')
      .update({ 
        user_feedback: type,
        is_dismissed: true, 
      })
      .eq('id', suggestionId);
      
    if (error) {
      console.error("Error updating suggestion feedback:", error);
    }

    await refetch(); // Refresh suggestions
  };

  // Navigate through suggestions
  const handleNext = () => {
    if (currentIndex < suggestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Get the icon based on suggestion type
  const getSuggestionIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "expense_reduction": <Sparkles className="h-4 w-4" />,
      "savings_increase": <Sparkles className="h-4 w-4" />,
      "budget_adjustment": <Sparkles className="h-4 w-4" />,
      "behavioral_insight": <Sparkles className="h-4 w-4" />,
    };
    
    return iconMap[type] || <Sparkles className="h-4 w-4" />;
  };

  return (
    <Card className="col-span-1 md:col-span-2 h-96">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-arthaflow-teal" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        {!hasApiKey ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-full">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">OpenAI API Key Required</h3>
            <p className="text-sm max-w-md mx-auto mb-4">
              To enable AI-powered financial insights, please configure your OpenAI API key in the Insights section.
            </p>
            <Button asChild>
              <Link to="/insights">Configure API Key</Link>
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center h-full">
            <Sparkles className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>No suggestions available</p>
            <p className="text-sm max-w-md mx-auto">
              Add more transactions and budget data to receive personalized financial insights
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
              <span className="flex items-center">
                {getSuggestionIcon(suggestions[currentIndex].type)}
                <span className="capitalize ml-1">
                  {suggestions[currentIndex].type.replace("_", " ")}
                </span>
              </span>
              <span>
                {currentIndex + 1} of {suggestions.length}
              </span>
            </div>
            
            <div className="flex-grow flex flex-col justify-between bg-accent/50 rounded-lg p-5 relative">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {suggestions[currentIndex].title}
                </h3>
                <p className="text-muted-foreground">
                  {suggestions[currentIndex].description}
                </p>
                
                {suggestions[currentIndex].potential_impact && (
                  <div className="mt-3 p-3 bg-background rounded border">
                    <h4 className="font-medium text-sm">Potential Impact</h4>
                    <p className="text-sm text-muted-foreground">
                      {suggestions[currentIndex].potential_impact}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                {feedback[suggestions[currentIndex].id] ? (
                  <div className={cn(
                    "flex items-center justify-center p-2 rounded-md",
                    feedback[suggestions[currentIndex].id] === "liked" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  )}>
                    {feedback[suggestions[currentIndex].id] === "liked" ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Thank you for your feedback!
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        We'll improve our suggestions
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedback(suggestions[currentIndex].id, "liked")}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedback(suggestions[currentIndex].id, "disliked")}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Not Helpful
                      </Button>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentIndex === 0}
                        onClick={handlePrevious}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentIndex === suggestions.length - 1}
                        onClick={handleNext}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AiSuggestionsCard;
