import { useToast } from "@/components/ui/use-toast";
import { 
  handleSupabaseError, 
  shouldShowErrorToUser, 
  shouldLogError,
  type SupabaseError 
} from "@/lib/supabase-error-handler";

interface ErrorHandlerOptions {
  context?: string;
  defaultMessage?: string;
  showToast?: boolean;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (
    error: SupabaseError, 
    defaultMessage = "An error occurred",
    options: ErrorHandlerOptions = {}
  ) => {
    // Get formatted error message
    const errorMessage = handleSupabaseError(error, {
      context: options.context,
      defaultMessage: options.defaultMessage || defaultMessage
    });

    // Show toast if enabled and error should be shown to user
    if (options.showToast !== false && shouldShowErrorToUser(error)) {
      toast({
        title: options.context || "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }

    // Log error if it should be logged
    if (shouldLogError(error)) {
      console.error(`[${options.context || 'Error'}]:`, error);
    }

    return errorMessage;
  };

  return { handleError };
};
