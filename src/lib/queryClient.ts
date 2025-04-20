
import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      meta: {
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    },
  },
});
