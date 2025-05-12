
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const LoadingIndicator = () => {
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
