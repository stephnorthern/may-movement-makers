
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface ErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
  refreshing: boolean;
}

const ErrorDisplay = ({ error, onRetry, refreshing }: ErrorDisplayProps) => {
  if (!error) return null;
  
  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle className="h-6 w-6" />
          <h3 className="text-lg font-medium">Data Loading Error</h3>
        </div>
        <p className="mb-4">{error.message || "We encountered a problem loading participant data. This could be due to connectivity issues or database problems."}</p>
        <Button 
          variant="outline" 
          className="border-red-300 hover:bg-red-100"
          onClick={onRetry}
          disabled={refreshing}
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;
