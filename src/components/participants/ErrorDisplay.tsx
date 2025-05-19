
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCcw, Wifi, WifiOff, HelpCircle, Database } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

interface ErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
  refreshing: boolean;
}

const ErrorDisplay = ({ error, onRetry, refreshing }: ErrorDisplayProps) => {
  const [showingDetails, setShowingDetails] = useState(false);
  
  if (!error) return null;
  
  const errorMessage = error.message.toLowerCase();
  const isNetworkError = errorMessage.includes('network') || 
                         errorMessage.includes('connection') ||
                         errorMessage.includes('failed to fetch') ||
                         errorMessage.includes('timeout') ||
                         errorMessage.includes('cors') ||
                         navigator.onLine === false;
  
  // Check if error is specific to Supabase
  const isSupabaseError = errorMessage.includes('supabase') || 
                          errorMessage.includes('database');
  
  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          {isNetworkError ? (
            <WifiOff className="h-6 w-6" />
          ) : isSupabaseError ? (
            <Database className="h-6 w-6" />
          ) : (
            <AlertCircle className="h-6 w-6" />
          )}
          <h3 className="text-lg font-medium">
            {isNetworkError ? 'Network Connection Error' : 
             isSupabaseError ? 'Database Connection Error' : 
             'Data Loading Error'}
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
                <li>Your internet connection is down or unstable</li>
                <li>The database server might be temporarily unavailable</li>
                <li>There might be network restrictions blocking the connection</li>
                <li>Your browser might have cached an error state</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {(isSupabaseError || isNetworkError) && (
          <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <HelpCircle className="h-4 w-4 text-blue-500" />
            <AlertTitle>Troubleshooting Steps</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Check your internet connection</li>
                <li><strong>Try refreshing the page</strong> (sometimes this is all that's needed)</li>
                <li>Clear your browser cache or try in an incognito/private window</li>
                <li>If using a VPN or firewall, temporarily disable them to test</li>
                <li>Wait a few minutes and try again (the service might be experiencing temporary issues)</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button 
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={onRetry}
            disabled={refreshing}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          
          <Button
            variant="outline"
            className="text-slate-600"
            onClick={() => setShowingDetails(!showingDetails)}
          >
            {showingDetails ? "Hide Technical Details" : "Show Technical Details"}
          </Button>
        </div>
        
        {showingDetails && (
          <div className="mt-4 p-3 bg-slate-100 rounded-md text-xs font-mono overflow-x-auto">
            <p className="text-slate-500">Error details:</p>
            <pre className="whitespace-pre-wrap">{error.toString()}</pre>
            {error.stack && (
              <>
                <p className="mt-2 text-slate-500">Stack trace:</p>
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;
