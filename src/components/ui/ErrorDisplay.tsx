import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorDisplayProps {
  message: string;
  retry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, retry }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {retry && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={retry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;
