
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { OpenAIService, generateFinancialInsights } from "@/integrations/openai/service";

export const useAISuggestions = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: suggestions, isLoading, refetch } = useQuery({
    queryKey: ["ai-suggestions", user?.id],
    queryFn: async () => {
      setIsGenerating(true);
      try {
        if (!user?.id) return "";
        const insights = await generateFinancialInsights(user.id);
        return insights;
      } finally {
        setIsGenerating(false);
      }
    },
    enabled: false, // Don't fetch on mount
  });

  return {
    suggestions,
    isLoading: isLoading || isGenerating,
    regenerate: refetch,
  };
};
