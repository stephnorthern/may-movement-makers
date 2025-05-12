
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

const LoadingIndicator = ({ error, retryFn }: { 
  error?: Error | null;
  retryFn?: () => void;
}) => {
  const [loadingDuration, setLoadingDuration] = useState(0);
  
  // Track how long loading has been in progress
  useEffect(() => {
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      setLoadingDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Show different messages based on loading duration
  const getLoadingMessage = () => {
    if (loadingDuration > 15) {
      return "This is taking longer than expected. Please check your connection...";
    } else if (loadingDuration > 8) {
      return "Still loading data, please wait a moment...";
    }
    return "This may take a moment as we fetch your data";
  };

  // Get more specific error guidance based on error message
  const getErrorGuidance = () => {
    if (!error) return null;
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes("connection") || errorMessage.includes("network")) {
      return (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-amber-800">Connection Issue Detected</span>
          </div>
          <p className="text-amber-700">
            Please check your internet connection and ensure you have access to the database.
          </p>
        </div>
      );
    }
    
    if (errorMessage.includes("permission") || errorMessage.includes("access") || errorMessage.includes("denied")) {
      return (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-amber-800">Permission Issue Detected</span>
          </div>
          <p className="text-amber-700">
            You may not have the correct permissions to access this data. Please contact your administrator.
          </p>
        </div>
      );
    }
    
    return null;
  };

  // If there's an error, show error message instead
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex flex-col items-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <p className="text-lg font-medium text-gray-700">Error Loading Data</p>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {error.message || "An unknown error occurred"}
          </p>
          
          {getErrorGuidance()}
          
          {retryFn && (
            <button 
              onClick={retryFn}
              className="mt-4 px-4 py-2 bg-movement-purple text-white rounded-md hover:bg-movement-dark-purple transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="inline-flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-movement-green animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading data...</p>
        <p className="text-sm text-gray-500 mt-2">
          {getLoadingMessage()}
        </p>
        {loadingDuration > 15 && (
          <div className="mt-4 text-sm">
            <p className="text-amber-600">
              If this persists, try refreshing the page or checking your network connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;
