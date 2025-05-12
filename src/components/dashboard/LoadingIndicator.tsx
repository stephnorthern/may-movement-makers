
import { Loader2, AlertTriangle } from "lucide-react";
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
