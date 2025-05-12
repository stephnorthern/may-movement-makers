
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCcw, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
  refreshing: boolean;
}

const ErrorDisplay = ({ error, onRetry, refreshing }: ErrorDisplayProps) => {
  if (!error) return null;
  
  const isNetworkError = error.message.toLowerCase().includes('network') || 
                         error.message.toLowerCase().includes('connection') ||
                         error.message.toLowerCase().includes('failed to fetch');
  
  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          {isNetworkError ? (
            <WifiOff className="h-6 w-6" />
          ) : (
            <AlertCircle className="h-6 w-6" />
          )}
          <h3 className="text-lg font-medium">
            {isNetworkError ? 'Network Connection Error' : 'Data Loading Error'}
          </h3>
        </div>
        
        <p className="mb-4">{error.message || "We encountered a problem loading participant data."}</p>
        
        {isNetworkError && (
          <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
            <Wifi className="h-4 w-4 text-amber-500" />
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription>
              The application is having trouble connecting to the database. This could be due to:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Your internet connection is down</li>
                <li>The database server might be temporarily unavailable</li>
                <li>There might be network restrictions blocking the connection</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
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
